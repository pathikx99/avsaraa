import React from "react";
import type { Metadata } from "next";
import PolicyPageLayout, { TocItem } from "@/components/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | AVSARAA",
  description: "Official Privacy Policy of AVSARAA. Learn how we collect, use, store, and protect your personal data.",
};

const TOC: TocItem[] = [
  { id: "introduction", label: "Introduction" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-information", label: "How We Use Information" },
  { id: "communications", label: "WhatsApp & Email Communications" },
  { id: "payment-processing", label: "Payment Processing" },
  { id: "sharing-of-information", label: "Sharing of Information" },
  { id: "cookies", label: "Cookies & Similar Technologies" },
  { id: "data-security", label: "Data Security" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Choices & Privacy Rights" },
  { id: "third-party-services", label: "Third-Party Services & Links" },
  { id: "childrens-privacy", label: "Children's Privacy" },
  { id: "changes-to-policy", label: "Changes to This Privacy Policy" },
  { id: "contact-grievance", label: "Contact & Grievance Requests" },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout
      activePolicy="privacy"
      title="Privacy Policy"
      badge="DATA PROTECTION & PRIVACY"
      description="AVSARAA values your trust. This Privacy Policy explains how we collect, handle, protect, and process your personal information across our website and services."
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
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Welcome to <strong>AVSARAA</strong>. We value your trust and respect your privacy. This Privacy Policy explains how we collect, use, disclose, store and protect personal information when you visit our website, create an account, place an order or otherwise interact with our services.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            This policy should be read together with any notices presented at the point where information is collected. Where consent is required by applicable law, we will seek it before carrying out the relevant processing.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section id="information-we-collect" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>02</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Information We Collect
            </h2>
          </div>
          <p style={{ margin: "0 0 16px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Depending on how you use our website, we may collect the following categories of information:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "12px" }}>
            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E6DACF" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "8px" }}>
                Personal and Contact Information
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#5A4535", fontSize: "13.5px", lineHeight: 1.6 }}>
                <li>Name, mobile number and email address.</li>
                <li>Billing and shipping address and other details needed to fulfil an order.</li>
                <li>Information you provide when contacting customer support.</li>
              </ul>
            </div>

            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E6DACF" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "8px" }}>
                Account and Verification Information
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#5A4535", fontSize: "13.5px", lineHeight: 1.6 }}>
                <li>Account registration and login details.</li>
                <li>OTP verification events and related authentication records for WhatsApp and email verification. We do not need to retain the OTP itself after verification except where technically or legally necessary.</li>
              </ul>
            </div>

            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E6DACF" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "8px" }}>
                Order and Transaction Information
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#5A4535", fontSize: "13.5px", lineHeight: 1.6 }}>
                <li>Products purchased, order history, size or product preferences, delivery details, returns and refund information.</li>
                <li>Payment method, transaction reference and payment status received from our payment provider.</li>
              </ul>
            </div>

            <div style={{ padding: "18px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E6DACF" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#261B13", marginBottom: "8px" }}>
                Device and Usage Information
              </h3>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#5A4535", fontSize: "13.5px", lineHeight: 1.6 }}>
                <li>IP address, browser type, device information, approximate usage and website interaction data.</li>
                <li>Cookie identifiers and similar technologies, subject to applicable consent requirements.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. How We Use Information */}
        <section id="how-we-use-information" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>03</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              How We Use Information
            </h2>
          </div>
          <p style={{ margin: "0 0 10px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We use personal information for purposes such as:
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li>Creating and managing customer accounts and verifying login requests.</li>
            <li>Accepting, processing, confirming, dispatching and delivering orders.</li>
            <li>Processing payments, cancellations, returns and refunds.</li>
            <li>Sending transactional messages such as OTPs, order confirmations, payment updates and delivery notifications.</li>
            <li>Responding to enquiries and providing customer support.</li>
            <li>Improving website functionality, products and customer experience.</li>
            <li>Detecting fraud, protecting the website and enforcing our terms.</li>
            <li>Sending promotional communications where we have the required consent or other lawful basis.</li>
            <li>Meeting legal, tax, accounting and regulatory obligations.</li>
          </ul>
        </section>

        {/* 4. WhatsApp and Email Communications */}
        <section id="communications" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>04</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              WhatsApp and Email Communications
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA may use WhatsApp Business services and email systems, including automated tools, to communicate with customers. Depending on the purpose and your choices, these communications may include:
          </p>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li>OTP messages for account verification or login.</li>
            <li>Order, payment, dispatch, delivery, cancellation, return and refund updates.</li>
            <li>Responses to customer enquiries and service notifications.</li>
            <li>New collection announcements, offers and other promotional messages where the required consent has been obtained.</li>
          </ul>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We will distinguish service-related communications from promotional communications where appropriate. You may opt out of promotional messages using the available unsubscribe or opt-out method. Opting out of promotions will not necessarily stop essential messages needed to complete or support an order or account request.
          </p>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", borderLeft: "3px solid #866951", borderRadius: "6px", fontSize: "13.5px", color: "#5A4535" }}>
            WhatsApp is operated by Meta and may process information under its own terms and privacy policy. Our use of WhatsApp does not give AVSARAA access to your WhatsApp password, OTPs for other services or private messages unrelated to your interaction with us.
          </div>
        </section>

        {/* 5. Payment Processing */}
        <section id="payment-processing" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>05</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Payment Processing
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Online payments on our website are processed through <strong>Razorpay</strong>. Payment details are handled by Razorpay and the relevant banks, card networks or payment service providers in accordance with their applicable terms and privacy practices.
          </p>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            AVSARAA may receive limited payment-related information such as payment status, transaction reference, payment method type and refund status. <strong>We do not intend to store full card numbers, CVV values, UPI PINs or banking passwords on our systems.</strong>
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            For details about Razorpay&apos;s handling of payment information, please review Razorpay&apos;s own privacy policy and terms.
          </p>
        </section>

        {/* 6. Sharing of Information */}
        <section id="sharing-of-information" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>06</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Sharing of Information
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            <strong>We do not sell or rent customers&apos; personal information.</strong> We may share information that is reasonably necessary with service providers and other recipients for the purposes described in this policy, including:
          </p>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: "20px", color: "#4A3B30", fontSize: "14px", lineHeight: 1.75 }}>
            <li><strong>Razorpay</strong> and other relevant payment participants for payment processing and refunds.</li>
            <li>Courier, delivery and logistics partners (such as <strong>Shiprocket</strong>) to fulfil orders.</li>
            <li>WhatsApp Business providers, email providers and communication automation services to send messages.</li>
            <li>Website hosting, maintenance, analytics, security and technology providers.</li>
            <li>Professional advisers, auditors or insurers where reasonably required.</li>
            <li>Government, regulatory, law-enforcement or judicial authorities when required by law or to protect legal rights.</li>
          </ul>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            We expect service providers processing information on our behalf to handle it appropriately and only for authorised purposes, subject to applicable law and contractual arrangements.
          </p>
        </section>

        {/* 7. Cookies and Similar Technologies */}
        <section id="cookies" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>07</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Cookies and Similar Technologies
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Our website may use cookies and similar technologies to keep the shopping cart working, remember preferences, maintain sessions, improve security and understand website performance. Where required, we will seek consent before using non-essential cookies or similar tracking technologies.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            You can manage cookies through your browser settings. Disabling certain cookies may affect features such as login, cart functionality or checkout.
          </p>
        </section>

        {/* 8. Data Security */}
        <section id="data-security" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>08</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Data Security
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We use reasonable technical and organisational safeguards designed to protect personal information against unauthorised access, loss, misuse, alteration or disclosure. No internet transmission or electronic storage system can be guaranteed to be completely secure.
          </p>
          <div style={{ padding: "14px 18px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "8px", fontSize: "13.5px", color: "#5A4535" }}>
            <strong>Security Reminder:</strong> Customers should keep account credentials and OTPs confidential and should never share UPI PINs, CVVs or banking passwords with anyone claiming to represent AVSARAA.
          </div>
        </section>

        {/* 9. Data Retention */}
        <section id="data-retention" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>09</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Data Retention
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            We retain personal information for only as long as reasonably necessary for the purposes described in this policy, including order fulfilment, customer support, dispute resolution, fraud prevention and compliance with legal, tax and accounting requirements.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            When information is no longer required, we will take appropriate steps to delete or anonymise it, subject to applicable legal obligations.
          </p>
        </section>

        {/* 10. Your Choices and Privacy Rights */}
        <section id="your-rights" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>10</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Your Choices and Privacy Rights
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Subject to applicable law, you may have rights to request access to personal information, correction or updating of inaccurate information, erasure where legally permissible, withdrawal of consent, and grievance redressal. You may also opt out of promotional communications.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            To make a privacy request, contact us at <a href="mailto:info.avsaraa@gmail.com" style={{ color: "#866951", fontWeight: 600 }}>info.avsaraa@gmail.com</a>. We may need to verify your identity before acting on a request. Withdrawal of consent does not affect processing lawfully carried out before the withdrawal. Some information may need to be retained where required by law or necessary to establish, exercise or defend legal claims.
          </p>
        </section>

        {/* 11. Third-Party Services and Links */}
        <section id="third-party-services" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>11</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Third-Party Services and Links
            </h2>
          </div>
          <p style={{ margin: "0 0 12px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Our website may use or link to third-party services, including Razorpay, WhatsApp and delivery partners. Those providers may process information under their own privacy policies and terms. We encourage you to review their policies.
          </p>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            This policy describes AVSARAA&apos;s practices and does not govern independent processing by third parties.
          </p>
        </section>

        {/* 12. Children's Privacy */}
        <section id="childrens-privacy" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>12</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Children&apos;s Privacy
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            Our website and services are not directed at children who are not legally able to enter into the relevant transactions. We do not knowingly collect children&apos;s personal information in circumstances where doing so would violate applicable law. If you believe a child has provided personal information to us improperly, please contact us so we can review the matter.
          </p>
        </section>

        {/* 13. Changes to This Privacy Policy */}
        <section id="changes-to-policy" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>13</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Changes to This Privacy Policy
            </h2>
          </div>
          <p style={{ margin: 0, color: "#4A3B30", fontSize: "14.5px" }}>
            We may update this Privacy Policy from time to time to reflect changes in our practices, services or legal requirements. The updated version will be posted on this page with a revised effective date. Please review this page periodically.
          </p>
        </section>

        {/* 14. Contact and Grievance Requests */}
        <section id="contact-grievance" style={{ scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", backgroundColor: "#F7F2EE", padding: "3px 8px", borderRadius: "6px" }}>14</span>
            <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "22px", color: "#261B13", margin: 0 }}>
              Contact and Grievance Requests
            </h2>
          </div>
          <p style={{ margin: "0 0 14px 0", color: "#4A3B30", fontSize: "14.5px" }}>
            For questions, privacy requests or complaints about how AVSARAA handles personal information, contact:
          </p>
          <div style={{ padding: "18px 22px", backgroundColor: "#FAF7F2", border: "1px solid #E6DACF", borderRadius: "10px", fontSize: "14px", color: "#261B13", lineHeight: 1.8 }}>
            <strong>AVSARAA</strong><br />
            Email: <a href="mailto:info.avsaraa@gmail.com" style={{ color: "#866951", fontWeight: 600 }}>info.avsaraa@gmail.com</a><br />
            Location: Gujarat, India
          </div>
          <p style={{ margin: "14px 0 0 0", color: "#4A3B30", fontSize: "14.5px" }}>
            Please include enough detail for us to understand and respond to your request. We will address requests and grievances within the timelines required by applicable law.
          </p>
        </section>
      </div>
    </PolicyPageLayout>
  );
}
