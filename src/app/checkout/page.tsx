"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import {
  ShoppingBagIcon,
  ShieldCheckIcon,
  DeliveryVanIcon,
  ReturnBoxIcon,
  CheckIcon,
  SpinnerIcon,
  PlusIcon,
  BackArrowIcon,
} from "@/components/Icons";
import { AddressSnapshot, PaymentMethod } from "@/types/order";
import type { User } from "@supabase/supabase-js";
import { isValidGujaratPincode, calculateOrderTotals } from "@/lib/financials";

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
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi NCR",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, clearCart } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Addresses
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "Delhi NCR",
    postal_code: "",
    address_type: "Home",
    is_default: false,
  });

  // Coupons
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
    max_discount_amount?: number | null;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment & Order Options
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Online Card / UPI");
  const [orderNotes, setOrderNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dual-Contact Verification State (WhatsApp OTP / Email verification)
  const [isContactVerified, setIsContactVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  // 1. Authenticate user & load addresses
  const loadAddresses = useCallback(async (userId: string) => {
    try {
      setLoadingAddresses(true);
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (!error && data) {
        setAddresses(data as AddressItem[]);
        if (data.length > 0) {
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingNewAddress(true);
        }
      } else {
        setIsAddingNewAddress(true);
      }
    } catch (err) {
      console.warn("Addresses load notice:", err);
      setIsAddingNewAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        router.push("/login?redirectTo=/checkout");
      } else {
        setUser(data.user);
        setAuthLoading(false);
        loadAddresses(data.user.id);
      }
    });

    return () => {
      mounted = false;
    };
  }, [router, loadAddresses]);

  // Handle Apply Coupon
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) return;

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponCodeInput("");
        setCouponError(null);
      } else {
        setCouponError(data.message || "Invalid coupon code.");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Handle Save New Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (
      !newAddress.recipient_name.trim() ||
      !newAddress.phone_number.trim() ||
      !newAddress.address_line1.trim() ||
      !newAddress.city.trim() ||
      !newAddress.postal_code.trim()
    ) {
      setErrorMessage("Please complete all required address fields.");
      return;
    }

    // Strict Geographic Enforcement: Gujarat Pincode Verification (360000–399999)
    if (!isValidGujaratPincode(newAddress.postal_code)) {
      setErrorMessage(
        `Delivery restriction: Pincode "${newAddress.postal_code}" is outside Gujarat. Avsaraa delivers exclusively within Gujarat (pincodes 360000–399999).`
      );
      return;
    }

    setSavingAddress(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          recipient_name: newAddress.recipient_name.trim(),
          phone_number: newAddress.phone_number.trim(),
          address_line1: newAddress.address_line1.trim(),
          address_line2: newAddress.address_line2.trim() || null,
          landmark: newAddress.landmark.trim() || null,
          city: newAddress.city.trim(),
          state: newAddress.state,
          postal_code: newAddress.postal_code.trim(),
          country: "India",
          address_type: newAddress.address_type,
          is_default: addresses.length === 0 ? true : newAddress.is_default,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const created = data as AddressItem;
        setAddresses((prev) => [created, ...prev]);
        setSelectedAddressId(created.id);
        setIsAddingNewAddress(false);
        // Reset form
        setNewAddress({
          recipient_name: "",
          phone_number: "",
          address_line1: "",
          address_line2: "",
          landmark: "",
          city: "",
          state: "Delhi NCR",
          postal_code: "",
          address_type: "Home",
          is_default: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address.";
      setErrorMessage(msg);
    } finally {
      setSavingAddress(false);
    }
  };

  // Calculate Final Totals & Financials
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      const calculated = Math.round((subtotal * appliedCoupon.discount_value) / 100);
      return appliedCoupon.max_discount_amount
        ? Math.min(calculated, appliedCoupon.max_discount_amount)
        : calculated;
    }
    return appliedCoupon.discount_amount;
  }, [appliedCoupon, subtotal]);

  // Comprehensive financials: Dynamic courier fee, ₹500 free threshold, ₹10 COD surcharge, 5% GST
  const financials = useMemo(() => {
    return calculateOrderTotals({
      subtotal,
      discountAmount,
      paymentMethod,
    });
  }, [subtotal, discountAmount, paymentMethod]);

  const grandTotal = financials.totalAmount;

  // Selected Address Snapshot
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Send WhatsApp / Dual-Contact OTP
  const handleSendOtp = async (contactNumber?: string) => {
    const targetContact = contactNumber || selectedAddress?.phone_number || newAddress.phone_number;
    if (!targetContact) {
      setOtpError("Phone number required for verification.");
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: targetContact, channel: "whatsapp" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || "Failed to dispatch verification code.");
      } else {
        setOtpSuccessMessage(`Verification code dispatched to ${targetContact}.`);
        if (data.debugOtp) {
          setOtpInput(data.debugOtp);
        }
      }
    } catch {
      setOtpError("Could not reach OTP service. Please retry.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const targetContact = selectedAddress?.phone_number || newAddress.phone_number;
    if (!targetContact || !otpInput.trim()) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: targetContact, otp: otpInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || "Invalid verification code.");
      } else {
        setIsContactVerified(true);
        setIsOtpModalOpen(false);
        // Automatically proceed to place order
        executePlaceOrder();
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Core Order Placement Execution
  const executePlaceOrder = async () => {
    if (!user) {
      router.push("/login?redirectTo=/checkout");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Your shopping bag is empty.");
      return;
    }

    let addressSnapshot: AddressSnapshot | null = null;
    if (selectedAddress) {
      addressSnapshot = {
        recipient_name: selectedAddress.recipient_name,
        phone_number: selectedAddress.phone_number,
        address_line1: selectedAddress.address_line1,
        address_line2: selectedAddress.address_line2,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        country: selectedAddress.country || "India",
        address_type: selectedAddress.address_type,
      };
    } else if (
      isAddingNewAddress &&
      newAddress.recipient_name &&
      newAddress.phone_number &&
      newAddress.address_line1 &&
      newAddress.city &&
      newAddress.postal_code
    ) {
      addressSnapshot = {
        recipient_name: newAddress.recipient_name.trim(),
        phone_number: newAddress.phone_number.trim(),
        address_line1: newAddress.address_line1.trim(),
        address_line2: newAddress.address_line2.trim() || null,
        landmark: newAddress.landmark.trim() || null,
        city: newAddress.city.trim(),
        state: newAddress.state,
        postal_code: newAddress.postal_code.trim(),
        country: "India",
        address_type: newAddress.address_type,
      };
    } else {
      setErrorMessage("Please select or enter a delivery address to proceed.");
      return;
    }

    // Double-check Gujarat postal code before placing
    if (!isValidGujaratPincode(addressSnapshot.postal_code)) {
      setErrorMessage(
        `Delivery restriction: Postal code ${addressSnapshot.postal_code} is outside Gujarat. Avsaraa delivers exclusively within Gujarat (360000–399999).`
      );
      return;
    }

    setSubmittingOrder(true);
    setErrorMessage(null);

    try {
      const orderItemsPayload = cartItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        image_url: resolveProductImage(item.product.image_url),
        size: "Standard Size",
        color: "Default",
        unit_price: item.product.price,
        quantity: item.quantity,
      }));

      const payload = {
        shipping_address_id: selectedAddress?.id || null,
        shipping_address_snapshot: addressSnapshot,
        items: orderItemsPayload,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        payment_method: paymentMethod,
        notes: orderNotes.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.message || "Failed to place order. Please try again.");
      }

      // 1. Clear cart
      clearCart();

      // 2. Save order snapshot in sessionStorage as immediate backup for the success page
      try {
        sessionStorage.setItem("avsaraa_latest_order", JSON.stringify(data.order));
      } catch {
        // ignore
      }

      // 3. Navigate to Order Success page
      router.push(`/order-success/${data.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setSubmittingOrder(false);
    }
  };

  // Trigger Place Order (With Dual-Contact Verification Gateway)
  const handlePlaceOrder = async () => {
    const targetPin = selectedAddress?.postal_code || newAddress.postal_code;
    if (targetPin && !isValidGujaratPincode(targetPin)) {
      setErrorMessage(
        `Delivery restriction: Pincode "${targetPin}" is outside Gujarat. Avsaraa delivers exclusively within Gujarat (pincodes 360000–399999).`
      );
      return;
    }

    if (!isContactVerified) {
      setIsOtpModalOpen(true);
      const targetContact = selectedAddress?.phone_number || newAddress.phone_number;
      handleSendOtp(targetContact);
      return;
    }

    executePlaceOrder();
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "#FAF7F2",
          color: "#261B13",
        }}
      >
        <SpinnerIcon size={32} color="#866951" />
        <p style={{ fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Preparing your atelier checkout...
        </p>
      </div>
    );
  }

  // Empty cart view
  if (cartItems.length === 0 && !submittingOrder) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          backgroundColor: "#FAF7F2",
          color: "#261B13",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "rgba(134, 105, 81, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <ShoppingBagIcon size={32} color="#866951" />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-cinzel), serif",
            fontSize: "28px",
            fontWeight: 500,
            marginBottom: "10px",
            letterSpacing: "0.04em",
          }}
        >
          Your Shopping Bag is Empty
        </h1>
        <p
          style={{
            color: "#866951",
            maxWidth: "420px",
            fontSize: "14px",
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          Discover our curated collection of handcrafted Sarees, royal Dresses, and festive
          ensembles tailored for your cherished moments.
        </p>
        <Link
          href="/"
          className="avsaraa-btn-primary btn-shine"
          style={{
            padding: "14px 32px",
            borderRadius: "28px",
            textDecoration: "none",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            backgroundColor: "#261B13",
            color: "#FAF7F2",
          }}
        >
          Explore Heirlooms
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#FAF7F2",
        color: "#261B13",
        minHeight: "100vh",
        padding: "32px 16px 80px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(38, 27, 19, 0.08)",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#866951",
              textDecoration: "none",
              fontSize: "13px",
              letterSpacing: "0.04em",
            }}
          >
            <BackArrowIcon size={16} />
            <span>Continue Shopping</span>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#5A4535",
            }}
          >
            <ShieldCheckIcon size={16} color="#A97C50" />
            <span>256-Bit Encrypted Secure Checkout</span>
          </div>
        </div>

        {/* Page Title & Luxury Stepper */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "32px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Secure Checkout
          </h1>
          <p
            style={{
              color: "#866951",
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: "6px",
            }}
          >
            AVSARAA Atelier · Wear the moment
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "rgba(180, 40, 40, 0.08)",
              border: "1px solid rgba(180, 40, 40, 0.25)",
              color: "#8A1818",
              padding: "14px 20px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "13px",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={{
                background: "none",
                border: "none",
                color: "#8A1818",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Checkout Grid: 2 Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN: Delivery Address & Payment Method */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Step 1: Shipping Address */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
                boxShadow: "0 4px 20px rgba(38, 27, 19, 0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#261B13",
                      color: "#FAF7F2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    1
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-cinzel), serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}
                  >
                    Delivery Destination
                  </h2>
                </div>

                {!isAddingNewAddress && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#866951",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <PlusIcon size={14} color="#866951" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0" }}>
                  <SpinnerIcon size={18} color="#866951" />
                  <span style={{ fontSize: "13px", color: "#866951" }}>
                    Loading saved patron addresses...
                  </span>
                </div>
              ) : (
                <>
                  {/* Saved Addresses List */}
                  {!isAddingNewAddress && addresses.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            style={{
                              border: isSelected
                                ? "2px solid #261B13"
                                : "1px solid rgba(38, 27, 19, 0.12)",
                              borderRadius: "12px",
                              padding: "16px",
                              cursor: "pointer",
                              backgroundColor: isSelected ? "rgba(197, 168, 128, 0.08)" : "#FFFFFF",
                              transition: "all 0.2s ease",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                marginBottom: "6px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                                  {addr.recipient_name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(38, 27, 19, 0.08)",
                                    color: "#5A4535",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    fontWeight: 600,
                                  }}
                                >
                                  {addr.address_type || "Home"}
                                </span>
                                {addr.is_default && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                      backgroundColor: "rgba(169, 124, 80, 0.2)",
                                      color: "#866951",
                                      textTransform: "uppercase",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Default
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  border: isSelected ? "5px solid #261B13" : "2px solid #C5A880",
                                  backgroundColor: "#FFFFFF",
                                }}
                              />
                            </div>

                            <p
                              style={{
                                fontSize: "13px",
                                color: "#5A4535",
                                margin: "4px 0",
                                lineHeight: "1.5",
                              }}
                            >
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ""}
                              {addr.landmark ? ` (Landmark: ${addr.landmark})` : ""}
                            </p>
                            <p style={{ fontSize: "13px", color: "#5A4535", margin: "2px 0" }}>
                              {addr.city}, {addr.state} — {addr.postal_code}
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#866951",
                                margin: "4px 0 0",
                                fontWeight: 500,
                              }}
                            >
                              📞 Phone: {addr.phone_number}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add New Address Form (inline) */}
                  {isAddingNewAddress && (
                    <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#261B13" }}>
                          New Delivery Address
                        </span>
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddingNewAddress(false)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#866951",
                              fontSize: "12px",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            Recipient Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={newAddress.recipient_name}
                            onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit mobile"
                            value={newAddress.phone_number}
                            onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                          Address (House / Flat / Building No.) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flat 402, Royal Palms Apartment"
                          value={newAddress.address_line1}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(38, 27, 19, 0.18)",
                            fontSize: "13px",
                            backgroundColor: "#FAF7F2",
                          }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            Street / Area
                          </label>
                          <input
                            type="text"
                            placeholder="Street / Colony"
                            value={newAddress.address_line2}
                            onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            Landmark
                          </label>
                          <input
                            type="text"
                            placeholder="Nearby landmark"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            State *
                          </label>
                          <select
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          >
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", marginBottom: "4px" }}>
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="6 digits"
                            value={newAddress.postal_code}
                            onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(38, 27, 19, 0.18)",
                              fontSize: "13px",
                              backgroundColor: "#FAF7F2",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {["Home", "Work", "Studio", "Other"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewAddress({ ...newAddress, address_type: type })}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "16px",
                                fontSize: "12px",
                                border:
                                  newAddress.address_type === type
                                    ? "1px solid #261B13"
                                    : "1px solid rgba(38, 27, 19, 0.12)",
                                backgroundColor:
                                  newAddress.address_type === type ? "#261B13" : "transparent",
                                color: newAddress.address_type === type ? "#FAF7F2" : "#5A4535",
                                cursor: "pointer",
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#5A4535", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={newAddress.is_default}
                            onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                          />
                          <span>Set as default</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={savingAddress}
                        style={{
                          marginTop: "8px",
                          padding: "12px 20px",
                          borderRadius: "24px",
                          border: "none",
                          backgroundColor: "#261B13",
                          color: "#FAF7F2",
                          fontSize: "12px",
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        {savingAddress && <SpinnerIcon size={14} color="#FAF7F2" />}
                        <span>Save and Use Address</span>
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Step 2: Payment Method */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
                boxShadow: "0 4px 20px rgba(38, 27, 19, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  2
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    margin: 0,
                  }}
                >
                  Payment Method
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Option A: Online Payment */}
                <div
                  onClick={() => setPaymentMethod("Online Card / UPI")}
                  style={{
                    border:
                      paymentMethod === "Online Card / UPI"
                        ? "2px solid #261B13"
                        : "1px solid rgba(38, 27, 19, 0.12)",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    backgroundColor:
                      paymentMethod === "Online Card / UPI" ? "rgba(197, 168, 128, 0.08)" : "#FFFFFF",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          border:
                            paymentMethod === "Online Card / UPI"
                              ? "5px solid #261B13"
                              : "2px solid #C5A880",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "#261B13" }}>
                          Online Payment (Instant & Insured)
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#866951" }}>
                          UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(40, 167, 69, 0.12)",
                        color: "#28a745",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Instant Dispatch
                    </span>
                  </div>
                </div>

                {/* Option B: Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  style={{
                    border:
                      paymentMethod === "COD"
                        ? "2px solid #261B13"
                        : "1px solid rgba(38, 27, 19, 0.12)",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    backgroundColor:
                      paymentMethod === "COD" ? "rgba(197, 168, 128, 0.08)" : "#FFFFFF",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          border:
                            paymentMethod === "COD"
                              ? "5px solid #261B13"
                              : "2px solid #C5A880",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "#261B13" }}>
                          Cash on Delivery (COD)
                        </span>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#866951" }}>
                          Pay with cash or UPI directly to the courier agent upon doorstep delivery
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(134, 105, 81, 0.1)",
                        color: "#866951",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Atelier Notes */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px 28px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#261B13",
                  marginBottom: "8px",
                }}
              >
                Special Delivery Instructions / Atelier Gift Message (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please include signature gift packaging, leave with reception, etc."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(38, 27, 19, 0.15)",
                  fontSize: "13px",
                  backgroundColor: "#FAF7F2",
                  color: "#261B13",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Payment Sticky Card */}
          <div style={{ position: "sticky", top: "24px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
                boxShadow: "0 8px 32px rgba(38, 27, 19, 0.05)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  margin: "0 0 16px 0",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(38, 27, 19, 0.08)",
                }}
              >
                Order Summary ({cartItems.length} {cartItems.length === 1 ? "Piece" : "Pieces"})
              </h2>

              {/* Items List */}
              <div
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  paddingRight: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingBottom: "12px",
                      borderBottom: "1px dashed rgba(38, 27, 19, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "56px",
                        height: "70px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "#EFECE6",
                      }}
                    >
                      <Image
                        src={resolveProductImage(item.product.image_url)}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          margin: 0,
                          color: "#261B13",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.product.name}
                      </p>
                      <p style={{ fontSize: "12px", color: "#866951", margin: "2px 0 0" }}>
                        Qty: {item.quantity} · {formatINR(item.product.price)}
                      </p>
                    </div>

                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", flexShrink: 0 }}>
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Section */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(197, 168, 128, 0.08)",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5A4535" }}>
                    Atelier Promotion
                  </span>
                  {!appliedCoupon && (
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon("AVSARAA10")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#A97C50",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Apply &quot;AVSARAA10&quot;
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#FFFFFF",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(40, 167, 69, 0.3)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckIcon size={14} color="#28a745" />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#28a745" }}>
                        {appliedCoupon.code} Applied (-{formatINR(discountAmount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#866951",
                        fontSize: "12px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(38, 27, 19, 0.18)",
                        fontSize: "12px",
                        backgroundColor: "#FFFFFF",
                        textTransform: "uppercase",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={validatingCoupon || !couponCodeInput.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#261B13",
                        color: "#FAF7F2",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {validatingCoupon ? <SpinnerIcon size={12} color="#FAF7F2" /> : "Apply"}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#8A1818" }}>
                    {couponError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A4535" }}>
                  <span>Bag Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#28a745" }}>
                    <span>Promotion ({appliedCoupon.code})</span>
                    <span>-{formatINR(discountAmount)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A4535" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Gujarat Insured Courier Delivery</span>
                    {financials.shippingFee === 0 && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(40, 167, 69, 0.12)",
                          color: "#28a745",
                          fontWeight: 600,
                        }}
                      >
                        FREE (Orders ≥ ₹500)
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 600, color: financials.shippingFee === 0 ? "#28a745" : "#261B13" }}>
                    {financials.shippingFee === 0 ? "₹0" : formatINR(financials.shippingFee)}
                  </span>
                </div>

                {financials.codSurcharge > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A4535" }}>
                    <span>Cash on Delivery (COD) Surcharge</span>
                    <span style={{ fontWeight: 600, color: "#866951" }}>{formatINR(financials.codSurcharge)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#866951" }}>
                  <span>Inclusive 5% GST</span>
                  <span>₹{financials.gstAmount} (Included)</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#261B13",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(38, 27, 19, 0.12)",
                    marginTop: "4px",
                  }}
                >
                  <span>Total Amount</span>
                  <span>{formatINR(financials.totalAmount)}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submittingOrder || !selectedAddressId}
                className="avsaraa-btn-primary btn-shine"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "25px",
                  border: "none",
                  backgroundColor: !selectedAddressId ? "#866951" : "#261B13",
                  color: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: submittingOrder || !selectedAddressId ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "background-color 0.2s ease",
                  boxShadow: "0 4px 16px rgba(38, 27, 19, 0.2)",
                }}
              >
                {submittingOrder ? (
                  <>
                    <SpinnerIcon size={16} color="#FAF7F2" />
                    <span>Confirming Atelier Order...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBagIcon size={16} color="#FAF7F2" />
                    <span>
                      {paymentMethod === "COD" ? "Place Cash on Delivery Order" : "Place Order & Pay"}{" "}
                      · {formatINR(grandTotal)}
                    </span>
                  </>
                )}
              </button>

              {!selectedAddressId && (
                <p style={{ textAlign: "center", fontSize: "11px", color: "#866951", margin: "8px 0 0" }}>
                  * Please select or enter a delivery address above to confirm your order.
                </p>
              )}

              {/* Brand Assurances */}
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "20px",
                  borderTop: "1px solid rgba(38, 27, 19, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5A4535" }}>
                  <DeliveryVanIcon size={16} color="#866951" />
                  <span>Complimentary Pan-India Insured Express Shipping</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5A4535" }}>
                  <ReturnBoxIcon size={16} color="#866951" />
                  <span>7-Day Hassle-Free Heritage Exchange Guarantee</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5A4535" }}>
                  <ShieldCheckIcon size={16} color="#866951" />
                  <span>Authentic Handcrafted Masterpieces with Silk Mark Standards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Dual-Contact Verification Modal (WhatsApp / SMS / Email OTP) */}
      {isOtpModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F2",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid #EAE3D9",
              position: "relative",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(134, 105, 81, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <ShieldCheckIcon size={24} color="#866951" />
              </div>
              <h3 style={{ fontSize: "20px", color: "#261B13", margin: "0 0 6px", fontWeight: 600 }}>
                Verify Delivery Contact
              </h3>
              <p style={{ fontSize: "13px", color: "#6A5C52", margin: 0, lineHeight: 1.5 }}>
                To secure your atelier order, please enter the 6-digit verification code dispatched to{" "}
                <strong>{selectedAddress?.phone_number || newAddress.phone_number || "your contact"}</strong>.
              </p>
            </div>

            {otpSuccessMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(40, 167, 69, 0.1)",
                  border: "1px solid rgba(40, 167, 69, 0.3)",
                  borderRadius: "8px",
                  color: "#1e7e34",
                  fontSize: "12px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {otpSuccessMessage}
              </div>
            )}

            {otpError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(220, 53, 69, 0.1)",
                  border: "1px solid rgba(220, 53, 69, 0.3)",
                  borderRadius: "8px",
                  color: "#dc3545",
                  fontSize: "12px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#5A4535",
                  marginBottom: "8px",
                }}
              >
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{
                  width: "100%",
                  height: "48px",
                  textAlign: "center",
                  fontSize: "22px",
                  letterSpacing: "0.3em",
                  fontWeight: 700,
                  color: "#261B13",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D4BEAA",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "22px",
                  border: "1px solid #D4BEAA",
                  backgroundColor: "transparent",
                  color: "#5A4535",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpInput.trim().length !== 6}
                style={{
                  flex: 2,
                  height: "44px",
                  borderRadius: "22px",
                  border: "none",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: verifyingOtp || otpInput.trim().length !== 6 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {verifyingOtp ? (
                  <>
                    <SpinnerIcon size={16} color="#FAF7F2" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Confirm Order</span>
                )}
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={sendingOtp}
                style={{
                  background: "none",
                  border: "none",
                  color: "#866951",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {sendingOtp ? "Resending code..." : "Resend WhatsApp / SMS code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

