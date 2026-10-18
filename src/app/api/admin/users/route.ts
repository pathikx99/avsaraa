import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["Super Admin", "Admin", "Product Manager", "Store Manager", "Support Lead"];
const VALID_STATUSES = ["Active", "Inactive", "Suspended"];
const VALID_MEMBERSHIP_TIERS = ["Standard", "Privilege", "Atelier Circle", "VIP"];

export async function GET(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "admin" | "customers" | null

    let adminUsers: unknown[] = [];
    let customerProfiles: unknown[] = [];

    if (!type || type === "admin") {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select("id, user_id, full_name, email, role, department, phone_number, avatar_url, status, permissions, notes, last_active, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        adminUsers = data;
      }
    }

    if (!type || type === "customers") {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone_number, avatar_url, membership_tier, reward_points, preferred_currency, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        customerProfiles = data;
      }
    }

    return NextResponse.json({
      success: true,
      adminUsers,
      customerProfiles,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { target = "admin", ...payload } = body;

    if (target === "admin") {
      const {
        full_name,
        email,
        role = "Admin",
        department = "Operations",
        phone_number = null,
        status = "Active",
        permissions = ["users:manage", "products:manage"],
        notes = "",
      } = payload;

      // Validation
      if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2 || full_name.length > 100) {
        return NextResponse.json(
          { success: false, error: "Full name must be between 2 and 100 characters." },
          { status: 400 }
        );
      }

      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
        return NextResponse.json(
          { success: false, error: "A valid email address is required." },
          { status: 400 }
        );
      }

      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { success: false, error: `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}` },
          { status: 400 }
        );
      }

      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }

      const sanitizedPhone = phone_number ? String(phone_number).trim().slice(0, 20) : null;
      const sanitizedNotes = notes ? String(notes).trim().slice(0, 500) : null;
      const sanitizedDept = department ? String(department).trim().slice(0, 60) : "Operations";
      const sanitizedPerms = Array.isArray(permissions)
        ? permissions.map((p) => String(p).trim().slice(0, 50)).slice(0, 20)
        : ["users:manage"];

      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .insert({
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          role,
          department: sanitizedDept,
          phone_number: sanitizedPhone,
          status,
          permissions: sanitizedPerms,
          notes: sanitizedNotes,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data, message: "Admin user created successfully." });
    } else {
      // Customer profile creation
      const {
        id,
        full_name,
        email,
        phone_number = null,
        membership_tier = "Standard",
        reward_points = 0,
      } = payload;

      if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2 || full_name.length > 100) {
        return NextResponse.json(
          { success: false, error: "Full name must be between 2 and 100 characters." },
          { status: 400 }
        );
      }

      if (email && (typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase()))) {
        return NextResponse.json(
          { success: false, error: "Invalid email format." },
          { status: 400 }
        );
      }

      const tier = VALID_MEMBERSHIP_TIERS.includes(membership_tier) ? membership_tier : "Standard";
      const pts = Math.max(0, Math.min(1000000, Number(reward_points) || 0));

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: id || crypto.randomUUID(),
          full_name: full_name.trim(),
          email: email ? email.trim().toLowerCase() : null,
          phone_number: phone_number ? String(phone_number).trim().slice(0, 20) : null,
          membership_tier: tier,
          reward_points: pts,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data, message: "Customer user profile created." });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { target = "admin", id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "User ID is required for update." },
        { status: 400 }
      );
    }

    if (target === "admin") {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.full_name !== undefined) {
        if (typeof updates.full_name !== "string" || updates.full_name.trim().length < 2) {
          return NextResponse.json({ success: false, error: "Invalid full name." }, { status: 400 });
        }
        updateData.full_name = updates.full_name.trim().slice(0, 100);
      }

      if (updates.email !== undefined) {
        if (typeof updates.email !== "string" || !EMAIL_REGEX.test(updates.email.trim().toLowerCase())) {
          return NextResponse.json({ success: false, error: "Invalid email address format." }, { status: 400 });
        }
        updateData.email = updates.email.trim().toLowerCase();
      }

      if (updates.role !== undefined) {
        if (!VALID_ROLES.includes(updates.role)) {
          return NextResponse.json({ success: false, error: `Invalid role: ${updates.role}` }, { status: 400 });
        }
        updateData.role = updates.role;
      }

      if (updates.status !== undefined) {
        if (!VALID_STATUSES.includes(updates.status)) {
          return NextResponse.json({ success: false, error: `Invalid status: ${updates.status}` }, { status: 400 });
        }
        updateData.status = updates.status;
      }

      if (updates.department !== undefined) updateData.department = String(updates.department).trim().slice(0, 60);
      if (updates.phone_number !== undefined) updateData.phone_number = updates.phone_number ? String(updates.phone_number).trim().slice(0, 20) : null;
      if (updates.permissions !== undefined && Array.isArray(updates.permissions)) {
        updateData.permissions = updates.permissions.map((p: unknown) => String(p).trim().slice(0, 50)).slice(0, 20);
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes ? String(updates.notes).trim().slice(0, 500) : null;

      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data, message: "Admin user updated successfully." });
    } else {
      // Update customer profile
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.full_name !== undefined) {
        updateData.full_name = String(updates.full_name).trim().slice(0, 100);
      }
      if (updates.email !== undefined) {
        updateData.email = updates.email ? String(updates.email).trim().toLowerCase() : null;
      }
      if (updates.phone_number !== undefined) {
        updateData.phone_number = updates.phone_number ? String(updates.phone_number).trim().slice(0, 20) : null;
      }
      if (updates.membership_tier !== undefined && VALID_MEMBERSHIP_TIERS.includes(updates.membership_tier)) {
        updateData.membership_tier = updates.membership_tier;
      }
      if (updates.reward_points !== undefined) {
        updateData.reward_points = Math.max(0, Math.min(1000000, Number(updates.reward_points) || 0));
      }

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data, message: "Customer profile updated successfully." });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const target = searchParams.get("target") || "admin";

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "User ID is required for deletion." },
        { status: 400 }
      );
    }

    if (target === "admin") {
      // Prevent deleting the currently authenticated admin
      if (auth.user && auth.adminProfile && auth.adminProfile.id === id) {
        return NextResponse.json(
          { success: false, error: "Security Restriction: You cannot delete your own administrative account." },
          { status: 400 }
        );
      }

      // Prevent deleting the sole Super Admin
      const { count } = await supabaseAdmin
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "Super Admin");

      const { data: targetAdmin } = await supabaseAdmin
        .from("admin_users")
        .select("role")
        .eq("id", id)
        .maybeSingle();

      if (targetAdmin?.role === "Super Admin" && count !== null && count <= 1) {
        return NextResponse.json(
          { success: false, error: "Security Restriction: The last remaining Super Admin cannot be deleted." },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("admin_users")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Admin user deleted successfully." });
    } else {
      const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Customer user profile deleted successfully." });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
