"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckIcon } from "@/components/Icons";

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if an order was placed recently
    try {
      const saved = sessionStorage.getItem("avsaraa_latest_order");
      if (saved) {
        const order = JSON.parse(saved);
        if (order?.id) {
          router.replace(`/order-success/${order.id}`);
        }
      }
    } catch {
      // Continue
    }
  }, [router]);

  return (
    <div style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", color: "#261B13" }}>
      <Header />
      <main style={{ maxWidth: "600px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(134, 105, 81, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckIcon size={32} color="#866951" />
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 400, letterSpacing: "0.04em", margin: "0 0 12px" }}>
          Thank You for Shopping with Avsaraa
        </h1>
        <p style={{ fontSize: "14px", color: "#6A5C52", lineHeight: 1.6, margin: "0 0 32px" }}>
          Your order has been safely placed with our Surat atelier artisans. You can track your parcel anytime using your Order Number and phone number.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <Link
            href="/track"
            className="avsaraa-btn-primary"
            style={{
              padding: "12px 28px",
              borderRadius: "24px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Track Your Order
          </Link>
          <Link
            href="/products"
            style={{
              padding: "12px 28px",
              borderRadius: "24px",
              border: "1px solid #D4BEAA",
              color: "#261B13",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
