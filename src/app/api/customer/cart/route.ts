import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { validateCsrfOrigin } from "@/lib/csrf";

// Fallback in-memory store for server-side cart sync
const fallbackUserCarts = new Map<string, unknown[]>();

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminSupabaseClient();
    try {
      const { data: profileData, error } = await adminClient
        .from("profiles")
        .select("cart_items")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profileData?.cart_items) {
        return NextResponse.json({ success: true, items: profileData.cart_items });
      }
    } catch {
      // Fallback
    }

    const items = fallbackUserCarts.get(user.id) || [];
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // CSRF protection for cart synchronization
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 50);

    // Store in-memory
    fallbackUserCarts.set(user.id, items);

    // Persist cart items directly on user profile in database
    const adminClient = getAdminSupabaseClient();
    try {
      const nowIso = new Date().toISOString();
      await adminClient
        .from("profiles")
        .update({
          cart_items: items,
          cart_updated_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", user.id);
    } catch {
      // Profile cart column will be populated once migration is applied
    }

    return NextResponse.json({
      success: true,
      message: "Cart synchronized successfully",
      count: items.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
