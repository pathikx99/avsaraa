import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { Order, OrderItem, CreateOrderPayload, PaymentStatus, OrderStatus } from "@/types/order";
import {
  isValidIndianPincode,
  isValidGujaratPincode,
  calculateOrderTotals,
} from "@/lib/financials";
import { validateCouponEngine, incrementCouponUsage } from "@/lib/couponManager";
import { dispatchOrderSuccessEmails } from "@/lib/emailService";
import { deductInventory } from "@/lib/inventory";
import { validateCsrfOrigin } from "@/lib/csrf";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { generateSequentialOrderNumber, formatOrderNumber, extractTrailingSequence } from "@/lib/idGenerator";
import { headers } from "next/headers";
import {
  validateOrderContacts,
  isContactProofTokenConsumed,
  consumeContactProofTokens,
} from "@/lib/contactVerification";

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing order creation
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";
    const rateCheck = await checkDbRateLimit(`order-place:${ip}`, 10, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many order attempts. Please retry in ${rateCheck.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 1. Authenticate Requester (or enable Guest Checkout)
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user: cookieUser },
    } = await serverClient.auth.getUser();

    let authenticatedUser = cookieUser;
    if (!authenticatedUser) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: jwtData } = await serverClient.auth.getUser(token);
        if (jwtData?.user) {
          authenticatedUser = jwtData.user;
        }
      }
    }

    // Guest Checkout Support:
    // When unauthenticated, route through system guest account for seamless zero-friction purchase
    const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
    const isGuest = !authenticatedUser?.id;
    const currentUserId = authenticatedUser?.id || GUEST_SYSTEM_USER_ID;

    // 2. Parse and Validate Request Payload
    const body = (await request.json()) as CreateOrderPayload;
    const {
      shipping_address_id,
      shipping_address_snapshot,
      items,
      coupon_code,
      payment_method,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Your shopping bag is empty." },
        { status: 400 }
      );
    }

    if (
      !shipping_address_snapshot ||
      !shipping_address_snapshot.recipient_name ||
      !shipping_address_snapshot.phone_number ||
      !shipping_address_snapshot.address_line1 ||
      !shipping_address_snapshot.city ||
      !shipping_address_snapshot.postal_code
    ) {
      return NextResponse.json(
        { success: false, message: "A complete delivery address is required." },
        { status: 400 }
      );
    }

    if (isGuest) {
      shipping_address_snapshot.is_guest = true;
      if (!shipping_address_snapshot.email || !shipping_address_snapshot.email.includes("@")) {
        return NextResponse.json(
          { success: false, message: "A valid email address is required for guest checkout." },
          { status: 400 }
        );
      }
    }

    // 2.1 Contact Verification: Ensure both WhatsApp Phone and Email are verified
    let userProfile: { phone_number?: string | null; phone_verified?: boolean | null; email?: string | null } | null = null;
    if (authenticatedUser?.id) {
      try {
        const { data: prof, error: profErr } = await getAdminSupabaseClient()
          .from("profiles")
          .select("phone_number, phone_verified, email")
          .eq("id", authenticatedUser.id)
          .maybeSingle();

        if (profErr) {
          const fallback = await getAdminSupabaseClient()
            .from("profiles")
            .select("phone_number, email")
            .eq("id", authenticatedUser.id)
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
      user: authenticatedUser,
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

    // 3. Pan-India 6-Digit PIN Code Validation
    const postalCode = shipping_address_snapshot.postal_code;
    if (!isValidIndianPincode(postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid postal code: Pin code "${postalCode || "empty"}" must be a valid 6-digit Indian PIN code.`,
        },
        { status: 400 }
      );
    }

    // 4. Compute Financials & Validate Items with Canonical Database Prices
    const adminClient = getAdminSupabaseClient();
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIds = Array.from(
      new Set(
        items
          .map((item) => item.product_id)
          .filter((id): id is string => typeof id === "string" && UUID_REGEX.test(id.trim()))
      )
    );

    // Fetch verified prices & stock from database
    const priceMap = new Map<string, { price: number; inDb: boolean; stockCount: number | null }>();
    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await adminClient
          .from("products")
          .select("id, price, stock_count")
          .in("id", productIds);

        if (dbProducts) {
          for (const p of dbProducts) {
            priceMap.set(p.id, {
              price: Number(p.price),
              inDb: true,
              stockCount: p.stock_count == null ? null : Number(p.stock_count),
            });
          }
        }
      } catch (err) {
        console.warn("Notice: Canonical price query notice:", err);
      }
    }

    let rawSubtotal = 0;
    const requestedQtyByProduct = new Map<string, number>();
    const sanitizedItems: OrderItem[] = [];

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
            message: `Invalid product pricing configuration for "${item.product_name}".`,
          },
          { status: 400 }
        );
      }

      const rawQty = Number(item.quantity);
      if (!Number.isFinite(rawQty) || !Number.isInteger(rawQty) || rawQty < 1 || rawQty > 50) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid quantity for "${item.product_name}". Quantity must be a whole number between 1 and 50.`,
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
            message: `Insufficient stock for "${item.product_name}". Only ${verified.stockCount} available.`,
          },
          { status: 400 }
        );
      }

      const totalPrice = verifiedPrice * quantity;
      rawSubtotal += totalPrice;

      sanitizedItems.push({
        product_id: verified.inDb ? item.product_id : undefined,
        product_name: item.product_name,
        image_url: item.image_url || "/images/botanical_flowers.jpg",
        size: item.size || "Standard",
        color: item.color || "Default",
        tailored_blouse: Boolean(item.tailored_blouse),
        unit_price: verifiedPrice,
        quantity,
        total_price: totalPrice,
      });
    }

    // 5. Validate Coupon Code
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
            message: coupValidation.message || "Invalid or ineligible promotion code.",
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

    const ALLOWED_PAYMENT_METHODS = ["Online Card / UPI", "Razorpay", "Cashfree", "COD"];
    const resolvedPaymentMethod = payment_method || "Razorpay";
    if (!ALLOWED_PAYMENT_METHODS.includes(resolvedPaymentMethod)) {
      return NextResponse.json(
        { success: false, message: `Unsupported payment method "${resolvedPaymentMethod}".` },
        { status: 400 }
      );
    }

    // 6. Comprehensive Financial Breakdown (Courier fee, COD surcharge, 5% GST inclusive)
    const financials = calculateOrderTotals({
      subtotal: rawSubtotal,
      discountAmount,
      paymentMethod: resolvedPaymentMethod,
      customShippingFee: isFreeShippingCoupon ? 0 : undefined,
    });

    const isCOD = resolvedPaymentMethod === "COD";
    const orderStatus: OrderStatus = isCOD ? "Confirmed" : "Pending";
    const paymentStatus: PaymentStatus = "Pending";
    let orderNumber = await generateSequentialOrderNumber(adminClient);

    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + 3);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sanitizedAddressId = shipping_address_id && isUuid.test(shipping_address_id)
      ? shipping_address_id
      : null;

    const baseOrderPayload = {
      user_id: currentUserId,
      shipping_address_id: sanitizedAddressId,
      shipping_address_snapshot: shipping_address_snapshot,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      shipping_fee: financials.shippingFee + financials.codSurcharge, // Total logistics fee
      total_amount: financials.totalAmount,
      coupon_code: validatedCoupon,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: resolvedPaymentMethod,
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

    let dbOrder: Record<string, unknown> | null = null;
    let orderErr: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const insertAttempt = await adminClient
        .from("orders")
        .insert({ ...baseOrderPayload, order_number: orderNumber })
        .select()
        .single();
      dbOrder = insertAttempt.data as Record<string, unknown> | null;
      orderErr = insertAttempt.error;
      if (!orderErr && dbOrder) break;
      if (orderErr?.code === "23505" && orderErr.message?.includes("order_number")) {
        orderNumber = formatOrderNumber(extractTrailingSequence(orderNumber) + 1);
        continue;
      }
      break;
    }

    if (orderErr || !dbOrder) {
      throw new Error(
        `Failed to create order in database: ${orderErr?.message || "Insert returned no order record."}`
      );
    }

    createdOrder = dbOrder as unknown as Order;

    const dbOrderId = String(dbOrder.id);

    // Insert order items (rollback order row on failure so no orphaned orders remain)
    const itemsToInsert = sanitizedItems.map((item) => ({
      order_id: dbOrderId,
      ...item,
    }));

    const { data: dbItems, error: itemsErr } = await adminClient
      .from("order_items")
      .insert(itemsToInsert)
      .select();

    if (itemsErr || !dbItems || dbItems.length === 0) {
      await adminClient.from("orders").delete().eq("id", dbOrderId);
      throw new Error(
        `Failed to create order items in database: ${itemsErr?.message || "Insert returned no order items."}`
      );
    }

    createdItems = dbItems as OrderItem[];

    // Atomically deduct inventory stock BEFORE consuming single-use tokens/coupons or sending emails (AVS-004 / AVS-005)
    const dbProductIds = new Set(
      Array.from(priceMap.entries())
        .filter(([, meta]) => meta.inDb)
        .map(([id]) => id)
    );
    const dbBackedItems = sanitizedItems.filter((item) => item.product_id && dbProductIds.has(item.product_id));
    if (dbBackedItems.length > 0) {
      const invResult = await deductInventory(adminClient, dbBackedItems);
      if (!invResult.success) {
        // Restore any subset that succeeded before the failed product to maintain exact stock invariant
        const failedIds = new Set(invResult.failedProducts.map((f) => f.productId));
        for (const item of dbBackedItems) {
          if (item.product_id && !failedIds.has(item.product_id)) {
            await adminClient.rpc("increment_stock", { p_id: item.product_id, p_qty: item.quantity });
          }
        }
        await adminClient.from("orders").delete().eq("id", dbOrder.id);
        return NextResponse.json(
          {
            success: false,
            message: "One or more selected pieces just sold out. Your order was not placed.",
          },
          { status: 400 }
        );
      }
    }

    // Single-use proof token deduplication: consume tokens only after stock deduction succeeds
    if (body.verification_tokens) {
      await consumeContactProofTokens(body.verification_tokens, adminClient);
    }

    // Insert payment record
    await adminClient.from("payments").insert({
      order_id: dbOrder.id,
      gateway: isCOD ? "Cash on Delivery" : payment_method,
      transaction_id: isCOD
        ? `COD-${orderNumber}`
        : `TXN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      amount: financials.totalAmount,
      currency: "INR",
      status: paymentStatus,
      raw_payload: {
        method: payment_method,
        paid_at: new Date().toISOString(),
        cod_surcharge: financials.codSurcharge,
        gst_amount: financials.gstAmount,
        taxable_amount: financials.taxableAmount,
        notes,
      },
    });

    // Increment coupon used_count on successful placement, guarded by usage limits (AVS-006)
    if (validatedCoupon) {
      await incrementCouponUsage(adminClient, validatedCoupon);
    }

    const finalOrderWithItems = {
      ...createdOrder,
      order_items: createdItems,
    };

    // If order is confirmed immediately (e.g. COD), dispatch confirmation & alert emails
    if (isCOD) {
      dispatchOrderSuccessEmails(finalOrderWithItems).catch((e) =>
        console.warn("Notice: COD background email dispatch error:", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      financials: {
        ...financials,
        inclusive_gst_rate: "5%",
      },
      order: finalOrderWithItems,
    });
  } catch (err: unknown) {
    console.error("Order creation unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", orders: [] },
        { status: 401 }
      );
    }

    const adminClient = getAdminSupabaseClient();
    try {
      const { data: orders, error } = await adminClient
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: true, orders: [] });
      }

      const sanitizedOrders = (orders || []).map((ord) => {
        if (ord.shipping_address_snapshot && typeof ord.shipping_address_snapshot === "object") {
          const cleanedSnap = { ...(ord.shipping_address_snapshot as Record<string, unknown>) };
          delete cleanedSnap.verification_tokens;
          return { ...ord, shipping_address_snapshot: cleanedSnap };
        }
        return ord;
      });

      return NextResponse.json({ success: true, orders: sanitizedOrders });
    } catch {
      return NextResponse.json({ success: true, orders: [] });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching orders";
    return NextResponse.json({ success: false, message, orders: [] }, { status: 500 });
  }
}
