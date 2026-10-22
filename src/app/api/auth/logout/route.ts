import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({
      success: true,
      message: "Session ended successfully.",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
