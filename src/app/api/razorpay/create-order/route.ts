import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types/order";
import { SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import {
  isValidIndianPincode,
  isValidGujaratPincode,
  calculateOrderTotals,
} from "@/lib/financials";
import { validateCouponEngine } from "@/lib/couponManager";
import { validateCsrfOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  validateOrderContacts,
  isContactProofTokenConsumed,
} from "@/lib/contactVerification";

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `AVS-${year}${month}${day}-${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing payment creation
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit(`razorpay-create-order:${ip}`, 15, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many payment creation attempts. Please retry in ${rateCheck.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    let currentUserId = user?.id;
    if (!currentUserId) {
      currentUserId = "7a3b2e24-820f-4706-8cc3-4218b42b0da3"; // System guest user ID
    }
    const isGuest = !user;

    const body = await request.json();
    const {
      shipping_address_id,
      shipping_address_snapshot,
      items,
      coupon_code,
      notes,
    } = body;

    if (!shipping_address_snapshot) {
      return NextResponse.json(
        { success: false, message: "A valid delivery address snapshot is required." },
        { status: 400 }
      );
    }

    const postalCode = shipping_address_snapshot.postal_code;
    if (!isValidIndianPincode(postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid postal code: Postal code "${postalCode || "empty"}" must be a valid 6-digit Indian PIN code.`,
        },
        { status: 400 }
      );
    }

    // Contact Verification: Ensure both WhatsApp Phone and Email are verified
    let userProfile: { phone_number?: string | null; phone_verified?: boolean | null; email?: string | null } | null = null;
    if (user?.id) {
      try {
        const { data: prof, error: profErr } = await getAdminSupabaseClient()
          .from("profiles")
          .select("phone_number, phone_verified, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profErr) {
          const fallback = await getAdminSupabaseClient()
            .from("profiles")
            .select("phone_number, email")
            .eq("id", user.id)
            .maybeSingle();
          userProfile = fallback.data;
        } else {
          userProfile = prof;
        }
      } catch {
        // Non-blocking fallback
      }
    }

    const contactCheck = validateOrderContacts({
      phone: shipping_address_snapshot.phone_number,
      email: shipping_address_snapshot.email,
      verificationTokens: body.verification_tokens,
      user,
      userProfile,
    });

    if (!contactCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          code: "CONTACT_VERIFICATION_REQUIRED",
          message: contactCheck.error || "Contact verification required.",
          phoneVerified: contactCheck.phoneVerified,
          emailVerified: contactCheck.emailVerified,
        },
        { status: 400 }
      );
    }

    // Check single-use proof token replay prevention
    if (body.verification_tokens?.phone_token) {
      const isConsumed = await isContactProofTokenConsumed(body.verification_tokens.phone_token);
      if (isConsumed) {
        return NextResponse.json(
          {
            success: false,
            code: "TOKEN_ALREADY_USED",
            message:
              "This WhatsApp verification code has already been used for an order. Please verify again.",
          },
          { status: 400 }
        );
      }
    }
    if (body.verification_tokens?.email_token) {
      const isConsumed = await isContactProofTokenConsumed(body.verification_tokens.email_token);
      if (isConsumed) {
        return NextResponse.json(
          {
            success: false,
            code: "TOKEN_ALREADY_USED",
            message:
              "This Email verification code has already been used for an order. Please verify again.",
          },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Shopping bag cannot be empty." },
        { status: 400 }
      );
    }

    // 1. Verify product pricing & stock server-side strictly against canonical database or seed catalog
    const adminClient = getAdminSupabaseClient();
    const productIds = items
      .map((i: { product_id: string }) => i.product_id)
      .filter((id): id is string => Boolean(id));

    const priceMap = new Map<string, { price: number; name: string; inDb: boolean; stockCount: number | null }>();

    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await adminClient
          .from("products")
          .select("id, price, name, stock_count")
          .in("id", productIds);

        if (dbProducts) {
          for (const p of dbProducts) {
            priceMap.set(p.id, {
              price: Number(p.price),
              name: p.name,
              inDb: true,
              stockCount: p.stock_count == null ? null : Number(p.stock_count),
            });
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Canonical price query warning:", dbErr);
      }
    }

    // Populate missing items from static verified seed catalog
    for (const seed of SEED_CATALOG_PRODUCTS) {
      if (!priceMap.has(seed.id)) {
        priceMap.set(seed.id, {
          price: seed.price,
          name: seed.name,
          inDb: false,
          stockCount: seed.stock_count ?? null,
        });
      }
    }

    let rawSubtotal = 0;
    const requestedQtyByProduct = new Map<string, number>();
    const sanitizedItems: Array<{
      product_id: string | null;
      catalog_product_id: string;
      product_name: string;
      image_url: string;
      size: string;
      color: string;
      tailored_blouse: boolean;
      unit_price: number;
      quantity: number;
      total_price: number;
    }> = [];

    for (const item of items) {
      if (!item.product_id || !priceMap.has(item.product_id)) {
        return NextResponse.json(
          {
            success: false,
            message: `Unverified product: "${item.product_name || "Unknown item"}". Every piece in your shopping bag must be verified in our catalog.`,
          },
          { status: 400 }
        );
      }

      const verified = priceMap.get(item.product_id)!;
      const verifiedPrice = verified.price;

      if (typeof verifiedPrice !== "number" || verifiedPrice <= 0 || isNaN(verifiedPrice)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid product pricing configuration for "${item.product_name || verified.name}".`,
          },
          { status: 400 }
        );
      }

      const rawQty = Number(item.quantity);
      if (!Number.isFinite(rawQty) || !Number.isInteger(rawQty) || rawQty < 1 || rawQty > 50) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid quantity for "${item.product_name || verified.name}". Quantity must be a whole number between 1 and 50.`,
          },
          { status: 400 }
        );
      }
      const quantity = rawQty;
      const cumulativeQty = (requestedQtyByProduct.get(item.product_id) || 0) + quantity;
      requestedQtyByProduct.set(item.product_id, cumulativeQty);

      if (verified.inDb && verified.stockCount !== null && verified.stockCount < cumulativeQty) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${item.product_name || verified.name}". Only ${verified.stockCount} available.`,
          },
          { status: 400 }
        );
      }

      const totalPrice = verifiedPrice * quantity;
      rawSubtotal += totalPrice;

      sanitizedItems.push({
        product_id: verified.inDb ? item.product_id : null,
        catalog_product_id: item.product_id,
        product_name: item.product_name || verified.name,
        image_url: item.image_url || "/images/botanical_flowers.jpg",
        size: item.size || "Standard Size",
        color: item.color || "Default",
        tailored_blouse: Boolean(item.tailored_blouse),
        unit_price: verifiedPrice,
        quantity,
        total_price: totalPrice,
      });
    }

    // 2. Validate Coupon Code (enforce guest per-contact limit using checkout contact)
    let discountAmount = 0;
    let validatedCoupon: string | null = null;
    let isFreeShippingCoupon = false;

    if (coupon_code && coupon_code.trim()) {
      const coupValidation = await validateCouponEngine({
        code: coupon_code.trim(),
        subtotal: rawSubtotal,
        userId: isGuest ? null : currentUserId,
        contact: shipping_address_snapshot?.email || shipping_address_snapshot?.phone_number || null,
      });

      if (!coupValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: coupValidation.message || "Invalid promotional code.",
          },
          { status: 400 }
        );
      }

      discountAmount = coupValidation.discountAmount || 0;
      validatedCoupon = coupValidation.coupon?.code || coupon_code.trim().toUpperCase();
      if (coupValidation.coupon?.discount_type === "free_shipping") {
        isFreeShippingCoupon = true;
      }
    }

    // 3. Compute Financial Totals (Inclusive 5% GST & Logistics)
    const financials = calculateOrderTotals({
      subtotal: rawSubtotal,
      discountAmount,
      paymentMethod: "Razorpay",
      customShippingFee: isFreeShippingCoupon ? 0 : undefined,
    });

    const amountInPaise = Math.round(financials.totalAmount * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum payable order amount for Razorpay checkout is ₹1.00 (100 paise).",
        },
        { status: 400 }
      );
    }
    const orderNumber = generateOrderNumber();
    const orderStatus: OrderStatus = "Pending";
    const paymentStatus: PaymentStatus = "Pending";

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sanitizedAddressId =
      shipping_address_id && isUuid.test(shipping_address_id)
        ? shipping_address_id
        : null;

    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + 3);

    const orderPayload = {
      user_id: currentUserId,
      shipping_address_id: sanitizedAddressId,
      shipping_address_snapshot: {
        ...shipping_address_snapshot,
        verification_tokens: body.verification_tokens || null,
      },
      order_number: orderNumber,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      shipping_fee: financials.shippingFee,
      total_amount: financials.totalAmount,
      coupon_code: validatedCoupon,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: "Razorpay",
      notes: notes || null,
      courier_partner: postalCode.startsWith("395")
        ? "Avsaraa Dedicated Express Courier"
        : isValidGujaratPincode(postalCode)
        ? "Blue Dart Express Gujarat"
        : "Shiprocket Air Express",
      tracking_number: `BLUEDART-${crypto.randomInt(100000000, 999999999)}`,
      estimated_delivery: estDelivery.toISOString(),
    };

    let createdOrder: Order | null = null;
    let createdItems: OrderItem[] = [];

    try {
      const { data: dbOrder, error: orderErr } = await adminClient
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (!orderErr && dbOrder) {
        createdOrder = dbOrder as Order;

        const itemsToInsert = sanitizedItems.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          image_url: item.image_url,
          size: item.size,
          color: item.color,
          tailored_blouse: item.tailored_blouse,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
        }));

        const { data: dbItems, error: itemsErr } = await adminClient
          .from("order_items")
          .insert(itemsToInsert)
          .select();

        if (itemsErr || !dbItems || dbItems.length === 0) {
          console.error("Razorpay create-order order_items insert error:", itemsErr?.message);
          await adminClient.from("orders").delete().eq("id", dbOrder.id);
          createdOrder = null;
        } else {
          createdItems = dbItems as OrderItem[];
        }
      } else if (orderErr) {
        console.error("Razorpay create-order orders insert error:", orderErr.message);
      }
    } catch (dbEx) {
      console.warn("Notice: Database orders insert warning:", dbEx);
    }

    if (!createdOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create order record in database before initiating payment.",
        },
        { status: 500 }
      );
    }

    // 4. Create Order with Razorpay REST API
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      await adminClient.from("orders").delete().eq("id", createdOrder.id);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, message: "Payment gateway configuration is missing in production." },
          { status: 500 }
        );
      }
      throw new Error(
        "Razorpay credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) must be configured."
      );
    }

    const isNonProduction = process.env.NODE_ENV !== "production";
    const isLiveGateway = keyId.startsWith("rzp_live_");
    const isMockDemoMode =
      isNonProduction && (!keyId || keyId.includes("demo") || keyId.includes("your_key_here"));

    let razorpayOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    let rzpGatewaySucceeded = false;
    let rzpHttpStatus = 0;

    try {
      // Call Razorpay API with live/test credentials
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: orderNumber,
          notes: {
            order_id: createdOrder.id,
            order_number: orderNumber,
            customer_name: shipping_address_snapshot.recipient_name,
            customer_phone: shipping_address_snapshot.phone_number,
            customer_email: shipping_address_snapshot.email || "",
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      rzpHttpStatus = rzpRes.status;
      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        if (rzpData?.id) {
          razorpayOrderId = rzpData.id;
          rzpGatewaySucceeded = true;
        }
      } else {
        const errData = await rzpRes.json().catch(() => null);
        console.warn(
          "Notice: Razorpay API returned non-200:",
          rzpHttpStatus,
          errData
        );
      }
    } catch (rzpErr) {
      console.warn("Notice: Razorpay order API error:", rzpErr);
    }

    if (!rzpGatewaySucceeded && !isMockDemoMode) {
      await adminClient.from("orders").delete().eq("id", createdOrder.id);
      if (rzpHttpStatus === 401) {
        return NextResponse.json(
          {
            success: false,
            message: "Razorpay authentication failed. Please verify merchant API credentials.",
          },
          { status: 401 }
        );
      }
      if (isLiveGateway || !isNonProduction) {
        return NextResponse.json(
          {
            success: false,
            message: "Unable to initialize Razorpay payment gateway. Please retry shortly.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: "Unable to create Razorpay order. Please check gateway configuration and try again.",
        },
        { status: 502 }
      );
    }

    // Bind generated razorpay_order_id strictly to this order in orders.shipping_address_snapshot and best-effort payments row
    const { error: snapBindErr } = await adminClient
      .from("orders")
      .update({
        shipping_address_snapshot: {
          ...(createdOrder.shipping_address_snapshot as unknown as Record<string, unknown>),
          razorpay_order_id: razorpayOrderId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", createdOrder.id);

    if (snapBindErr) {
      console.error("Razorpay create-order snapshot bind error:", snapBindErr.message);
      await adminClient.from("orders").delete().eq("id", createdOrder.id);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to persist payment binding record.",
        },
        { status: 500 }
      );
    }

    const { error: bindErr } = await adminClient.from("payments").insert({
      order_id: createdOrder.id,
      gateway: "Razorpay",
      transaction_id: razorpayOrderId,
      amount: financials.totalAmount,
      currency: "INR",
      status: "Pending",
      raw_payload: {
        razorpay_order_id: razorpayOrderId,
        order_id: createdOrder.id,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
      },
    });

    if (bindErr) {
      console.warn("Razorpay create-order pending payments row notice:", bindErr.message);
    }

    let testPaymentId: string | undefined;
    let testSignature: string | undefined;

    // Sandbox test credentials only generated in local non-production environments with mock demo keys
    if (isMockDemoMode) {
      testPaymentId = `pay_test_${Date.now()}`;
      testSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${testPaymentId}`)
        .digest("hex");
    }

    return NextResponse.json({
      success: true,
      order: {
        ...createdOrder,
        order_items: createdItems,
      },
      razorpay_order_id: razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key_id: keyId,
      order_id: createdOrder.id,
      order_number: orderNumber,
      is_demo: isMockDemoMode,
      ...(isMockDemoMode ? { test_payment_id: testPaymentId, test_signature: testSignature } : {}),
    });
  } catch (err: unknown) {
    console.error("Razorpay create-order unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
