import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/emailService";
import { validateCsrfOrigin } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing subscription
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { productId, email, phoneNumber, variantName, size } = body;

    if (!productId || !email || !String(email).includes("@")) {
      return NextResponse.json(
        { success: false, message: "Product ID and valid email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const rateCheck = checkRateLimit(`back-in-stock:${cleanEmail}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many alert requests. Please wait ${rateCheck.resetSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const serverClient = await createSupabaseServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    const adminClient = getAdminSupabaseClient();

    // Verify product exists
    const { data: product } = await adminClient
      .from("products")
      .select("id, name, stock_count, back_in_stock_notify")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    // Check if already subscribed (same user/email + product + variant)
    const { data: existing } = await adminClient
      .from("back_in_stock_subscriptions")
      .select("id")
      .eq("product_id", productId)
      .eq("email", email.toLowerCase().trim())
      .eq("notified", false)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed for restock alerts on this item.",
        alreadySubscribed: true,
      });
    }

    const { data: subscription, error } = await adminClient
      .from("back_in_stock_subscriptions")
      .insert({
        product_id: productId,
        user_id: user?.id ?? null,
        email: email.toLowerCase().trim(),
        phone_number: phoneNumber?.trim() || null,
        variant_name: variantName?.trim() || null,
        size: size?.trim() || null,
        notified: false,
      })
      .select()
      .single();

    if (error || !subscription) {
      throw new Error(error?.message || "Failed to subscribe to restock alert.");
    }

    // Send confirmation email (non-blocking)
    sendEmail({
      to: email,
      subject: `Restock Alert Subscribed · ${product.name} · AVSARAA`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#261B13;">
          <h2 style="color:#866951;font-family:'Cinzel',Georgia,serif;">AVSARAA · Wear The Moment</h2>
          <p>Thank you for subscribing to restock alerts for <strong>${product.name}</strong>.</p>
          <p>${variantName ? `Variant: <strong>${variantName}</strong><br/>` : ""}${size ? `Size: <strong>${size}</strong><br/>` : ""}</p>
          <p>We'll notify you at ${email} as soon as it's back in stock.</p>
          <p style="color:#6E5B4E;font-size:12px;">- The AVSARAA Concierge, Surat</p>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Subscribed! We'll notify you when this item is back in stock.",
      subscription,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
