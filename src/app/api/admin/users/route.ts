import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        .eq("role", "Super Admin")
        .order("created_at", { ascending: false });

      if (!error && data) {
        adminUsers = data;
      }
    }

    if (!type || type === "customers") {
      const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const registeredProfiles = profilesData || [];

      // Fetch all orders with items to enrich CRM customer profiles
      const { data: allOrders } = await supabaseAdmin
        .from("orders")
        .select("id, user_id, order_number, total_amount, order_status, payment_status, payment_method, courier_partner, tracking_number, created_at, shipping_address_snapshot, order_items(product_name, quantity, total_price, color, size, image_url)")
        .order("created_at", { ascending: false });

      // Fetch all user addresses
      const { data: allAddresses } = await supabaseAdmin
        .from("addresses")
        .select("*");

      // Fetch all concierge inquiries
      const { data: allInquiries } = await supabaseAdmin
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      const matchedOrderIds = new Set<string>();
      const matchedInquiryIds = new Set<string>();

      const enrichedRegistered = registeredProfiles.map((profile) => {
        const cleanProfileEmail = profile.email ? profile.email.toLowerCase().trim() : null;
        const cleanProfilePhone = profile.phone_number ? profile.phone_number.replace(/\D/g, "").slice(-10) : null;

        const userOrders = (allOrders || []).filter((o) => {
          const isDirectOwner = o.user_id === profile.id;
          const orderEmail = o.shipping_address_snapshot?.email
            ? String(o.shipping_address_snapshot.email).toLowerCase().trim()
            : null;
          const orderPhone = o.shipping_address_snapshot?.phone_number
            ? String(o.shipping_address_snapshot.phone_number).replace(/\D/g, "").slice(-10)
            : null;

          const emailMatch = Boolean(cleanProfileEmail && orderEmail && cleanProfileEmail === orderEmail);
          const phoneMatch = Boolean(cleanProfilePhone && orderPhone && cleanProfilePhone === orderPhone);

          const matches = isDirectOwner || emailMatch || phoneMatch;
          if (matches) {
            matchedOrderIds.add(o.id);
          }
          return matches;
        });

        const totalSpend = userOrders
          .filter((o) => o.order_status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const userAddresses = (allAddresses || []).filter((a) => a.user_id === profile.id);

        // Also extract distinct delivery locations from order history
        userOrders.forEach((o) => {
          const snap = o.shipping_address_snapshot;
          if (snap && snap.address_line1 && snap.city) {
            const alreadyExists = userAddresses.some(
              (a) => a.address_line1?.toLowerCase() === snap.address_line1?.toLowerCase() &&
                     a.city?.toLowerCase() === snap.city?.toLowerCase()
            );
            if (!alreadyExists) {
              userAddresses.push({
                id: `order-addr-${o.id}`,
                user_id: profile.id,
                recipient_name: snap.recipient_name || profile.full_name,
                phone_number: snap.phone_number || profile.phone_number || "",
                address_line1: snap.address_line1,
                city: snap.city,
                state: snap.state || "Gujarat",
                postal_code: snap.postal_code || "",
                is_default: false,
              });
            }
          }
        });

        const defaultAddress = userAddresses.find((a) => a.is_default) || userAddresses[0];
        const primaryCity = defaultAddress?.city || userOrders[0]?.shipping_address_snapshot?.city || null;

        // Inquiries for this customer
        const userInquiries = (allInquiries || []).filter((inq) => {
          const inqEmail = inq.email ? inq.email.toLowerCase().trim() : null;
          const inqPhone = inq.phone_number ? inq.phone_number.replace(/\D/g, "").slice(-10) : null;
          const match = inq.user_id === profile.id ||
            Boolean(cleanProfileEmail && inqEmail && cleanProfileEmail === inqEmail) ||
            Boolean(cleanProfilePhone && inqPhone && cleanProfilePhone === inqPhone);
          if (match) {
            matchedInquiryIds.add(inq.id);
          }
          return match;
        });

        let rfmSegment: "VIP Atelier" | "Repeat Patron" | "Active Patron" | "Guest Buyer" | "Prospective Lead" = "Active Patron";
        if (profile.membership_tier === "VIP" || profile.membership_tier === "Atelier Circle" || totalSpend >= 30000) {
          rfmSegment = "VIP Atelier";
        } else if (userOrders.length >= 2) {
          rfmSegment = "Repeat Patron";
        } else if (userOrders.length === 1) {
          rfmSegment = "Active Patron";
        } else if (userInquiries.length > 0) {
          rfmSegment = "Prospective Lead";
        }

        return {
          ...profile,
          concierge_notes: ((profile as Record<string, unknown>).concierge_notes as string | null) || null,
          total_spend: totalSpend,
          order_count: userOrders.length,
          last_order_date: userOrders[0]?.created_at || null,
          first_order_date: userOrders[userOrders.length - 1]?.created_at || profile.created_at,
          primary_city: primaryCity,
          orders: userOrders,
          addresses: userAddresses,
          inquiries: userInquiries,
          rfm_segment: rfmSegment,
          is_guest: false,
        };
      });

      // Synthesize Guest Buyers from unmatched orders
      type OrderList = NonNullable<typeof allOrders>;
      const guestOrdersMap = new Map<string, OrderList>();
      (allOrders || []).forEach((o) => {
        if (!matchedOrderIds.has(o.id)) {
          const snap = o.shipping_address_snapshot;
          const guestKey = (snap?.email ? snap.email.toLowerCase().trim() : null) ||
                           (snap?.phone_number ? snap.phone_number.replace(/\D/g, "").slice(-10) : null) ||
                           `order-${o.order_number}`;
          if (!guestOrdersMap.has(guestKey)) {
            guestOrdersMap.set(guestKey, []);
          }
          guestOrdersMap.get(guestKey)!.push(o);
        }
      });

      const synthesizedGuests: unknown[] = [];
      guestOrdersMap.forEach((gOrders, key) => {
        if (!gOrders || gOrders.length === 0) return;
        const firstOrder = gOrders[0];
        const snap = firstOrder.shipping_address_snapshot;
        const totalSpend = gOrders
          .filter((o) => o.order_status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const guestEmail = snap?.email ? String(snap.email).toLowerCase().trim() : null;
        const guestPhone = snap?.phone_number ? String(snap.phone_number).trim() : null;
        const guestName = snap?.recipient_name || "Guest Patron";

        const guestInquiries = (allInquiries || []).filter((inq) => {
          const inqEmail = inq.email ? inq.email.toLowerCase().trim() : null;
          const inqPhone = inq.phone_number ? inq.phone_number.replace(/\D/g, "").slice(-10) : null;
          const match = Boolean(guestEmail && inqEmail && guestEmail === inqEmail) ||
            Boolean(guestPhone && inqPhone && guestPhone.replace(/\D/g, "").slice(-10) === inqPhone);
          if (match) {
            matchedInquiryIds.add(inq.id);
          }
          return match;
        });

        const guestAddresses = gOrders
          .map((o) => o.shipping_address_snapshot)
          .filter(Boolean)
          .map((s, idx) => ({
            id: `guest-addr-${idx + 1}`,
            user_id: `guest_${key}`,
            recipient_name: s.recipient_name || guestName,
            phone_number: s.phone_number || guestPhone || "",
            address_line1: s.address_line1 || "",
            city: s.city || "",
            state: s.state || "Gujarat",
            postal_code: s.postal_code || "",
            is_default: idx === 0,
          }));

        synthesizedGuests.push({
          id: `guest_${key}`,
          full_name: guestName,
          email: guestEmail,
          phone_number: guestPhone,
          avatar_url: null,
          status: "Active",
          membership_tier: totalSpend >= 30000 ? "VIP" : totalSpend >= 10000 ? "Privilege" : "Standard",
          reward_points: 0,
          preferred_currency: "INR",
          created_at: gOrders[gOrders.length - 1]?.created_at || new Date().toISOString(),
          updated_at: firstOrder.created_at || new Date().toISOString(),
          total_spend: totalSpend,
          order_count: gOrders.length,
          last_order_date: firstOrder.created_at,
          first_order_date: gOrders[gOrders.length - 1]?.created_at,
          primary_city: snap?.city || "Gujarat",
          orders: gOrders,
          addresses: guestAddresses,
          inquiries: guestInquiries,
          rfm_segment: totalSpend >= 30000 ? "VIP Atelier" : (gOrders.length > 1 ? "Repeat Patron" : "Guest Buyer"),
          is_guest: true,
          concierge_notes: null,
        });
      });

      // Synthesize prospective Leads from unmatched contact inquiries
      type InquiryList = NonNullable<typeof allInquiries>;
      const leadInquiriesMap = new Map<string, InquiryList>();
      (allInquiries || []).forEach((inq) => {
        if (!matchedInquiryIds.has(inq.id)) {
          const leadKey = (inq.email ? inq.email.toLowerCase().trim() : null) ||
                          (inq.phone_number ? inq.phone_number.replace(/\D/g, "").slice(-10) : null) ||
                          inq.id;
          if (!leadInquiriesMap.has(leadKey)) {
            leadInquiriesMap.set(leadKey, []);
          }
          leadInquiriesMap.get(leadKey)!.push(inq);
        }
      });

      const synthesizedLeads: unknown[] = [];
      leadInquiriesMap.forEach((inqs, key) => {
        if (!inqs || inqs.length === 0) return;
        const lead = inqs[0];
        synthesizedLeads.push({
          id: `lead_${key}`,
          full_name: lead.full_name || "Prospective Client",
          email: lead.email ? lead.email.toLowerCase().trim() : null,
          phone_number: lead.phone_number || null,
          avatar_url: null,
          status: "Active",
          membership_tier: "Standard",
          reward_points: 0,
          preferred_currency: "INR",
          created_at: lead.created_at,
          updated_at: lead.created_at,
          total_spend: 0,
          order_count: 0,
          last_order_date: null,
          first_order_date: lead.created_at,
          primary_city: null,
          orders: [],
          addresses: [],
          inquiries: inqs,
          rfm_segment: "Prospective Lead",
          is_guest: false,
          concierge_notes: null,
        });
      });

      customerProfiles = [...enrichedRegistered, ...synthesizedGuests, ...synthesizedLeads];
    }

    return NextResponse.json({
      success: true,
      adminUsers,
      customerProfiles,
    });
  } catch (err: unknown) {
    console.error("Admin users GET exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while fetching users." }, { status: 500 });
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
      return NextResponse.json(
        {
          success: false,
          error: "Security Policy: Avsaraa operates strictly under a single Super Admin authority. Creating additional administrators is disabled.",
        },
        { status: 403 }
      );
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
      const customerStatus = VALID_STATUSES.includes(payload.status) ? payload.status : "Active";

      let cleanPhone: string | null = null;
      if (phone_number && String(phone_number).trim()) {
        cleanPhone = String(phone_number).trim();
        // Check if phone number is already linked to another profile
        const { data: phoneConflict } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("phone_number", cleanPhone)
          .limit(1);

        if (phoneConflict && phoneConflict.length > 0) {
          return NextResponse.json(
            { success: false, error: "This mobile number is already linked to another account." },
            { status: 409 }
          );
        }
      }

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: id || crypto.randomUUID(),
          full_name: full_name.trim(),
          email: email ? email.trim().toLowerCase() : null,
          phone_number: cleanPhone,
          status: customerStatus,
          membership_tier: tier,
          reward_points: pts,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Customer profile create database error:", error);
        return NextResponse.json({ success: false, error: "Failed to create customer profile." }, { status: 500 });
      }

      return NextResponse.json({ success: true, data, message: "Customer user profile created." });
    }
  } catch (err: unknown) {
    console.error("Admin users POST exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while creating user." }, { status: 500 });
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

      updateData.role = "Super Admin";

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
        console.error("Super Admin update database error:", error);
        return NextResponse.json({ success: false, error: "Failed to update Super Admin details." }, { status: 500 });
      }

      return NextResponse.json({ success: true, data, message: "Super Admin details updated successfully." });
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
        const cleanPhone = updates.phone_number ? String(updates.phone_number).trim().slice(0, 20) : null;
        if (cleanPhone) {
          const { data: phoneConflict } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("phone_number", cleanPhone)
            .neq("id", id)
            .limit(1);

          if (phoneConflict && phoneConflict.length > 0) {
            return NextResponse.json(
              { success: false, error: "This mobile number is already linked to another account." },
              { status: 409 }
            );
          }
        }
        updateData.phone_number = cleanPhone;
      }
      if (updates.status !== undefined && VALID_STATUSES.includes(updates.status)) {
        updateData.status = updates.status;
      }
      if (updates.membership_tier !== undefined && VALID_MEMBERSHIP_TIERS.includes(updates.membership_tier)) {
        updateData.membership_tier = updates.membership_tier;
      }
      if (updates.reward_points !== undefined) {
        updateData.reward_points = Math.max(0, Math.min(1000000, Number(updates.reward_points) || 0));
      }
      if (updates.concierge_notes !== undefined) {
        updateData.concierge_notes = updates.concierge_notes ? String(updates.concierge_notes).slice(0, 1000) : null;
      }

      if (id.startsWith("guest_") || id.startsWith("lead_")) {
        // Convert Guest or Lead into a permanent CRM customer profile in the database
        const newId = crypto.randomUUID();
        const profilePayload: Record<string, unknown> = {
          id: newId,
          full_name: updates.full_name ? String(updates.full_name).trim().slice(0, 100) : "Avsaraa Patron",
          email: updates.email ? String(updates.email).trim().toLowerCase() : null,
          phone_number: updates.phone_number ? String(updates.phone_number).trim().slice(0, 20) : null,
          status: updates.status && VALID_STATUSES.includes(updates.status) ? updates.status : "Active",
          membership_tier: updates.membership_tier && VALID_MEMBERSHIP_TIERS.includes(updates.membership_tier) ? updates.membership_tier : "Standard",
          reward_points: updates.reward_points ? Math.max(0, Number(updates.reward_points)) : 100,
          concierge_notes: updates.concierge_notes ? String(updates.concierge_notes).slice(0, 1000) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createErr } = await supabaseAdmin
          .from("profiles")
          .insert(profilePayload)
          .select()
          .single();

        if (createErr) {
          console.error("Guest conversion to profile error:", createErr);
          return NextResponse.json({ success: false, error: "Failed to convert guest to permanent patron profile." }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: createdProfile, message: "Guest converted to permanent patron account." });
      }

      let { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error && (error.message?.includes("concierge_notes") || (error as { details?: string }).details?.includes("concierge_notes"))) {
        delete updateData.concierge_notes;
        const retry = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Customer profile update database error:", error);
        return NextResponse.json({ success: false, error: "Failed to update customer profile." }, { status: 500 });
      }

      return NextResponse.json({ success: true, data, message: "Customer profile updated successfully." });
    }
  } catch (err: unknown) {
    console.error("Admin users PUT exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while updating user." }, { status: 500 });
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
      return NextResponse.json(
        { success: false, error: "Security Restriction: The Super Admin account is the permanent master authority and cannot be deleted." },
        { status: 403 }
      );
    } else {
      const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Customer profile delete database error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete customer profile." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Customer user profile deleted successfully." });
    }
  } catch (err: unknown) {
    console.error("Admin users DELETE exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while deleting user." }, { status: 500 });
  }
}
