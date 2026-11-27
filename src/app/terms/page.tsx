import React from "react";
import type { Metadata } from "next";
import PolicyPageLayout, { TocItem } from "@/components/PolicyPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | AVSARAA",
  description: "Official Terms & Conditions of AVSARAA. Read our terms governing website use, product orders, payments, and legal obligations.",
};

const TOC: TocItem[] = [
  { id: "introduction-acceptance", label: "Introduction & Acceptance" },
  { id: "about-avsaraa", label: "About AVSARAA" },
  { id: "eligibility-accounts", label: "Eligibility & Customer Accounts" },
  { id: "product-information", label: "Product Information & Availability" },
  { id: "prices-offers-taxes", label: "Prices, Offers & Taxes" },
  { id: "orders-acceptance", label: "Orders & Order Acceptance" },
  { id: "payments", label: "Payments & COD" },
  { id: "shipping-delivery", label: "Shipping & Delivery" },
  { id: "exchanges-no-refunds", label: "Exchanges Only (No Refunds)" },
  { id: "customer-conduct", label: "Customer Conduct & Acceptable Use" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "third-party-services", label: "Third-Party Services & Links" },
  { id: "website-availability", label: "Website Availability & Changes" },
  { id: "limitation-liability", label: "Limitation of Liability" },
  { id: "governing-law", label: "Governing Law & Disputes" },
  { id: "contact-us", label: "Contact Us" },
];

