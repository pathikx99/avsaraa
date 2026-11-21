import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: true, products: [] });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, products: [] });
    }

    const adminClient = getAdminSupabaseClient();

    const { data: products, error } = await adminClient
      .from("products")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, products: products || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message, products: [] }, { status: 500 });
  }
}
