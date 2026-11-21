import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { Order, OrderItem, CreateOrderPayload, PaymentStatus, OrderStatus } from "@/types/order";
import { SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import {
  isValidGujaratPincode,
  calculateOrderTotals,
} from "@/lib/financials";
import { validateCouponEngine, incrementCouponUsage } from "@/lib/couponManager";
import { dispatchOrderSuccessEmails } from "@/lib/emailService";
import { deductInventory } from "@/lib/inventory";
import { validateCsrfOrigin } from "@/lib/csrf";

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
    // CSRF protection for state-changing order creation
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    // 1. Authenticate Requester (or enable Guest Checkout)
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    let currentUserId = user?.id;
    if (!currentUserId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: jwtData } = await serverClient.auth.getUser(token);
        if (jwtData?.user) {
          currentUserId = jwtData.user.id;
        }
      }
    }

    // Guest Checkout Support:
    // When unauthenticated, route through system guest account for seamless zero-friction purchase
    const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
    const isGuest = !currentUserId;
    if (isGuest) {
      currentUserId = GUEST_SYSTEM_USER_ID;
    }

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

    // 3. Strict Geographic Enforcement: Gujarat Pincode Verification (360000–399999)
    const postalCode = shipping_address_snapshot.postal_code;
    if (!isValidGujaratPincode(postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Delivery restriction: Pin code ${postalCode} is outside our Gujarat service territory. Avsaraa currently delivers exclusively within Gujarat (pincodes 360000–399999).`,
        },
        { status: 400 }
      );
    }

    // 4. Compute Financials & Validate Items with Canonical Database Prices
    const adminClient = getAdminSupabaseClient();
    const productIds = items
      .map((item) => item.product_id)
      .filter((id): id is string => Boolean(id));

    // Fetch verified prices from database
    const priceMap = new Map<string, number>();
    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await adminClient
          .from("products")
          .select("id, price")
          .in("id", productIds);

        if (dbProducts) {
          for (const p of dbProducts) {
            priceMap.set(p.id, Number(p.price));
          }
        }
      } catch (err) {
        console.warn("Notice: Canonical price query notice:", err);
      }
    }

    // Populate missing from seed catalog
    for (const seed of SEED_CATALOG_PRODUCTS) {
      if (!priceMap.has(seed.id)) {
        priceMap.set(seed.id, seed.price);
      }
    }

    let rawSubtotal = 0;
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

      const verifiedPrice = priceMap.get(item.product_id)!;
      if (typeof verifiedPrice !== "number" || verifiedPrice <= 0 || isNaN(verifiedPrice)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid product pricing configuration for "${item.product_name}".`,
          },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const totalPrice = verifiedPrice * quantity;
      rawSubtotal += totalPrice;

      sanitizedItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        image_url: item.image_url || "/images/placeholder.jpg",
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

    // 6. Comprehensive Financial Breakdown (Courier fee, COD surcharge, 5% GST inclusive)
    const financials = calculateOrderTotals({
      subtotal: rawSubtotal,
      discountAmount,
      paymentMethod: payment_method || "Razorpay",
      customShippingFee: isFreeShippingCoupon ? 0 : undefined,
    });

    const isCOD = payment_method === "COD";
    const orderStatus: OrderStatus = isCOD ? "Confirmed" : "Pending";
    const paymentStatus: PaymentStatus = "Pending";
    const orderNumber = generateOrderNumber();

    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + 3);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sanitizedAddressId = shipping_address_id && isUuid.test(shipping_address_id)
      ? shipping_address_id
      : null;

    const orderPayload = {
      user_id: currentUserId,
      shipping_address_id: sanitizedAddressId,
      shipping_address_snapshot: shipping_address_snapshot,
      order_number: orderNumber,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      shipping_fee: financials.shippingFee + financials.codSurcharge, // Total logistics fee
      total_amount: financials.totalAmount,
      coupon_code: validatedCoupon,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: payment_method || "Razorpay",
      notes: notes || null,
      courier_partner: postalCode.startsWith("395")
        ? "Avsaraa Dedicated Surat Courier"
        : "Blue Dart Express Gujarat",
      tracking_number: `BLUEDART-${Math.floor(100000000 + Math.random() * 900000000)}`,
      estimated_delivery: estDelivery.toISOString(),
    };

    let createdOrder: Order | null = null;
    let createdItems: OrderItem[] = [];

    const { data: dbOrder, error: orderErr } = await adminClient
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr || !dbOrder) {
      throw new Error(
        `Failed to create order in database: ${orderErr?.message || "Insert returned no order record."}`
      );
    }

    createdOrder = dbOrder as Order;

    // Insert order items
    const itemsToInsert = sanitizedItems.map((item) => ({
      order_id: dbOrder.id,
      ...item,
    }));

    const { data: dbItems, error: itemsErr } = await adminClient
      .from("order_items")
      .insert(itemsToInsert)
      .select();

    if (itemsErr || !dbItems) {
      throw new Error(
        `Failed to create order items in database: ${itemsErr?.message || "Insert returned no order items."}`
      );
    }

    createdItems = dbItems as OrderItem[];

    // Insert payment record
    await adminClient.from("payments").insert({
      order_id: dbOrder.id,
      gateway: isCOD ? "Cash on Delivery" : payment_method,
      transaction_id: isCOD
        ? `COD-${orderNumber}`
        : `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
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

    // Deduct inventory stock (AVS-004 / AVS-005)
    try {
      await deductInventory(adminClient, sanitizedItems);
    } catch (invErr) {
      console.warn("Notice: Inventory stock deduction error:", invErr);
    }

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

      return NextResponse.json({ success: true, orders: orders || [] });
    } catch {
      return NextResponse.json({ success: true, orders: [] });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error fetching orders";
    return NextResponse.json({ success: false, message, orders: [] }, { status: 500 });
  }
}
