"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types/product";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { isSuperAdminUser } from "@/lib/adminConstants";

const PRESET_PRODUCT_IMAGES = [
  { label: "Banarasi Silk Saree", url: "/images/banarasi_silk_saree.jpg" },
  { label: "Emerald Organza Saree", url: "/images/royal_organza_saree.jpg" },
  { label: "Heritage Anarkali Gown", url: "/images/royal_occasion_dress.jpg" },
  { label: "Chanderi Dress", url: "/images/festive_chanderi_dress.jpg" },
  { label: "Royal Zari Bridal Drape", url: "/images/saree_model_hero.jpg" },
  { label: "Handloom Weave Texture", url: "/images/account_hero.jpg" },
];

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  membership_tier: string;
  reward_points?: number;
  created_at?: string;
}

interface AddressItem {
  id: string;
  user_id: string;
  address_type: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "products" | "support">("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated User State
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Products Catalog (Viewable by Super Admin)
  const [products, setProducts] = useState<Product[]>([]);

  // Profile Edit Mode
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "",
    postal_code: "",
    address_type: "Home",
    is_default: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  // Fetch real profile, addresses, and verify admin authority
  const loadUserData = useCallback(async (userId: string, userEmail?: string) => {
    setIsLoading(true);

    try {
      // 0. Verify Super Admin Authority
      let adminCheck = false;
      try {
        const { data: authUserData } = await supabase.auth.getUser();
        if (authUserData?.user && isSuperAdminUser(authUserData.user)) {
          adminCheck = true;
        } else {
          const { data: adminRecord } = await supabase
            .from("admin_users")
            .select("id")
            .eq("user_id", userId)
            .eq("status", "Active")
            .eq("role", "Super Admin")
            .maybeSingle();

          if (adminRecord) {
            adminCheck = true;
          }
        }
      } catch {
        adminCheck = false;
      }
      setIsSuperAdmin(adminCheck);

      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr && profileErr.code !== "PGRST116") {
        console.warn("Profiles fetch note:", profileErr.message);
      }

      if (profileData) {
        setProfile(profileData);
        setEditFullName(profileData.full_name || "");
        setEditPhoneNumber(profileData.phone_number || "");
      } else {
        const defaultProfile: UserProfile = {
          id: userId,
          full_name: userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "Avsaraa Member",
          email: userEmail || "",
          phone_number: null,
          membership_tier: "Member",
          created_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
        setEditFullName(defaultProfile.full_name);
      }

      // 2. Fetch Addresses
      const { data: addressData, error: addrErr } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (addrErr) {
        console.warn("Addresses fetch note:", addrErr.message);
        const cached = localStorage.getItem(`avsaraa_addresses_${userId}`);
        if (cached) {
          try {
            setAddresses(JSON.parse(cached));
          } catch {
            setAddresses([]);
          }
        } else {
          setAddresses([]);
        }
      } else if (addressData) {
        setAddresses(addressData);
        localStorage.setItem(`avsaraa_addresses_${userId}`, JSON.stringify(addressData));
      }

      // 3. Fetch Products strictly from Supabase database
      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (prodErr) {
        console.warn("Database products query note:", prodErr.message);
        setProducts([]);
      } else if (prodData) {
        setProducts(prodData);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error loading account data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setAuthUser(session.user);
          await loadUserData(session.user.id, session.user.email);
        } else {
          setAuthUser(null);
          setProfile(null);
          setAddresses([]);
          setIsLoading(false);
          router.replace("/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (isMounted) {
          setIsLoading(false);
          router.replace("/login");
        }
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await loadUserData(session.user.id, session.user.email);
      } else {
        setAuthUser(null);
        setProfile(null);
        setAddresses([]);
        setIsLoading(false);
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData, router]);

  // Handle Save Profile to Database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      showToast("Please sign in to update your profile");
      return;
    }

    const trimmedPhone = editPhoneNumber.trim();

    // Validate phone number format & uniqueness if provided
    if (trimmedPhone) {
      const phoneValidation = normalizePhoneNumber(trimmedPhone);
      if (!phoneValidation.isValid) {
        showToast(phoneValidation.error || "Please enter a valid mobile number.");
        return;
      }

      setIsSavingProfile(true);
      try {
        const valRes = await fetch("/api/auth/validate-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: trimmedPhone,
            currentUserId: authUser.id,
          }),
        });

        const valData = await valRes.json();
        if (!valRes.ok || !valData.available) {
          showToast(
            valData.error ||
              "This phone number is already linked to another account. Please use a different phone number."
          );
          setIsSavingProfile(false);
          return;
        }
      } catch (err) {
        console.error("Phone validation check error:", err);
      }
    }

    setIsSavingProfile(true);
    try {
      const updatedData = {
        id: authUser.id,
        full_name: editFullName.trim(),
        phone_number: trimmedPhone ? normalizePhoneNumber(trimmedPhone).normalized : null,
        email: profile?.email || authUser.email || "",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updatedData);

      if (error) {
        if (error.message.includes("unique") || error.code === "23505") {
          showToast(
            "This phone number is already registered to another account. Please enter a different number."
          );
          setIsSavingProfile(false);
          return;
        }
        console.warn("Profile update note:", error.message);
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editFullName.trim(),
              phone_number: trimmedPhone ? normalizePhoneNumber(trimmedPhone).normalized : null,
            }
          : null
      );

      setIsEditingProfile(false);
      showToast("Profile details saved successfully");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("Could not update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Address to Database
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      showToast("Please sign in to save delivery addresses");
      return;
    }

    if (
      !newAddress.recipient_name.trim() ||
      !newAddress.phone_number.trim() ||
      !newAddress.address_line1.trim() ||
      !newAddress.city.trim() ||
      !newAddress.state.trim() ||
      !newAddress.postal_code.trim()
    ) {
      showToast("Please fill in all required address fields");
      return;
    }

    setIsSavingAddress(true);

    const addressRecord = {
      user_id: authUser.id,
      address_type: newAddress.address_type,
      recipient_name: newAddress.recipient_name.trim(),
      phone_number: newAddress.phone_number.trim(),
      address_line1: newAddress.address_line1.trim(),
      address_line2: newAddress.address_line2.trim() || null,
      landmark: newAddress.landmark.trim() || null,
      city: newAddress.city.trim(),
      state: newAddress.state.trim(),
      postal_code: newAddress.postal_code.trim(),
      country: "India",
      is_default: addresses.length === 0 ? true : newAddress.is_default,
    };

    try {
      if (addressRecord.is_default && addresses.length > 0) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", authUser.id);
      }

      const { data, error } = await supabase
        .from("addresses")
        .insert([addressRecord])
        .select()
        .single();

      if (error) {
        console.warn("DB insert note, saving to local cache:", error.message);
        const fallbackItem: AddressItem = {
          ...addressRecord,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        const updated = addressRecord.is_default
          ? [fallbackItem, ...addresses.map((a) => ({ ...a, is_default: false }))]
          : [...addresses, fallbackItem];
        setAddresses(updated);
        localStorage.setItem(`avsaraa_addresses_${authUser.id}`, JSON.stringify(updated));
      } else if (data) {
        const updated = addressRecord.is_default
          ? [data, ...addresses.map((a) => ({ ...a, is_default: false }))]
          : [...addresses, data];
        setAddresses(updated);
        localStorage.setItem(`avsaraa_addresses_${authUser.id}`, JSON.stringify(updated));
      }

      showToast("Delivery address saved to database");
      setShowAddressModal(false);
      setNewAddress({
        recipient_name: "",
        phone_number: "",
        address_line1: "",
        address_line2: "",
        landmark: "",
        city: "",
        state: "",
        postal_code: "",
        address_type: "Home",
        is_default: false,
      });
    } catch (err) {
      console.error("Address save error:", err);
      showToast("Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    if (!authUser) return;

    try {
      await supabase.from("addresses").delete().eq("id", addressId);
      const filtered = addresses.filter((a) => a.id !== addressId);
      setAddresses(filtered);
      localStorage.setItem(`avsaraa_addresses_${authUser.id}`, JSON.stringify(filtered));
      showToast("Address deleted");
    } catch (err) {
      console.error("Failed to delete address:", err);
      showToast("Could not remove address");
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!authUser) return;

    try {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", authUser.id);
      await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);

      const updated = addresses.map((a) => ({
        ...a,
        is_default: a.id === addressId,
      }));
      setAddresses(updated);
      localStorage.setItem(`avsaraa_addresses_${authUser.id}`, JSON.stringify(updated));
      showToast("Default address updated");
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };



  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await supabase.auth.signOut();
      setAuthUser(null);
      setProfile(null);
      setAddresses([]);
      showToast("Signed out safely");
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "✦";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7F2EE",
        }}
      >
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <p style={{ color: "#8E7D70", fontSize: "14px" }}>Loading your account...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7F2EE",
        }}
      >
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#261B13", fontSize: "16px", marginBottom: "8px" }}>Redirecting to Sign In...</p>
            <p style={{ color: "#8E7D70", fontSize: "13px" }}>Please sign in to view your account.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2EE",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#261B13",
            color: "#FAF6F0",
            padding: "11px 24px",
            borderRadius: "12px",
            fontSize: "13px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(38, 27, 19, 0.4)",
            animation: "fadeIn 0.25s ease",
            maxWidth: "90vw",
            letterSpacing: "0.02em",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Official Header */}
      <Header />

      <main style={{ flex: 1, paddingBottom: "70px" }}>
        {/* Profile Header Hero */}
        <div
          style={{
            backgroundColor: "#FAF7F2",
            borderBottom: "1px solid #E6DACF",
            position: "relative",
            overflow: "hidden",
            padding: "40px 24px 32px 24px",
          }}
        >
          {/* Subtle Corner Botanical Flower */}
          <div
            style={{
              position: "absolute",
              right: "-25px",
              top: "-25px",
              width: "160px",
              height: "160px",
              pointerEvents: "none",
              opacity: 0.65,
            }}
          >
            <Image
              src="/images/botanical_flowers.jpg"
              alt=""
              fill
              sizes="160px"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>

          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11.5px",
                color: "#866951",
                marginBottom: "24px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              <Link href="/" style={{ opacity: 0.7 }}>
                Home
              </Link>
              <span>›</span>
              <span style={{ color: "#866951" }}>My Account</span>
            </div>

            {/* Profile Info Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {/* User Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 35%, #D4BEAA 0%, #866951 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    boxShadow: "0 8px 24px rgba(134, 105, 81, 0.28)",
                    border: "2px solid #FFFFFF",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(profile?.full_name)}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h1
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "clamp(24px, 3.5vw, 32px)",
                        fontWeight: 500,
                        color: "#261B13",
                        textTransform: "capitalize",
                        lineHeight: 1.15,
                      }}
                    >
                      {profile?.full_name || "Member"}
                    </h1>
                    <span className="luxury-badge">
                      {isSuperAdmin ? "👑 SUPER ADMIN" : `✦ ${profile?.membership_tier || "MEMBER"}`}
                    </span>
                  </div>

                  <p style={{ fontSize: "13.5px", color: "#6E5B4E", marginBottom: "3px" }}>
                    {profile?.phone_number ? `${profile.phone_number} • ` : ""}
                    {profile?.email || authUser.email}
                  </p>
                  <p style={{ fontSize: "12px", color: isSuperAdmin ? "#866951" : "#A88B70", fontWeight: isSuperAdmin ? 600 : 400 }}>
                    {isSuperAdmin ? "👑 Master Authority Administrator" : "✦ Verified Customer Member"}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {isSuperAdmin && (
                  <Link
                    href="/admin"
                    className="avsaraa-btn-primary"
                    style={{
                      height: "40px",
                      padding: "0 18px",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      width: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>👑 Admin Portal</span>
                    <span>→</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="avsaraa-btn-outline"
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    backgroundColor: "#FFFFFF",
                    width: "auto",
                  }}
                >
                  <span>Logout</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
                marginTop: "28px",
              }}
            >
              {[
                { label: "Status", value: isSuperAdmin ? "👑 Super Admin" : "Active Member" },
                { label: "Saved Addresses", value: `${addresses.length} Saved` },
                { label: "Account Role", value: isSuperAdmin ? "Master Control" : `✦ ${profile?.membership_tier || "Member"}` },
                { label: "Studio", value: "Surat (Online Store)" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8DED3",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    boxShadow: "0 4px 15px rgba(38,27,19,0.02)",
                  }}
                >
                  <span style={{ display: "block", fontSize: "10.5px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#261B13",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Super Admin Executive Notice Banner */}
            {isSuperAdmin && (
              <div
                style={{
                  marginTop: "20px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  borderRadius: "16px",
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  boxShadow: "0 10px 30px rgba(38,27,19,0.18)",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#D4BEAA", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    👑 Master Authority Access
                  </span>
                  <p style={{ fontSize: "13px", color: "#E6DACF", margin: 0, lineHeight: 1.5 }}>
                    You have exclusive administrative rights to add products, modify pricing, inspect inquiries, and oversee customer accounts.
                  </p>
                </div>
                <Link
                  href="/admin"
                  style={{
                    backgroundColor: "#FAF7F2",
                    color: "#261B13",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <span>Open Admin Portal</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Tabs (< 900px) */}
        <div
          className="mobile-only"
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E8DED3",
            position: "sticky",
            top: "57px",
            zIndex: 40,
            width: "100%",
          }}
        >
          <div
            className="no-scrollbar"
            style={{
              padding: "0 16px",
              display: "flex",
              gap: "24px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {[
              { id: "profile", label: "My Profile" },
              { id: "addresses", label: `Addresses (${addresses.length})` },
              ...(isSuperAdmin ? [{ id: "products", label: `Catalog (${products.length})` }] : []),
              { id: "support", label: "Help & Support" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    padding: "16px 4px",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#261B13" : "#8E7D70",
                    borderBottom: isActive ? "2px solid #866951" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Layout (Desktop 2-Column or Mobile Stack) */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "32px auto 0 auto",
            padding: "0 24px",
            display: "flex",
            gap: "32px",
            alignItems: "flex-start",
          }}
        >
          {/* Desktop Left Sidebar Navigation (min-width: 900px) */}
          <aside
            className="desktop-only"
            style={{
              width: "280px",
              flexShrink: 0,
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "18px",
                padding: "14px",
                boxShadow: "0 6px 20px -6px rgba(38,27,19,0.04)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#866951",
                  padding: "8px 12px",
                  marginBottom: "4px",
                }}
              >
                MENU
              </span>

              {[
                { id: "profile", label: "My Profile", icon: "✦" },
                { id: "addresses", label: `Addresses (${addresses.length})`, icon: "📍" },
                ...(isSuperAdmin ? [{ id: "products", label: `Catalog (${products.length})`, icon: "👗" }] : []),
                { id: "support", label: "Help & Support", icon: "💬" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? "#F2EBE3" : "transparent",
                      color: isActive ? "#261B13" : "#6E5B4E",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                    {isActive && <span style={{ color: "#866951", fontSize: "14px" }}>•</span>}
                  </button>
                );
              })}
            </div>

            {/* Member Benefits Card */}
            <div
              style={{
                backgroundColor: "#FAF7F2",
                border: "1px solid #E6DACF",
                borderRadius: "16px",
                padding: "18px 20px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#866951", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                MEMBER BENEFITS
              </span>
              <p style={{ fontSize: "13px", color: "#6E5B4E", lineHeight: 1.5, marginTop: "6px" }}>
                Enjoy complimentary free shipping and delivery on all orders with priority concierge support.
              </p>
            </div>
          </aside>

          {/* Right Main Stage Content Panel */}
          <div style={{ flex: 1, width: "100%", maxWidth: "800px" }}>
            {/* 1. PROFILE DETAILS TAB */}
            {activeTab === "profile" && (
              <div className="fade-in-up">
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8DED3",
                    borderRadius: "20px",
                    padding: "32px 28px",
                    boxShadow: "0 8px 30px -8px rgba(38,27,19,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                        YOUR DETAILS
                      </span>
                      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13" }}>
                        Personal Details
                      </h3>
                    </div>

                    {authUser && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#866951",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          backgroundColor: "#FAF7F2",
                          border: "1px solid #E6DACF",
                        }}
                      >
                        {isEditingProfile ? "Cancel" : "Edit Details"}
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            height: "46px",
                            padding: "0 16px",
                            border: "1px solid #CFBEAD",
                            borderRadius: "10px",
                            fontSize: "14px",
                            backgroundColor: "#FCFAF7",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          value={editPhoneNumber}
                          onChange={(e) => setEditPhoneNumber(e.target.value)}
                          placeholder="+91 98765 43210"
                          style={{
                            width: "100%",
                            height: "46px",
                            padding: "0 16px",
                            border: "1px solid #CFBEAD",
                            borderRadius: "10px",
                            fontSize: "14px",
                            backgroundColor: "#FCFAF7",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile?.email || authUser?.email || ""}
                          disabled
                          style={{
                            width: "100%",
                            height: "46px",
                            padding: "0 16px",
                            border: "1px solid #E8DED3",
                            backgroundColor: "#F7F2EE",
                            borderRadius: "10px",
                            fontSize: "14px",
                            color: "#8E7D70",
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="avsaraa-btn-primary"
                        style={{ height: "48px", fontSize: "13.5px", marginTop: "10px" }}
                      >
                        {isSavingProfile ? "Saving..." : "Save Details"}
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                      <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #EFE6DC" }}>
                        <span style={{ fontSize: "11px", color: "#8E7D70", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Full Name</span>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", textTransform: "capitalize", marginTop: "2px", display: "block" }}>
                          {profile?.full_name || (authUser ? "Member" : "Guest User")}
                        </span>
                      </div>

                      <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #EFE6DC" }}>
                        <span style={{ fontSize: "11px", color: "#8E7D70", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mobile Number</span>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginTop: "2px", display: "block" }}>
                          {profile?.phone_number || "Not provided"}
                        </span>
                      </div>

                      <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #EFE6DC" }}>
                        <span style={{ fontSize: "11px", color: "#8E7D70", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address</span>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginTop: "2px", display: "block" }}>
                          {profile?.email || authUser?.email || "guest@avsaraa.com"}
                        </span>
                      </div>

                      <div style={{ backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "12px", border: "1px solid #EFE6DC" }}>
                        <span style={{ fontSize: "11px", color: "#8E7D70", display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Type</span>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#866951", marginTop: "2px", display: "block" }}>
                          ✦ {profile?.membership_tier || "Member"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #EFE6DC", paddingTop: "20px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <Link
                      href="/about"
                      className="avsaraa-btn-outline"
                      style={{ flex: 1, height: "44px", fontSize: "13px", minWidth: "160px" }}
                    >
                      About Us
                    </Link>
                    <Link
                      href="/contact"
                      className="avsaraa-btn-primary"
                      style={{ flex: 1, height: "44px", fontSize: "13px", minWidth: "160px" }}
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SAVED ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="fade-in-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                      DELIVERY ADDRESSES
                    </span>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13" }}>
                      Saved Addresses ({addresses.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!authUser) {
                        showToast("Please sign in to add delivery addresses");
                      } else {
                        setShowAddressModal(true);
                      }
                    }}
                    className="avsaraa-btn-primary"
                    style={{ height: "40px", padding: "0 20px", fontSize: "12.5px", width: "auto" }}
                  >
                    + Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px dashed #CFBEAD",
                      borderRadius: "20px",
                      padding: "44px 24px",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>📍</span>
                    <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", marginBottom: "6px" }}>
                      No Saved Addresses Yet
                    </h4>
                    <p style={{ fontSize: "13.5px", color: "#8E7D70", maxWidth: "380px", margin: "0 auto 20px auto", lineHeight: 1.6 }}>
                      {authUser
                        ? "Save your home or work address for quick and easy delivery."
                        : "Sign in to save and manage your delivery addresses."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!authUser) {
                          showToast("Please sign in to add addresses");
                        } else {
                          setShowAddressModal(true);
                        }
                      }}
                      className="avsaraa-btn-outline"
                      style={{ width: "auto", display: "inline-flex", padding: "0 24px", height: "42px", fontSize: "13px" }}
                    >
                      + Add Address
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "18px",
                    }}
                  >
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="luxury-hover-card"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: addr.is_default ? "1.5px solid #866951" : "1px solid #E8DED3",
                          borderRadius: "18px",
                          padding: "22px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 4px 18px rgba(38,27,19,0.03)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 600, fontSize: "14.5px", color: "#261B13" }}>
                                {addr.recipient_name}
                              </span>
                              <span style={{ fontSize: "11px", color: "#8E7D70", backgroundColor: "#FAF7F2", padding: "2px 8px", borderRadius: "10px", border: "1px solid #EFE6DC" }}>
                                {addr.address_type}
                              </span>
                            </div>

                            {addr.is_default && (
                              <span className="luxury-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
                                DEFAULT
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: "13.5px", color: "#4A3525", lineHeight: 1.65, marginBottom: "8px" }}>
                            {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                            {addr.landmark ? ` (Near ${addr.landmark})` : ""}
                            <br />
                            {addr.city}, {addr.state} - {addr.postal_code}
                            <br />
                            <span style={{ color: "#786556", fontSize: "12.5px" }}>Phone: {addr.phone_number}</span>
                          </p>
                        </div>

                        <div style={{ borderTop: "1px solid #F0E8DF", paddingTop: "12px", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {!addr.is_default ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{ fontSize: "12px", color: "#866951", textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "#866951", fontWeight: 600 }}>✦ Default Address</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{ fontSize: "12px", color: "#A83E2D", textDecoration: "underline", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. STORE CATALOG TAB (Super Admin Only) */}
            {isSuperAdmin && activeTab === "products" && (
              <div className="fade-in-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                      MASTER AUTHORITY CATALOG
                    </span>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13" }}>
                      Store Products ({products.length})
                    </h3>
                  </div>

                  <Link
                    href="/admin"
                    className="avsaraa-btn-primary"
                    style={{ height: "40px", padding: "0 20px", fontSize: "12.5px", width: "auto", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                  >
                    <span>+ Add Products in Admin Portal</span>
                    <span>→</span>
                  </Link>
                </div>

                <div
                  style={{
                    backgroundColor: "#FAF7F2",
                    border: "1px solid #E6DACF",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#6E5B4E",
                    lineHeight: 1.6,
                  }}
                >
                  ✦ <strong>Super Admin Authority:</strong> Only you, as the sole Super Administrator, have permissions to add, edit, or remove catalog items. All product modifications are executed securely through the Super Admin Dashboard.
                </div>

                {products.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px dashed #D4C3B3",
                      borderRadius: "20px",
                      padding: "48px 24px",
                      textAlign: "center",
                      margin: "12px 0 24px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E6DACF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px auto",
                        fontSize: "20px",
                        color: "#866951",
                      }}
                    >
                      ✦
                    </div>
                    <h4
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "20px",
                        color: "#261B13",
                        marginBottom: "6px",
                        fontWeight: 500,
                      }}
                    >
                      No Products in Catalog Yet
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6E5B4E",
                        maxWidth: "400px",
                        margin: "0 auto 20px auto",
                        lineHeight: 1.6,
                      }}
                    >
                      Use the Super Admin Portal to publish handcrafted luxury pieces to Supabase.
                    </p>
                    <Link
                      href="/admin"
                      className="avsaraa-btn-primary"
                      style={{ height: "40px", padding: "0 22px", fontSize: "12px", width: "auto", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                    >
                      <span>Open Admin Portal</span>
                      <span>→</span>
                    </Link>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "18px",
                    }}
                  >
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="luxury-hover-card"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E8DED3",
                          borderRadius: "16px",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: "0 4px 16px rgba(38,27,19,0.04)",
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", height: "200px", backgroundColor: "#F2EBE3" }}>
                          <Image
                            src={prod.image_url || PRESET_PRODUCT_IMAGES[0].url}
                            alt={prod.name}
                            fill
                            sizes="240px"
                            style={{ objectFit: "cover" }}
                          />
                          <span
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              backgroundColor: "rgba(38, 27, 19, 0.85)",
                              color: "#FAF7F2",
                              padding: "3px 8px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {prod.category}
                          </span>
                        </div>

                        <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <h4
                            style={{
                              fontFamily: "var(--font-serif), Georgia, serif",
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#261B13",
                              marginBottom: "4px",
                              lineHeight: 1.3,
                            }}
                          >
                            {prod.name}
                          </h4>

                          {prod.description && (
                            <p style={{ fontSize: "12px", color: "#6E5B4E", lineHeight: 1.45, marginBottom: "10px", flex: 1 }}>
                              {prod.description}
                            </p>
                          )}

                          <div
                            style={{
                              marginTop: "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingTop: "8px",
                              borderTop: "1px solid #F2EBE3",
                            }}
                          >
                            <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#261B13" }}>
                              ₹{prod.price.toLocaleString("en-IN")}
                            </span>

                            <Link
                              href="/admin"
                              style={{ fontSize: "11.5px", color: "#866951", textDecoration: "underline", fontWeight: 600 }}
                            >
                              Manage in Admin →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. HELP & SUPPORT TAB */}
            {activeTab === "support" && (
              <div className="fade-in-up">
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8DED3",
                    borderRadius: "20px",
                    padding: "36px 28px",
                    textAlign: "center",
                    boxShadow: "0 8px 30px -8px rgba(38,27,19,0.04)",
                  }}
                >
                  <span style={{ fontSize: "36px", display: "block", marginBottom: "14px" }}>💬</span>
                  <span className="luxury-badge" style={{ marginBottom: "8px" }}>
                    ✦ CUSTOMER SUPPORT ✦
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "26px",
                      color: "#261B13",
                      marginTop: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    Help & Support
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6E5B4E", lineHeight: 1.7, marginBottom: "28px", maxWidth: "520px", margin: "0 auto 28px auto" }}>
                    Have questions about your order, sizing, or our sarees? Contact our atelier concierge team directly.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px", margin: "0 auto" }}>
                    <Link
                      href="/contact"
                      className="avsaraa-btn-primary"
                      style={{ height: "50px", fontSize: "13.5px", backgroundColor: "#261B13", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <span>Contact Atelier Concierge</span>
                    </Link>
                    <a
                      href="mailto:contact.avsaraa@gmail.com"
                      className="avsaraa-btn-outline"
                      style={{ height: "48px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                    >
                      Email Us (contact.avsaraa@gmail.com)
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Address Modal Dialog (Universal & Responsive) */}
      {showAddressModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "24px",
              padding: "32px 28px",
              maxWidth: "540px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                  NEW ADDRESS
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13" }}>
                  Add Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{ fontSize: "22px", color: "#8E7D70", cursor: "pointer", background: "none", border: "none" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAddress.recipient_name}
                    onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                    required
                    placeholder="e.g. Radhika Kapoor"
                    style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newAddress.phone_number}
                    onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                    required
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                  Flat, House No, Building *
                </label>
                <input
                  type="text"
                  value={newAddress.address_line1}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                  required
                  placeholder="e.g. Flat 301, Rosewood Residences"
                  style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Street, Area *
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    placeholder="e.g. Ring Road, Textile Hub"
                    style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    placeholder="e.g. Near Textile Market"
                    style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                    placeholder="Surat"
                    style={{ width: "100%", height: "44px", padding: "0 12px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    required
                    placeholder="Maharashtra"
                    style={{ width: "100%", height: "44px", padding: "0 12px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={newAddress.postal_code}
                    onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                    required
                    placeholder="400050"
                    maxLength={6}
                    style={{ width: "100%", height: "44px", padding: "0 12px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "14px", backgroundColor: "#FCFAF7" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "18px", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#261B13" }}>Address Type:</span>
                {["Home", "Work", "Other"].map((type) => (
                  <label key={type} style={{ fontSize: "13px", color: "#4A3525", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="address_type"
                      value={type}
                      checked={newAddress.address_type === type}
                      onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}
                    />
                    {type}
                  </label>
                ))}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#261B13", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                />
                Set as default delivery address
              </label>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="avsaraa-btn-outline"
                  style={{ flex: 1, height: "46px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="avsaraa-btn-primary"
                  style={{ flex: 1, height: "46px", fontSize: "13px" }}
                >
                  {isSavingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Official Footer */}
      <Footer />
    </div>
  );
}
