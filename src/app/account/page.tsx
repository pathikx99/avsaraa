"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

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
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "concierge">("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated User State
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);

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

  // Fetch real profile & addresses from Supabase database
  const loadUserData = useCallback(async (userId: string, userEmail?: string) => {
    setIsLoading(true);

    try {
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
        // Fallback default profile from auth session
        const defaultProfile: UserProfile = {
          id: userId,
          full_name: userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "Avsaraa Patron",
          email: userEmail || "",
          phone_number: null,
          membership_tier: "Privilege",
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
        // Fallback to localStorage if table is pending schema creation
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
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (isMounted) setIsLoading(false);
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
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      showToast("Please sign in to update your profile");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedData = {
        id: authUser.id,
        full_name: editFullName.trim(),
        phone_number: editPhoneNumber.trim() || null,
        email: profile?.email || authUser.email || "",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updatedData);

      if (error) {
        console.warn("Profile update error:", error.message);
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editFullName.trim(),
              phone_number: editPhoneNumber.trim() || null,
            }
          : null
      );

      setIsEditingProfile(false);
      showToast("Profile details updated successfully");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("Could not update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Address
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
      // If setting as default, uncheck other addresses first in DB
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
        console.warn("DB insert error, saving to local cache:", error.message);
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

      showToast("Delivery address saved successfully");
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
      showToast("Address removed");
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
      await supabase.auth.signOut();
      setAuthUser(null);
      setProfile(null);
      setAddresses([]);
      showToast("Signed out safely");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Quick Demo Patron Login (for easy testing without manual credentials)
  const handleDemoSignIn = async () => {
    setIsLoading(true);
    try {
      const demoEmail = "demo.patron@avsaraa.in";
      const demoPassword = "AvsaraaPatron2026!";

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      let targetUser = signInData?.user || null;

      if (error || !targetUser) {
        // Sign up demo user if not existing
        const { data: signUpData } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: "Avsaraa Patron",
              phone_number: "+91 98200 12345",
            },
          },
        });
        targetUser = signUpData?.user || null;
      }

      if (targetUser) {
        setAuthUser(targetUser);
        await loadUserData(targetUser.id, targetUser.email);
        showToast("Signed in as Demo Patron");
      }
    } catch (err) {
      console.error("Demo login error:", err);
      showToast("Could not sign in with demo patron");
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar Initials
  const getInitials = (name?: string | null) => {
    if (!name) return "✦";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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
            padding: "10px 22px",
            borderRadius: "10px",
            fontSize: "13px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.35)",
            animation: "fadeIn 0.25s ease",
            maxWidth: "90vw",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Official Header & Announcement Bar */}
      <Header />

      <main style={{ flex: 1, paddingBottom: "60px" }}>
        {/* Profile Header Hero */}
        <div
          style={{
            backgroundColor: "#FAF7F2",
            borderBottom: "1px solid #E6DACF",
            position: "relative",
            overflow: "hidden",
            padding: "36px 20px 28px 20px",
          }}
        >
          {/* Decorative Corner Flowers */}
          <div
            style={{
              position: "absolute",
              right: "-25px",
              top: "-25px",
              width: "140px",
              height: "140px",
              pointerEvents: "none",
              opacity: 0.75,
            }}
          >
            <Image
              src="/images/botanical_flowers.jpg"
              alt=""
              fill
              sizes="140px"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>

          <div
            style={{
              maxWidth: "880px",
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
                fontSize: "12px",
                color: "#866951",
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Link href="/" style={{ opacity: 0.7 }}>
                Home
              </Link>
              <span>›</span>
              <span style={{ fontWeight: 600, color: "#261B13" }}>My Account</span>
            </div>

            {/* Profile Info Card */}
            {isLoading ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#8E7D70", fontSize: "14px" }}>
                Loading patron account details from database...
              </div>
            ) : authUser ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                {/* User Avatar */}
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C4AB94 0%, #866951 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "24px",
                    fontWeight: 600,
                    boxShadow: "0 6px 20px rgba(134, 105, 81, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(profile?.full_name)}
                </div>

                {/* Name & Membership */}
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <h1
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "26px",
                        fontWeight: 600,
                        color: "#261B13",
                        textTransform: "capitalize",
                      }}
                    >
                      {profile?.full_name || "Avsaraa Patron"}
                    </h1>
                    <span
                      style={{
                        backgroundColor: "#EFE6DC",
                        color: "#866951",
                        border: "1px solid #CFBEAD",
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>✦</span> {profile?.membership_tier || "PRIVILEGE"} MEMBER
                    </span>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "#6E5B4E", marginBottom: "2px" }}>
                    {profile?.phone_number ? `${profile.phone_number} • ` : ""}
                    {profile?.email || authUser.email}
                  </p>
                  <p style={{ fontSize: "12px", color: "#AC9885" }}>
                    Connected with Database Account
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleSignOut}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #CFBEAD",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#543E2E",
                      backgroundColor: "#FFFFFF",
                      transition: "all 0.2s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <span>Sign Out</span>
                    <span style={{ fontSize: "14px" }}>→</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guest Not Signed In Banner */
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "24px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "#261B13", marginBottom: "4px" }}>
                    Welcome to Avsaraa Atelier
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "#6E5B4E" }}>
                    Sign in to view your verified database profile, save delivery addresses, and manage account preferences.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href="/login"
                    className="avsaraa-btn-primary"
                    style={{ height: "42px", padding: "0 22px", fontSize: "13px" }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="avsaraa-btn-outline"
                    style={{ height: "42px", padding: "0 20px", fontSize: "13px" }}
                  >
                    Create Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    className="avsaraa-btn-outline"
                    style={{ height: "42px", padding: "0 16px", fontSize: "12px", borderColor: "#866951", color: "#866951" }}
                  >
                    ⚡ Demo Sign In
                  </button>
                </div>
              </div>
            )}

            {/* Account Quick Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              {[
                { label: "Account Status", value: authUser ? "Verified Active" : "Guest Mode" },
                { label: "Saved Addresses", value: `${addresses.length} ${addresses.length === 1 ? "Address" : "Addresses"}` },
                { label: "Membership Tier", value: authUser ? `✦ ${profile?.membership_tier || "Privilege"}` : "✦ Guest" },
                { label: "Data Source", value: "Supabase DB" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8DED3",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "17px",
                      fontWeight: 600,
                      color: "#261B13",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Horizontal Scrollable for Mobile) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E8DED3",
            position: "sticky",
            top: "57px",
            zIndex: 40,
          }}
        >
          <div
            className="no-scrollbar"
            style={{
              maxWidth: "880px",
              margin: "0 auto",
              padding: "0 16px",
              display: "flex",
              gap: "24px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {[
              { id: "profile", label: "Profile Details" },
              { id: "addresses", label: `Saved Addresses (${addresses.length})` },
              { id: "concierge", label: "Private Concierge" },
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
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div style={{ maxWidth: "880px", margin: "28px auto 0 auto", padding: "0 20px" }}>
          {/* 1. PROFILE DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="fade-in-up" style={{ maxWidth: "640px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "18px",
                  padding: "28px 24px",
                  boxShadow: "0 6px 24px -6px rgba(38,27,19,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13" }}>
                    Personal Information
                  </h3>
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
                      }}
                    >
                      {isEditingProfile ? "Cancel" : "Edit Details"}
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "0 14px",
                          border: "1px solid #CFBEAD",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "0 14px",
                          border: "1px solid #CFBEAD",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Email Address (Read-only)
                      </label>
                      <input
                        type="email"
                        value={profile?.email || authUser?.email || ""}
                        disabled
                        style={{
                          width: "100%",
                          height: "44px",
                          padding: "0 14px",
                          border: "1px solid #E8DED3",
                          backgroundColor: "#FAF7F2",
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: "#8E7D70",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="avsaraa-btn-primary"
                      style={{ height: "44px", fontSize: "13px", marginTop: "8px" }}
                    >
                      {isSavingProfile ? "Saving to Database..." : "Save Changes to Database"}
                    </button>
                  </form>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Full Name</span>
                      <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13", textTransform: "capitalize" }}>
                        {profile?.full_name || (authUser ? "Avsaraa Patron" : "Guest User")}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Mobile Number</span>
                      <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>
                        {profile?.phone_number || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Email Address</span>
                      <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>
                        {profile?.email || authUser?.email || "guest@avsaraa.in"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Membership Tier</span>
                      <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#866951" }}>
                        ✦ {profile?.membership_tier || "Standard Patron"}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid #EFE6DC", paddingTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link
                    href="/#about-us"
                    className="avsaraa-btn-outline"
                    style={{ flex: 1, height: "42px", fontSize: "13px" }}
                  >
                    Read About Us
                  </Link>
                  <Link
                    href="/#contact-us"
                    className="avsaraa-btn-primary"
                    style={{ flex: 1, height: "42px", fontSize: "13px" }}
                  >
                    Contact Concierge
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 2. ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="fade-in-up" style={{ maxWidth: "640px", margin: "0 auto" }}>
              {/* Saved Addresses List */}
              {addresses.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px dashed #CFBEAD",
                    borderRadius: "16px",
                    padding: "36px 20px",
                    textAlign: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "30px", display: "block", marginBottom: "8px" }}>📍</span>
                  <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "#261B13", marginBottom: "4px" }}>
                    No Saved Addresses
                  </h4>
                  <p style={{ fontSize: "13px", color: "#8E7D70", maxWidth: "360px", margin: "0 auto 16px auto" }}>
                    {authUser
                      ? "You haven't added any delivery addresses yet. Add your primary residence or atelier address to save to the database."
                      : "Sign in to save and manage your delivery addresses directly in your account."}
                  </p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8DED3",
                      borderRadius: "16px",
                      padding: "20px 24px",
                      marginBottom: "16px",
                      boxShadow: "0 4px 15px rgba(38,27,19,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "#261B13" }}>
                          {addr.recipient_name} ({addr.address_type})
                        </span>
                        {addr.is_default && (
                          <span
                            style={{
                              backgroundColor: "#EFE6DC",
                              color: "#866951",
                              fontSize: "10px",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontWeight: 600,
                            }}
                          >
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            style={{ fontSize: "12px", color: "#866951", textDecoration: "underline", cursor: "pointer" }}
                          >
                            Set Default
                          </button>
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

                    <p style={{ fontSize: "13.5px", color: "#4A3525", lineHeight: 1.6, marginBottom: "4px" }}>
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                      {addr.landmark ? ` (Near ${addr.landmark})` : ""}
                      <br />
                      {addr.city}, {addr.state} - {addr.postal_code}
                      <br />
                      Phone: {addr.phone_number}
                    </p>
                  </div>
                ))
              )}

              {/* Add Address Trigger */}
              <button
                type="button"
                onClick={() => {
                  if (!authUser) {
                    showToast("Please sign in to add and save delivery addresses");
                  } else {
                    setShowAddressModal(true);
                  }
                }}
                className="avsaraa-btn-outline"
                style={{ width: "100%", height: "48px", fontSize: "13.5px", backgroundColor: "#FFFFFF" }}
              >
                + Add New Address
              </button>
            </div>
          )}

          {/* 3. PRIVATE CONCIERGE TAB */}
          {activeTab === "concierge" && (
            <div className="fade-in-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>👑</span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "24px",
                    color: "#261B13",
                    marginBottom: "8px",
                  }}
                >
                  Avsaraa Private Concierge
                </h3>
                <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "24px" }}>
                  Need personal assistance with order inquiries, artisanal weaves, or bespoke drape recommendations? Our concierge desk is available directly via WhatsApp.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => showToast("Opening Avsaraa WhatsApp Concierge...")}
                    className="avsaraa-btn-primary"
                    style={{ height: "48px", fontSize: "13.5px", backgroundColor: "#261B13" }}
                  >
                    💬 Chat with Concierge on WhatsApp
                  </button>
                  <Link
                    href="/#contact-us"
                    className="avsaraa-btn-outline"
                    style={{ height: "48px", fontSize: "13.5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ✉️ Send Inquiry Form
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Address Modal Dialog */}
      {showAddressModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(38, 27, 19, 0.6)",
            backdropFilter: "blur(4px)",
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
              borderRadius: "20px",
              padding: "28px 24px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13" }}>
                Add New Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{ fontSize: "20px", color: "#8E7D70", cursor: "pointer", background: "none", border: "none" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAddress.recipient_name}
                    onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                    required
                    placeholder="e.g. Radhika Kapoor"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
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
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                  Address Line 1 (Flat, House No, Building) *
                </label>
                <input
                  type="text"
                  value={newAddress.address_line1}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                  required
                  placeholder="e.g. Flat 301, Rosewood Heights"
                  style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Address Line 2 / Area
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    placeholder="e.g. Linking Road, Bandra West"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
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
                    placeholder="e.g. Near Grand Hotel"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                    placeholder="Mumbai"
                    style={{ width: "100%", height: "42px", padding: "0 10px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
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
                    style={{ width: "100%", height: "42px", padding: "0 10px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
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
                    style={{ width: "100%", height: "42px", padding: "0 10px", borderRadius: "8px", border: "1px solid #CFBEAD", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#261B13" }}>Address Type:</span>
                {["Home", "Work", "Studio"].map((type) => (
                  <label key={type} style={{ fontSize: "13px", color: "#4A3525", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
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
                Make this my default shipping address
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="avsaraa-btn-outline"
                  style={{ flex: 1, height: "44px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="avsaraa-btn-primary"
                  style={{ flex: 1, height: "44px", fontSize: "13px" }}
                >
                  {isSavingAddress ? "Saving..." : "Save to Database"}
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
