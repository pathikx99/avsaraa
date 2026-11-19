import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ADMIN_COOKIE_NAME } from "@/lib/jwtAdmin";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({
      success: true,
      message: "Session ended successfully.",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