export default function TermsPage() {
  return (
    <PolicyPageLayout
      activePolicy="terms"
      title="Terms & Conditions"
      badge="LEGAL AGREEMENT"
      description="These Terms & Conditions govern your access to and use of the AVSARAA website and the purchase of products through it. Please read them carefully."
      tableOfContents={TOC}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
        {/* 1. Introduction and Acceptance */}
        <section id="introduction-acceptance" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>01</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Introduction and Acceptance
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Welcome to <strong>AVSARAA</strong>. These Terms &amp; Conditions govern your access to and use of the AVSARAA website and the purchase of products through it. By browsing the website, creating an account or placing an order, you agree to these Terms &amp; Conditions and the policies referred to here. If you do not agree, please do not use the website.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            These terms are intended to be read together with our <Link href="/privacy" style={{ color: "#866951", fontWeight: 600 }}>Privacy Policy</Link>, <Link href="/shipping" style={{ color: "#866951", fontWeight: 600 }}>Shipping &amp; Delivery Policy</Link> and <Link href="/returns" style={{ color: "#866951", fontWeight: 600 }}>Exchange Policy</Link>. If a specific policy provides additional details for a particular subject, that policy should be read with these terms. Nothing in these terms excludes rights that cannot lawfully be excluded under applicable law.
          </p>
        </section>

        {/* 2. About AVSARAA */}
        <section id="about-avsaraa" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>02</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              About AVSARAA
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA is a fashion and apparel brand based in Gujarat, India. For questions about the website, products or orders, you can contact us at <a href="mailto:info.avsaraa@gmail.com" style={{ color: "#866951", fontWeight: 600 }}>info.avsaraa@gmail.com</a>.
          </p>
        </section>

        {/* 3. Eligibility and Customer Accounts */}
        <section id="eligibility-accounts" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>03</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Eligibility and Customer Accounts
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            You must be legally capable of entering into a binding contract under applicable law to place an order. If you use the website on behalf of another person or entity, you confirm that you are authorised to do so.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            You are responsible for providing accurate, current and complete information when creating an account or placing an order. You must keep your login credentials and OTPs confidential and notify us promptly if you suspect unauthorised access to your account. <strong>AVSARAA will never ask you to disclose your UPI PIN, CVV or banking password.</strong>
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            We may use email or WhatsApp OTP verification to help authenticate account access. OTP delivery may depend on third-party communication networks and service availability.
          </p>
        </section>

        {/* 4. Product Information, Images and Availability */}
        <section id="product-information" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>04</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Product Information, Images and Availability
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We make reasonable efforts to display product descriptions, colours, sizes, measurements, fabrics and images as accurately as possible. However, actual colours may vary depending on screen settings, lighting and device display. Minor variations in print, texture, finish or measurements may occur due to the nature of fabrics and manufacturing.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Product images are for representation and may include styling or accessories that are not included with the product. Please review the product description, size chart, included items and other details before placing an order.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            All products are subject to availability. Adding a product to your cart does not guarantee that it will remain available until checkout is completed.
          </p>
        </section>

        {/* 5. Prices, Offers and Taxes */}
        <section id="prices-offers-taxes" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>05</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Prices, Offers and Taxes
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Prices and applicable charges will be shown on the website at the time of checkout. Unless stated otherwise, prices are in Indian Rupees (INR). Applicable taxes and charges will be displayed or accounted for as required by law.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We may update product prices, offers, discounts or promotions from time to time. A price change will not alter an order that AVSARAA has already accepted, except where correction is necessary due to an obvious pricing or listing error and subject to applicable law.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Promotional offers may have separate eligibility criteria, validity periods, limits or exclusions. Offers cannot be combined unless expressly stated.
          </p>
        </section>

        {/* 6. Orders and Order Acceptance */}
        <section id="orders-acceptance" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>06</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Orders and Order Acceptance
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            When you place an order, you are making an offer to purchase the selected products. An order confirmation or acknowledgement does not necessarily mean that the order has been finally accepted. AVSARAA may need to verify payment, stock, delivery serviceability and order details before dispatch.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We may contact you to clarify information or verify an order. We reserve the right to decline or cancel an order before dispatch where reasonably necessary, including in cases of product unavailability, suspected fraud, incorrect listing or pricing errors, payment issues, inaccurate details or delivery restrictions. Where an order cannot be fulfilled, our team will coordinate an exchange/replacement option or adjustment as applicable.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Please check your order details carefully before confirming checkout. Contact us as soon as possible if you notice an error. Changes may not be possible after processing or dispatch has begun.
          </p>
        </section>

        {/* 7. Payments */}
        <section id="payments" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>07</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Payments
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Online payments are processed through <strong>Razorpay</strong> and the payment methods made available at checkout. Payments are subject to the terms and security processes of Razorpay, banks and other payment participants.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA does not intend to store complete card numbers, CVV values, UPI PINs or banking passwords. An order paid online will be processed after payment confirmation is received.
          </p>
          <div style={{ padding: "16px 20px", backgroundColor: "#FAF7F2", border: "1px solid #CFBEAD", borderRadius: "10px", marginBottom: "12px" }}>
            <div style={{ fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>Cash on Delivery (COD):</div>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#5A4535" }}>
              Cash on Delivery (COD) may be offered for eligible orders and serviceable locations. <strong>A COD handling charge of ₹20 per order applies where COD is selected.</strong> Any applicable COD charge will be displayed at checkout before the order is placed.
            </p>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            You must not use another person&apos;s payment method without their authorisation. Suspected fraudulent or unauthorised transactions may be investigated and orders may be held or cancelled where permitted by law.
          </p>
        </section>

        {/* 8. Shipping and Delivery */}
        <section id="shipping-delivery" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>08</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Shipping and Delivery
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA uses <strong>Shiprocket</strong> and its associated courier partners to arrange deliveries. Standard shipping and delivery are free on prepaid orders to serviceable locations. COD orders carry an additional ₹20 COD handling charge.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Delivery timelines are estimates and may vary by destination, courier availability, weather, public holidays and other circumstances. Tracking information may be shared through email, WhatsApp or SMS where available. Please refer to our <Link href="/shipping" style={{ color: "#866951", fontWeight: 600 }}>Shipping &amp; Delivery Policy</Link> for further details.
          </p>
        </section>

        {/* 9. Exchanges Only (No Refunds) */}
        <section id="exchanges-no-refunds" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>09</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Exchanges Only (No Refunds)
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA operates a strict <strong>exchange-only policy (no refunds or standalone returns)</strong>, as detailed in our <Link href="/returns" style={{ color: "#866951", fontWeight: 600 }}>Exchange Policy</Link>.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Size-change and design-change requests within 7 days of delivery are processed subject to the conditions, availability and approval process set out in that policy. Any price difference for a replacement product will be adjusted with the customer (store credit for lower-priced items; balance payment for higher-priced items) before dispatch.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Monetary refunds are not offered; verified damaged items are replaced directly through our exchange process.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Customers should contact AVSARAA before sending any product back and should follow the exchange pickup instructions provided by our team.
          </p>
        </section>

        {/* 10. Customer Conduct and Acceptable Use */}
        <section id="customer-conduct" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>10</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Customer Conduct and Acceptable Use
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            You agree not to:
          </p>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li>Use the website for any unlawful, fraudulent or misleading purpose.</li>
            <li>Attempt to gain unauthorised access to the website, accounts, systems or data.</li>
            <li>Interfere with website security, availability or normal operation.</li>
            <li>Upload or transmit malicious code or harmful material.</li>
            <li>Misuse promotions, payment methods, COD services or customer support processes.</li>
            <li>Copy, scrape, reproduce or commercially exploit website content without permission, except as permitted by law.</li>
          </ul>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            We may take reasonable steps to protect the website, customers and our business where misuse or suspicious activity is identified, subject to applicable law.
          </p>
        </section>

        {/* 11. Intellectual Property */}
        <section id="intellectual-property" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>11</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Intellectual Property
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            The AVSARAA name, logo, brand elements, product photographs, designs, text, graphics, website layout and other content displayed on the website are owned by or licensed to AVSARAA, unless otherwise stated. They are protected by applicable intellectual property laws.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            You may view and use website content for personal, non-commercial shopping purposes. You must not reproduce, modify, distribute, publish or commercially use AVSARAA content without prior written permission, except where permitted by law.
          </p>
        </section>

        {/* 12. Third-Party Services and Links */}
        <section id="third-party-services" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>12</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Third-Party Services and Links
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            The website may use or link to third-party services, including Razorpay, WhatsApp, Shiprocket and courier partner services. These services may be governed by their own terms and privacy policies. AVSARAA is not responsible for independent third-party services, but we will take reasonable steps to work with relevant providers when an issue affects an order placed with us.
          </p>
        </section>

        {/* 13. Website Availability and Changes */}
        <section id="website-availability" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>13</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Website Availability and Changes
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We aim to keep the website available and accurate, but uninterrupted or error-free access cannot be guaranteed. We may update, suspend or modify website features, product listings or content for operational, security, maintenance or business reasons, subject to applicable law.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            We may revise these Terms &amp; Conditions from time to time. The updated version will be posted on the website with a revised effective date. Continued use of the website after an update constitutes acceptance of the revised terms to the extent permitted by law.
          </p>
        </section>

        {/* 14. Limitation of Liability */}
        <section id="limitation-liability" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>14</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Limitation of Liability
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            To the extent permitted by applicable law, AVSARAA will not be liable for indirect or consequential losses arising from use of the website or delays caused by events beyond our reasonable control. Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including statutory consumer rights or liability arising from fraud, wilful misconduct or other non-excludable grounds.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Nothing in these terms affects any rights or remedies available to consumers under applicable Indian law.
          </p>
        </section>

        {/* 15. Governing Law and Disputes */}
        <section id="governing-law" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>15</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Governing Law and Disputes
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            These Terms &amp; Conditions are governed by the laws of India. Any dispute will be subject to the jurisdiction of the competent courts at <strong>Gujarat, India</strong>, to the extent permitted by applicable law and without restricting any consumer forum or other remedy available to a customer under applicable law.
          </p>
        </section>

        {/* 16. Contact Us */}
        <section id="contact-us" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>16</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Contact Us
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            For questions about these Terms &amp; Conditions, orders or website use, please contact:
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
