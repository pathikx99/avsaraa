import React from "react";
import type { Metadata } from "next";
import PolicyPageLayout, { TocItem } from "@/components/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Return, Exchange & Refund Policy | AVSARAA",
  description: "Official Return, Exchange & Refund Policy of AVSARAA. Learn about our size/design exchange criteria and damaged product claims.",
};

const TOC: TocItem[] = [
  { id: "introduction", label: "Introduction" },
  { id: "when-exchange-accepted", label: "When an Exchange Is Accepted" },
  { id: "price-difference", label: "Price Difference & Amount Adjustment" },
  { id: "refunds-damaged-products", label: "Refunds — Damaged Products Only" },
  { id: "reporting-damaged-product", label: "Reporting a Damaged Product" },
  { id: "conditions-for-exchanges", label: "Conditions for Exchanges" },
  { id: "exchange-request-process", label: "Exchange Request Process" },
  { id: "shipping-for-exchanges", label: "Shipping for Exchanges" },
  { id: "order-cancellations", label: "Order Cancellations" },
  { id: "contact-us", label: "Contact Us" },
];

export default function ReturnsPolicyPage() {
  return (
    <PolicyPageLayout
      activePolicy="returns"
      title="Return, Exchange & Refund Policy"
      badge="CUSTOMER SATISFACTION"
      description="At AVSARAA, we want you to feel confident and happy with your purchase. This policy explains the circumstances in which you may request a size change, design exchange or refund."
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
            At <strong>AVSARAA</strong>, we want you to feel confident and happy with your purchase. This policy explains the circumstances in which customers may request a size change, design exchange or refund. Please read it carefully before placing an order.
          </p>
        </section>

        {/* 2. When an Exchange Is Accepted */}
        <section id="when-exchange-accepted" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>02</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              When an Exchange Is Accepted
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA accepts exchange requests in the following situations, subject to the conditions in this policy:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "14px" }}>
            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                1. Size Change
              </h3>
              <p style={{ fontSize: "13.5px", color: "#5A4535", margin: 0, lineHeight: 1.6 }}>
                If the size purchased does not fit, you may request an exchange for another available size of the same product.
              </p>
            </div>

            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                2. Design Change
              </h3>
              <p style={{ fontSize: "13.5px", color: "#5A4535", margin: 0, lineHeight: 1.6 }}>
                You may request an exchange for a different design, subject to stock availability and confirmation by AVSARAA.
              </p>
            </div>
          </div>

          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", borderLeft: "3px solid #866951", borderRadius: "6px", fontSize: "13.5px", color: "#5A4535" }}>
            <strong>Prior Approval Mandatory:</strong> All exchange requests must be approved by AVSARAA before the product is sent back. Please contact our support team with your order number and the reason for the exchange.
          </div>
        </section>

        {/* 3. Price Difference and Amount Adjustment */}
        <section id="price-difference" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>03</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Price Difference and Amount Adjustment
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            If the replacement size or design has a different price, the difference in amount will be adjusted between the customer and AVSARAA:
          </p>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li>
              <strong>Higher Price:</strong> If the replacement product costs more, the customer will be asked to pay the additional amount before the replacement is dispatched.
            </li>
            <li>
              <strong>Lower Price:</strong> If the replacement product costs less, the difference will be adjusted or refunded through an appropriate payment method, as agreed with the customer and permitted by applicable law.
            </li>
          </ul>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14px" }}>
            Any adjustment will be communicated to the customer before the exchange is finalised.
          </p>
        </section>

        {/* 4. Refunds — Damaged Products Only */}
        <section id="refunds-damaged-products" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>04</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Refunds — Damaged Products Only
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Refunds are considered <strong>only in exceptional cases where a customer receives a product that is damaged</strong>. A refund is not the standard option for size or design preferences; customers should request an exchange in those situations.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            A damaged-product claim will be reviewed after the customer provides the required details and AVSARAA verifies the issue. If the claim is approved, AVSARAA will arrange an appropriate remedy, which may include a replacement or refund, as applicable and required by law.
          </p>
          <p style={{ margin: 0, color: "#6E5B4E", fontSize: "13.5px", fontStyle: "italic" }}>
            Nothing in this policy limits any rights or remedies that customers may have under applicable consumer protection laws.
          </p>
        </section>

        {/* 5. Reporting a Damaged Product */}
        <section id="reporting-damaged-product" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>05</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Reporting a Damaged Product
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            If you receive a damaged product, please contact AVSARAA <strong>as soon as possible after delivery</strong>. To help us review your request, please provide:
          </p>
          <div style={{ padding: "18px 22px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "10px", marginBottom: "14px" }}>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#4A3B30", fontSize: "13.5px", lineHeight: 1.75 }}>
              <li>Your order number and registered mobile number or email address.</li>
              <li>Clear photographs showing the damage to the product.</li>
              <li>Photographs of the outer packaging and shipping label, where available.</li>
              <li>A brief description of the issue.</li>
            </ul>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14px" }}>
            Please retain the product and its original packaging until our team has reviewed your request and advised you on the next steps. We may request additional information where reasonably necessary to assess the claim.
          </p>
        </section>

        {/* 6. Conditions for Exchanges */}
        <section id="conditions-for-exchanges" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>06</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Conditions for Exchanges
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Unless the product is damaged or otherwise required by applicable law, exchange requests are subject to the following conditions:
          </p>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li>The product must be unused, unwashed and unworn, other than reasonable inspection or try-on.</li>
            <li>Original tags, labels, packaging and accessories should be intact and included.</li>
            <li>The product must not show stains, damage, alterations, perfume or signs of use.</li>
            <li>The requested replacement size or design must be available.</li>
            <li>The customer must obtain approval and return instructions from AVSARAA before sending the product back.</li>
          </ul>
          <p style={{ margin: 0, color: "#6E5B4E", fontSize: "13.5px" }}>
            Products that do not meet these conditions may not qualify for a voluntary exchange. This does not affect rights available under applicable law.
          </p>
        </section>

        {/* 7. Exchange Request Process */}
        <section id="exchange-request-process" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>07</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Exchange Request Process
            </h2>
          </div>
          <ol style={{ margin: "0 0 16px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.8 }}>
            <li>
              <strong>Initiate Request:</strong> Contact us at <a href="mailto:info.avsaraa@gmail.com" style={{ color: "#866951", fontWeight: 600 }}>info.avsaraa@gmail.com</a> with your order number and request for a size or design change.
            </li>
            <li>
              <strong>Verification &amp; Availability:</strong> Our team will confirm whether the requested replacement is available and share the next steps.
            </li>
            <li>
              <strong>Reverse Logistics:</strong> After approval, follow the return or pickup instructions provided by our team.
            </li>
            <li>
              <strong>Inspection &amp; Dispatch:</strong> Once the returned product is received and inspected, the approved exchange and any price adjustment will be processed.
            </li>
          </ol>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", borderLeft: "3px solid #866951", borderRadius: "6px", fontSize: "13.5px", color: "#5A4535" }}>
            <strong>Important:</strong> Please do not send a product to an address without receiving return instructions from AVSARAA.
          </div>
        </section>

        {/* 8. Shipping for Exchanges */}
        <section id="shipping-for-exchanges" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>08</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Shipping for Exchanges
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            The applicable shipping or reverse-pickup arrangements for an exchange will be communicated by AVSARAA when the request is approved. Any applicable charges, if any, will be disclosed before the exchange is confirmed.
          </p>
        </section>

        {/* 9. Order Cancellations */}
        <section id="order-cancellations" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>09</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Order Cancellations
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            If you wish to cancel an order, contact AVSARAA as soon as possible. Cancellation may not be possible once the order has been processed, packed or handed over to the courier. Any eligible cancellation and refund will be handled in accordance with applicable law and the circumstances of the order.
          </p>
        </section>

        {/* 10. Contact Us */}
        <section id="contact-us" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>10</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Contact Us
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            For exchange requests, damaged-product reports or questions about this policy, please contact:
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
