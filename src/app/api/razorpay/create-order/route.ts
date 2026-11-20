import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types/order";
import { SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import {
  isValidGujaratPincode,
  calculateOrderTotals,
} from "@/lib/financials";
import { validateCouponEngine } from "@/lib/couponManager";

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AVS-${year}${month}${day}-${randomSuffix}`;
}

export async function POST(request: Request) {
  try {
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
    if (!isValidGujaratPincode(postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Delivery restriction: Postal code "${postalCode}" is outside Gujarat. Avsaraa currently delivers exclusively within Gujarat (360000–399999).`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Shopping bag cannot be empty." },
        { status: 400 }
      );
    }

    // 1. Verify product pricing server-side strictly against canonical database or seed catalog
    const adminClient = getAdminSupabaseClient();
    const productIds = items
      .map((i: { product_id: string }) => i.product_id)
      .filter((id): id is string => Boolean(id));

    const priceMap = new Map<string, { price: number; name: string }>();

    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await adminClient
          .from("products")
          .select("id, price, name")
          .in("id", productIds);

        if (dbProducts) {
          for (const p of dbProducts) {
            priceMap.set(p.id, { price: Number(p.price), name: p.name });
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Canonical price query warning:", dbErr);
      }
    }

    // Populate missing items from static verified seed catalog
    for (const seed of SEED_CATALOG_PRODUCTS) {
      if (!priceMap.has(seed.id)) {
        priceMap.set(seed.id, { price: seed.price, name: seed.name });
      }
    }

    let rawSubtotal = 0;
    const sanitizedItems: Array<{
      product_id: string;
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

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const totalPrice = verifiedPrice * quantity;
      rawSubtotal += totalPrice;

      sanitizedItems.push({
        product_id: item.product_id,
        product_name: item.product_name || verified.name,
        image_url: item.image_url || "/images/placeholder.jpg",
        size: item.size || "Standard Size",
        color: item.color || "Default",
        tailored_blouse: Boolean(item.tailored_blouse),
        unit_price: verifiedPrice,
        quantity,
        total_price: totalPrice,
      });
    }

    // 2. Validate Coupon Code
    let discountAmount = 0;
    let validatedCoupon: string | null = null;
    let isFreeShippingCoupon = false;

    if (coupon_code && coupon_code.trim()) {
      const coupValidation = await validateCouponEngine({
        code: coupon_code.trim(),
        subtotal: rawSubtotal,
        userId: isGuest ? null : currentUserId,
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
      paymentMethod: "Online Card / UPI",
      customShippingFee: isFreeShippingCoupon ? 0 : undefined,
    });

    const amountInPaise = Math.round(financials.totalAmount * 100);
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
      shipping_address_snapshot,
      order_number: orderNumber,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      shipping_fee: financials.shippingFee,
      total_amount: financials.totalAmount,
      coupon_code: validatedCoupon,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: "Online Card / UPI",
      notes: notes || null,
      courier_partner: postalCode.startsWith("395")
        ? "Avsaraa Dedicated Surat Courier"
        : "Blue Dart Express Gujarat",
      tracking_number: `BLUEDART-${Math.floor(100000000 + Math.random() * 900000000)}`,
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
          ...item,
        }));

        const { data: dbItems } = await adminClient
          .from("order_items")
          .insert(itemsToInsert)
          .select();

        if (dbItems) {
          createdItems = dbItems as OrderItem[];
        }
      }
    } catch (dbEx) {
      console.warn("Notice: Database orders insert warning:", dbEx);
    }

    if (!createdOrder) {
      const fallbackId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      createdOrder = {
        id: fallbackId,
        ...orderPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Order;

      createdItems = sanitizedItems.map((item, idx) => ({
        id: `item-${fallbackId}-${idx + 1}`,
        order_id: fallbackId,
        ...item,
        created_at: new Date().toISOString(),
      }));
    }

    // 4. Create Order with Razorpay REST API
    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_avsaraa_demo";
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "avsaraa_test_razorpay_secret_key_2026";

    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      // Call Razorpay API if live/test credentials are ready
      if (keyId && keySecret && !keyId.includes("your_key_here")) {
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

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          if (rzpData?.id) {
            razorpayOrderId = rzpData.id;
          }
        } else {
          const errData = await rzpRes.json().catch(() => null);
          console.warn(
            "Notice: Razorpay API returned non-200 (using simulated order for development):",
            errData
          );
        }
      }
    } catch (rzpErr) {
      console.warn("Notice: Razorpay order API notice (fallback active):", rzpErr);
    }

    const isNonProduction = process.env.NODE_ENV !== "production";
    const isMockDemoMode =
      isNonProduction && (!keyId || keyId.includes("demo") || keyId.includes("your_key_here"));

    let testPaymentId: string | undefined;
    let testSignature: string | undefined;

    // Sandbox test credentials only generated in local non-production environments with mock demo keys
    if (isMockDemoMode) {
      const activeSecret = keySecret || "avsaraa_test_razorpay_secret_key_2026";
      testPaymentId = `pay_test_${Date.now()}`;
      testSignature = crypto
        .createHmac("sha256", activeSecret)
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
