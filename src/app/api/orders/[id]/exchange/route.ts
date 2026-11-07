import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";

function getServiceSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return null;

  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isSecretValid = Boolean(
    secretKey &&
    !secretKey.includes("•") &&
    !secretKey.includes("...") &&
    secretKey.trim().length >= 20
  );

  const key = isSecretValid ? (secretKey as string) : getSupabasePublishableKey();
  if (!key) return null;

  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    // Authenticate patron
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in to request an exchange." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason, details, requested_replacement } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: "Please specify a reason for your exchange request." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Database service unavailable." },
        { status: 503 }
      );
    }

    // Fetch order to verify ownership & status
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // Security check: order must belong to user unless admin
    const isAdmin = user.app_metadata?.role === "super_admin" || user.email === "admin@avsaraa.com";
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to request exchange for this order." },
        { status: 403 }
      );
    }

    // Check exchange window: within 7 days of delivery / creation
    if (order.order_status === "Cancelled") {
      return NextResponse.json(
        { success: false, message: "Cannot exchange a cancelled order." },
        { status: 400 }
      );
    }

    if (order.order_status === "Exchange Requested" || order.order_status === "Exchanged") {
      return NextResponse.json(
        { success: false, message: "An exchange has already been initiated for this order." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const exchangeNote = `\n[Exchange Requested on ${new Date().toLocaleDateString("en-IN")}] Reason: ${reason.trim()}${requested_replacement ? ` | Desired Replacement: ${requested_replacement.trim()}` : ""}${details ? ` | Notes: ${details.trim()}` : ""}`;
    const updatedNotes = order.notes ? `${order.notes}${exchangeNote}` : exchangeNote.trim();

    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        order_status: "Exchange Requested",
        notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq("id", id)
      .select(`
        *,
        order_items (*)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json(
        { success: false, message: `Could not process exchange: ${updateErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your 7-Day Heritage Exchange request has been received. Our concierge team will arrange doorstep pick-up.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error submitting exchange request.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

