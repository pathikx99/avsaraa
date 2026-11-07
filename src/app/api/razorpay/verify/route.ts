import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay verification parameters." },
        { status: 400 }
      );
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "avsaraa_test_razorpay_secret_key_2026";

    // 1. Compute expected HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 2. Constant-time comparison to prevent timing attacks
    const isValid = timingSafeMatch(expectedSignature, razorpay_signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Razorpay signature verification failed." },
        { status: 400 }
      );
    }

    // 3. Update database payment status atomically
    const adminClient = getAdminSupabaseClient();

    if (order_id) {
      // Update order status
      await adminClient
        .from("orders")
        .update({
          payment_status: "Paid",
          order_status: "Confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      // Record / update payment
      await adminClient.from("payments").insert({
        order_id: order_id,
        gateway: "Razorpay",
        transaction_id: razorpay_payment_id,
        amount: body.amount || 0,
        currency: "INR",
        status: "Paid",
        raw_payload: {
          razorpay_order_id,
          razorpay_payment_id,
          verified_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and reconciled.",
      payment_id: razorpay_payment_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
