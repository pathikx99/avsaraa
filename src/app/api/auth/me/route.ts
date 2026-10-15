import { NextRequest, NextResponse } from "next/server";
import { createSupabaseContext } from "@supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { data: ctx, error } = await createSupabaseContext(req, {
      auth: ["user", "publishable", "none"],
    });

    if (error) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status || 401 }
      );
    }

    return NextResponse.json({
      status: "connected",
      authMode: ctx.authMode,
      user: ctx.jwtClaims
        ? {
            id: ctx.jwtClaims.sub,
            email: ctx.jwtClaims.email,
          }
        : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
