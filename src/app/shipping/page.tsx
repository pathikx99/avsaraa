import React from "react";
import type { Metadata } from "next";
import PolicyPageLayout, { TocItem } from "@/components/PolicyPageLayout";
import Link from "next/link";
import { DeliveryVanIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | AVSARAA",
  description: "Official Shipping & Delivery Policy for AVSARAA. Learn about our delivery partners, timelines, and shipping rates.",
};

const TOC: TocItem[] = [
  { id: "introduction", label: "Introduction" },
  { id: "shipping-partner", label: "Shipping Partner" },
  { id: "shipping-charges", label: "Shipping Charges" },
  { id: "order-processing", label: "Order Processing" },
  { id: "delivery-time", label: "Estimated Delivery Time" },
  { id: "order-tracking", label: "Order Tracking" },
  { id: "delivery-address", label: "Delivery Address & Contact Details" },
  { id: "delivery-attempts", label: "Delivery Attempts & Unsuccessful Deliveries" },
  { id: "delays-outside-control", label: "Delays & Events Outside Our Control" },
  { id: "damaged-packages", label: "Damaged or Missing Packages" },
  { id: "contact-us", label: "Contact Us" },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyPageLayout
      activePolicy="shipping"
      title="Shipping & Delivery Policy"
      badge="LOGISTICS & FULFILLMENT"
      description="Thank you for shopping with AVSARAA. This policy explains how orders are processed, packed with care, shipped, and delivered securely to your doorstep."
      tableOfContents={TOC}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
        {/* 1. Introduction */}
        <section id="introduction" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>01</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Introduction
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Thank you for shopping with <strong>AVSARAA</strong>. This Shipping &amp; Delivery Policy explains how orders placed on our website are processed, shipped and delivered. We aim to make every delivery convenient and reliable.
          </p>
        </section>

        {/* 2. Shipping Partner */}
        <section id="shipping-partner" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>02</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Shipping Partner
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA uses <strong>Shiprocket</strong> and its associated courier partners to arrange shipment and delivery of customer orders.
          </p>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "8px", fontSize: "13.5px", color: "#5A4535" }}>
            The courier partner may vary depending on the delivery destination, service availability and operational requirements.
          </div>
        </section>

        {/* 3. Shipping Charges */}
        <section id="shipping-charges" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>03</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Shipping Charges
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA currently offers <strong>free standard shipping and delivery on orders above ₹799</strong> across serviceable delivery locations across India (₹50 standard shipping below ₹799).
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "14px" }}>
            <div style={{ padding: "20px", backgroundColor: "#FAF7F2", border: "1px solid #CFBEAD", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#866951", display: "block", marginBottom: "4px" }}>
                PREPAID ORDERS (₹799+)
              </span>
              <div style={{ fontSize: "20px", fontFamily: "var(--font-serif), Georgia, serif", color: "#261B13", fontWeight: 600, marginBottom: "6px" }}>
                Free Shipping &amp; Delivery
              </div>
              <p style={{ fontSize: "13px", color: "#6E5B4E", margin: 0 }}>
                Prepaid orders of ₹799 or above (UPI, Cards, NetBanking via Razorpay) qualify for complimentary Pan-India delivery. Orders under ₹799 carry a ₹50 shipping fee.
              </p>
            </div>

            <div style={{ padding: "20px", backgroundColor: "#FAF7F2", border: "1px solid #CFBEAD", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#866951", display: "block", marginBottom: "4px" }}>
                CASH ON DELIVERY (COD)
              </span>
              <div style={{ fontSize: "20px", fontFamily: "var(--font-serif), Georgia, serif", color: "#261B13", fontWeight: 600, marginBottom: "6px" }}>
                ₹20 Additional COD Charge
              </div>
              <p style={{ fontSize: "13px", color: "#6E5B4E", margin: 0 }}>
                An additional handling charge of ₹20 per order is added to the order total upon selecting Cash on Delivery.
              </p>
            </div>
          </div>

          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14px" }}>
            Any applicable charges will be displayed at checkout before the customer confirms the order. If a location is not serviceable, the customer will be informed where possible.
          </p>
        </section>

        {/* 4. Order Processing */}
        <section id="order-processing" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>04</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Order Processing
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Orders are generally processed after successful order placement and payment confirmation, where applicable. Processing time may vary depending on product availability, order volume, holidays and operational conditions.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Orders are not considered dispatched until they have been handed over to the courier partner and shipment information is generated or updated.
          </p>
        </section>

        {/* 5. Estimated Delivery Time */}
        <section id="delivery-time" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>05</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Estimated Delivery Time
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Estimated delivery timelines depend on the customer&apos;s location, courier service availability, weather, public holidays and other operational factors. The estimated delivery date or timeline, where available, will be shared during checkout or through shipment tracking.
          </p>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", borderLeft: "3px solid #866951", borderRadius: "6px", fontSize: "13.5px", color: "#5A4535" }}>
            Delivery estimates are indicative and are not guaranteed. Delays may occur due to circumstances beyond AVSARAA&apos;s reasonable control.
          </div>
        </section>

        {/* 6. Order Tracking */}
        <section id="order-tracking" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>06</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Order Tracking
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Once an order is dispatched, customers may receive shipment and tracking details through the contact information provided at checkout, such as email, WhatsApp or SMS, where available.
          </p>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Customers can use the tracking information or link provided to check the latest shipment status. Tracking updates are supplied by the courier network and may take time to refresh.
          </p>
          <div>
            <Link
              href="/track"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#261B13",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              <DeliveryVanIcon size={16} color="#FFFFFF" />
              <span>Track Your Order Online →</span>
            </Link>
          </div>
        </section>

        {/* 7. Delivery Address and Contact Details */}
        <section id="delivery-address" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>07</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Delivery Address and Contact Details
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Customers are responsible for providing a complete and accurate delivery address, PIN code and active contact number when placing an order.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA will not be responsible for delivery delays or failed delivery caused by incorrect or incomplete address details or unavailable contact information supplied by the customer. Please contact us as soon as possible if you notice an error in your delivery details. Address changes may not be possible after dispatch.
          </p>
        </section>

        {/* 8. Delivery Attempts and Unsuccessful Deliveries */}
        <section id="delivery-attempts" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>08</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Delivery Attempts and Unsuccessful Deliveries
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            The courier partner may make delivery attempts in accordance with its operational procedures. Customers should be available at the delivery address or make suitable arrangements to receive the parcel.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            If delivery is unsuccessful because the recipient is unavailable, the address is incorrect, the recipient refuses the parcel or the courier cannot complete delivery, the shipment may be re-attempted, held or returned to AVSARAA in accordance with the courier partner&apos;s process.
          </p>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "8px", fontSize: "13.5px", color: "#5A4535" }}>
            <strong>Cash on Delivery (COD) Notice:</strong> For COD orders, repeated refusal or failure to accept deliveries may affect the availability of COD for future orders, subject to applicable law and fair customer practices.
          </div>
        </section>

        {/* 9. Delays and Events Outside Our Control */}
        <section id="delays-outside-control" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>09</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Delays and Events Outside Our Control
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Delivery may be affected by weather conditions, natural events, transport disruption, public holidays, strikes, local restrictions, high order volumes or courier network issues. AVSARAA will make reasonable efforts to assist customers and coordinate with the courier partner when such delays occur.
          </p>
        </section>

        {/* 10. Damaged or Missing Packages */}
        <section id="damaged-packages" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>10</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Damaged or Missing Packages
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            If a package appears visibly damaged, tampered with or incomplete at the time of delivery, customers should contact AVSARAA promptly and, where possible, retain the packaging and take clear photographs or videos of the package and its contents.
          </p>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Please contact us with your order number and relevant details so that we can review the matter and coordinate with the courier partner. Any claim will be assessed in accordance with applicable law and AVSARAA&apos;s <Link href="/returns" style={{ color: "#866951", fontWeight: 600 }}>Exchange Policy</Link>.
          </p>
        </section>

        {/* 11. Contact Us */}
        <section id="contact-us" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>11</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Contact Us
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            For questions or assistance regarding shipping, delivery or order tracking, please contact:
          </p>
          <div style={{ padding: "18px 22px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "10px", fontSize: "14px", color: "#261B13", lineHeight: 1.8 }}>
            <strong>AVSARAA</strong><br />
            Email: <a href="mailto:info.avsaraa@gmail.com" style={{ color: "#866951", fontWeight: 600 }}>info.avsaraa@gmail.com</a><br />
            Location: Gujarat, India
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
}
