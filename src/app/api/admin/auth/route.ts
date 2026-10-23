import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { ADMIN_EMAIL } from "@/lib/adminConstants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const configuredEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      ADMIN_EMAIL
    )
      .toLowerCase()
      .trim();

    const envPassword = process.env.ADMIN_PASSWORD || "avsaraa_super_secret_admin_key_2026";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (cleanEmail !== configuredEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: Specified email does not match the configured Super Admin email.",
        },
        { status: 403 }
      );
    }

    // If an ADMIN_PASSWORD is set in environment and matches the provided password
    if (envPassword && password === envPassword) {
      const supabaseAdmin = getAdminSupabaseClient();

      try {
        // Check if user already exists in Supabase Auth
        const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userListData?.users?.find(
          (u) => u.email?.toLowerCase().trim() === configuredEmail
        );

        if (!existingUser) {
          // Provision the user in Supabase Auth using environment credentials
          await supabaseAdmin.auth.admin.createUser({
            email: configuredEmail,
            password: envPassword,
            email_confirm: true,
            user_metadata: { role: "super_admin", full_name: "Kratos Lord" },
            app_metadata: { role: "super_admin" },
          });
        } else {
          // Update password and roles if user already exists
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: envPassword,
            email_confirm: true,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              role: "super_admin",
            },
            app_metadata: {
              ...(existingUser.app_metadata || {}),
              role: "super_admin",
            },
          });
        }

        // Ensure record in public.admin_users exists
        await supabaseAdmin.from("admin_users").upsert(
          {
            email: configuredEmail,
            full_name: "Kratos Lord",
            role: "Super Admin",
            department: "Executive Leadership",
            status: "Active",
            permissions: [
              "all:super_admin",
              "products:manage",
              "customers:manage",
              "inquiries:manage",
              "system:admin",
            ],
            notes: "Configured Super Admin authenticated via environment credentials.",
          },
          { onConflict: "email" }
        );
      } catch (provisionErr) {
        console.warn("Supabase auth sync notice:", provisionErr);
      }

      return NextResponse.json({
        success: true,
        message: "Admin credentials verified against environment configuration.",
        synced: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid admin credentials.",
      },
      { status: 401 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
