import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: true, products: [] });
    }

    const ids = Array.from(
      new Set(
        idsParam
          .split(",")
          .map((s) => s.trim())
          .filter((id) => UUID_REGEX.test(id))
      )
    ).slice(0, 10);

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

    const publishedOnly = (products || []).filter((p) => {
      const status = (p as { publish_status?: string | null }).publish_status;
      return !status || status === "published";
    });

    return NextResponse.json({ success: true, products: publishedOnly });
  } catch (err: unknown) {
    console.error("Compare products fetch error:", err);
    return NextResponse.json({ success: false, message: "Unable to load comparison products.", products: [] }, { status: 500 });
  }
}
