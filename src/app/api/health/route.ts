import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let productCount = 0;

  try {
    const supabase = getAdminSupabaseClient();
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });

    if (!error) {
      dbStatus = "connected";
      productCount = count || 0;
    } else {
      dbStatus = "degraded";
      console.warn("Health check query notice:", error.message);
    }
  } catch (err: unknown) {
    dbStatus = "error";
    console.error("Health check error:", err);
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbStatus === "connected" ? "healthy" : "warning",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        productCount,
        responseTimeMs: durationMs,
      },
      service: "Avsaraa Luxury Ethnic Commerce",
      tier: "free-tier-keepalive",
    },
    {
      status: dbStatus === "error" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
