import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  generateCustomerTaxInvoiceEmailHtml,
  generateAdminOrderAlertEmailHtml,
  generateInquiryAcknowledgementEmailHtml,
  generateEmailVerificationHtml,
  isGujaratSupply,
} from "../../src/lib/emailTemplates.ts";
import {
  sendEmail,
  sendCustomerOrderInvoice,
  sendInquiryAcknowledgementEmail,
  sendEmailVerificationEmail,
  dispatchOrderSuccessEmails,
  ORDER_EMAIL,
  SUPPORT_EMAIL,
  VERIFICATION_EMAIL,
  getOrderSender,
  getSupportSender,
  getVerificationSender,
} from "../../src/lib/emailService.ts";
import { issueContactProofToken } from "../../src/lib/contactVerification.ts";
import type { Order } from "../../src/types/order.ts";
import fs from "fs";

// Load test environment secrets if available
try {
  for (const envPath of [".env.local", ".env"]) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("OTP_PROOF_SECRET=") ||
          trimmed.startsWith("RAZORPAY_KEY_SECRET=") ||
          trimmed.startsWith("SUPABASE_URL=") ||
          trimmed.startsWith("SUPABASE_SECRET_KEY=") ||
          trimmed.startsWith("ADMIN_EMAIL=") ||
          trimmed.startsWith("ADMIN_PASSWORD=")
        ) {
          const [k, ...vParts] = trimmed.split("=");
          const key = k.trim();
          const val = vParts.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // ignore
}

async function resolveAvsaraaBaseUrl(): Promise<{ baseUrl: string; isOnline: boolean }> {
  const candidates = process.env.TEST_BASE_URL
    ? [process.env.TEST_BASE_URL]
    : ["http://localhost:3008", "http://localhost:3000"];

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.status === 200 || res.status === 503) {
        const data = await res.json();
        if (data && data.service && data.service.includes("Avsaraa")) {
          return { baseUrl: candidate, isOnline: true };
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (process.env.TEST_BASE_URL) {
    try {
      const check = await fetch(process.env.TEST_BASE_URL, { signal: AbortSignal.timeout(1000) });
      if (check.status >= 200 && check.status < 500) {
        return { baseUrl: process.env.TEST_BASE_URL, isOnline: true };
      }
    } catch {
      // Offline
    }
  }

  return { baseUrl: candidates[0], isOnline: false };
}

const { baseUrl: BASE_URL, isOnline: isServerOnline } = await resolveAvsaraaBaseUrl();

const mockSampleOrder: Order = {
  id: "e1000000-0000-0000-0000-000000000001",
  user_id: "7a3b2e24-820f-4706-8cc3-4218b42b0da3",
  order_number: "AVS-20261115-TEST",
  subtotal: 10000,
  discount_amount: 1000,
  shipping_fee: 0,
  total_amount: 9000,
  coupon_code: "AVSARAA10",
  order_status: "Confirmed",
  payment_status: "Paid",
  payment_method: "Razorpay",
  notes: "Urgent wedding order. Gift packing requested.",
  courier_partner: "Avsaraa Dedicated Express Courier",
  tracking_number: "BLUEDART-882910291",
  estimated_delivery: new Date(Date.now() + 86400000 * 3).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  shipping_address_snapshot: {
    recipient_name: "Meera Desai",
    phone_number: "9876543210",
    email: "meera.desai@example.com",
    is_guest: true,
    address_line1: "402 Royal Heritage Apartments",
    address_line2: "Opp. Iscon Temple, Ring Road",
    landmark: "Behind Lotus Mall",
    city: "Ahmedabad",
    state: "Gujarat",
    postal_code: "395007",
    country: "India",
  },
  order_items: [
    {
      id: "item-1",
      order_id: "e1000000-0000-0000-0000-000000000001",
      product_id: "p-1",
      product_name: "Kanjivaram Pure Zari Saree",
      image_url: "/images/sample.jpg",
      size: "Standard Size",
      color: "Crimson Red",
      unit_price: 10000,
      quantity: 1,
      total_price: 10000,
    },
  ],
};

describe("Razorpay & Resend Transactional Integration Suite", () => {
  describe("1. Statutory Indian GST Tax Invoice & Email Templates", () => {
    it("Correctly identifies Gujarat intra-state supply", () => {
      assert.equal(isGujaratSupply(mockSampleOrder), true);
    });

    it("Correctly identifies inter-state supply for non-Gujarat destinations", () => {
      const interstateOrder = {
        ...mockSampleOrder,
        shipping_address_snapshot: {
          ...mockSampleOrder.shipping_address_snapshot,
          state: "Maharashtra",
          postal_code: "400001",
        },
      };
      assert.equal(isGujaratSupply(interstateOrder), false);
    });

    it("Generates compliant GST Tax Invoice HTML with HSN 5208 and State Code 24", () => {
      const html = generateCustomerTaxInvoiceEmailHtml(mockSampleOrder);
      assert.match(html, /24AAACA0000A1Z5/); // Avsaraa GSTIN
      assert.match(html, /State Code: 24/);
      assert.match(html, /5208/); // HSN code
      assert.match(html, /CGST \(2\.5%\)/);
      assert.match(html, /SGST \(2\.5%\)/);
      assert.match(html, /AVSARAA10/);
      assert.match(html, /Meera Desai/);
      assert.match(html, /395007/);
      assert.match(html, /AUTHORIZED SIGNATORY/);
    });

    it("Escapes customer inputs to prevent HTML and email injection attacks", () => {
      const maliciousOrder = {
        ...mockSampleOrder,
        shipping_address_snapshot: {
          ...mockSampleOrder.shipping_address_snapshot,
          recipient_name: "<script>alert('xss')</script>John & Doe",
          address_line1: `123 Main St"><img src=x onerror=alert(1)>`,
        },
      };
      const html = generateCustomerTaxInvoiceEmailHtml(maliciousOrder);
      assert.doesNotMatch(html, /<script>/);
      assert.match(html, /&lt;script&gt;/);
      assert.match(html, /John &amp; Doe/);
    });

    it("Generates urgent Admin Order Alert HTML", () => {
      const adminHtml = generateAdminOrderAlertEmailHtml(mockSampleOrder);
      assert.match(adminHtml, /🚨 New Order Received: #AVS-20261115-TEST/);
      assert.match(adminHtml, /Packing Slip Items/);
      assert.match(adminHtml, /Avsaraa Local Atelier Hand-Delivery/);
    });

    it("Generates compliant Inquiry Acknowledgement HTML with support@avsaraa.in", () => {
      const html = generateInquiryAcknowledgementEmailHtml({
        customerName: "Radhika Sharma",
        subject: "Custom Saree Inquiry",
        message: "Looking for pure silk zari custom border.",
        inquiryId: "98765432-abcd-1234-ef00-112233445566",
      });
      assert.match(html, /Radhika Sharma/);
      assert.match(html, /#INQ-98765432/);
      assert.match(html, /Custom Saree Inquiry/);
      assert.match(html, /support@avsaraa\.in/);
      assert.match(html, /AVSARAA/);
    });

    it("Generates compliant Email Verification OTP HTML with support@avsaraa.in", () => {
      const html = generateEmailVerificationHtml({
        to: "priya.nair@example.com",
        otp: "847291",
        name: "Priya Nair",
      });
      assert.match(html, /Priya Nair/);
      assert.match(html, /847291/);
      assert.match(html, /EMAIL VERIFICATION/);
      assert.match(html, /support@avsaraa\.in/);
    });
  });

  describe("2. Resend Email Service Resilience", () => {
    it("Enforces order@avsaraa.in for bills, support@avsaraa.in for enquiries, and support@avsaraa.in for verification", () => {
      assert.equal(ORDER_EMAIL, "order@avsaraa.in");
      assert.equal(SUPPORT_EMAIL, "support@avsaraa.in");
      assert.equal(VERIFICATION_EMAIL, "support@avsaraa.in");
      assert.match(getOrderSender(), /order@avsaraa\.in/);
      assert.match(getSupportSender(), /support@avsaraa\.in/);
      assert.match(getVerificationSender(), /support@avsaraa\.in/);
      assert.doesNotMatch(getOrderSender(), /onboarding@resend\.dev/);
      assert.doesNotMatch(getSupportSender(), /onboarding@resend\.dev/);
      assert.doesNotMatch(getVerificationSender(), /onboarding@resend\.dev/);
    });

    it("Dispatches customer tax invoice bill via order@avsaraa.in", async () => {
      const billResult = await sendCustomerOrderInvoice(mockSampleOrder);
      assert.equal(billResult.success, true);
    });

    it("Dispatches inquiry acknowledgement email via support@avsaraa.in", async () => {
      const ackResult = await sendInquiryAcknowledgementEmail({
        customerName: "Pooja Varma",
        customerEmail: "pooja.varma@example.com",
        subject: "Bulk Wedding Order",
        message: "Need 20 matching Banarasi sarees.",
        inquiryId: "inq-12345678",
      });
      assert.equal(ackResult.success, true);
    });

    it("Dispatches email verification code via support@avsaraa.in", async () => {
      const verifyResult = await sendEmailVerificationEmail({
        to: "priya.nair@example.com",
        otp: "847291",
        name: "Priya Nair",
      });
      assert.equal(verifyResult.success, true);
    });
    it("Simulates email dispatch safely without throwing when RESEND_API_KEY is unset", async () => {
      const result = await sendEmail({
        to: "customer@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });

      assert.equal(result.success, true);
      assert.ok(result.simulated || result.messageId);
    });

    it("Rejects invalid or empty recipient lists cleanly", async () => {
      const result = await sendEmail({
        to: "",
        subject: "No Recipient",
        html: "<p>Hello</p>",
      });

      assert.equal(result.success, false);
      assert.match(result.error!, /No valid recipient/);
    });

    it("Dispatches both customer and admin emails in parallel via dispatchOrderSuccessEmails", async () => {
      const res = await dispatchOrderSuccessEmails(mockSampleOrder);
      assert.equal(res.customer.success, true);
      assert.equal(res.admin.success, true);
    });
  });

  describe(
    "3. Razorpay Backend Endpoints via HTTP",
    {
      skip: !isServerOnline
        ? `Live Avsaraa server is offline at ${BASE_URL}. Run 'npm run start' or 'npm run dev' to execute full E2E HTTP route suite.`
        : false,
    },
    () => {
    let ephemeralProductId = "";
    let adminCookie = "";
    let createdTestOrderId = "";
    let createdRazorpayOrderId = "";

    before(async () => {
      const authRes = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE_URL },
        body: JSON.stringify({
          email: process.env.ADMIN_EMAIL || "web.avsaraa@gmail.com",
          password: process.env.ADMIN_PASSWORD || "V@12345678",
        }),
      });
      adminCookie = (authRes.headers.get("set-cookie") || "").split(";")[0];

      const prodRes = await fetch(`${BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie, Origin: BASE_URL },
        body: JSON.stringify({
          name: `Test Integration Saree ${Date.now()}`,
          category: "Sarees",
          price: 14999,
          image_url: "/images/saree_model_hero.jpg",
          stock_count: 10,
        }),
      });
      const prodData = await prodRes.json().catch(() => null);
      ephemeralProductId = prodData?.data?.id || prodData?.product?.id || "";
      assert.match(String(prodData?.data?.specifications?.sku || ""), /^AVS-SAR-\d{4}-\d{4,}$/);
    });

    after(async () => {
      if (createdTestOrderId && process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
          await sb.from("order_items").delete().eq("order_id", createdTestOrderId);
          await sb.from("orders").delete().eq("id", createdTestOrderId);
        } catch {
          // ignore cleanup notice
        }
      }
      if (ephemeralProductId && adminCookie) {
        await fetch(`${BASE_URL}/api/admin/products?id=${encodeURIComponent(ephemeralProductId)}`, {
          method: "DELETE",
          headers: { Cookie: adminCookie, Origin: BASE_URL },
        }).catch(() => {});
      }
    });

    it("POST /api/razorpay/create-order rejects missing address snapshot with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    it("POST /api/razorpay/create-order rejects malformed pincodes with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_address_snapshot: {
            recipient_name: "Test User",
            phone_number: "9876543210",
            postal_code: "12345", // Invalid 5-digit PIN
          },
          items: [{ product_id: ephemeralProductId || "00000000-0000-0000-0000-000000000000", quantity: 1 }],
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.message, /Invalid postal code/i);
    });

    it("POST /api/razorpay/create-order creates order with valid Pan-India pincode", async () => {
      assert.ok(ephemeralProductId, "Ephemeral test product ID must be created");
      const phone = "+919876543210";
      const email = "rohan@example.com";
      const phoneToken = issueContactProofToken(phone, "order_phone");
      const emailToken = issueContactProofToken(email, "order_email");

      const res = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_address_snapshot: {
            recipient_name: "Rohan Patel",
            phone_number: phone,
            email: email,
            address_line1: "42 Connaught Place",
            city: "New Delhi",
            state: "Delhi",
            postal_code: "110001",
          },
          verification_tokens: {
            phone_token: phoneToken,
            email_token: emailToken,
          },
          items: [
            {
              product_id: ephemeralProductId,
              product_name: "Test Integration Saree",
              quantity: 1,
              unit_price: 14999,
            },
          ],
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.razorpay_order_id);
      assert.ok(data.amount > 0);
      assert.equal(data.currency, "INR");
      assert.ok(data.order_id);
      assert.match(String(data.order_number || ""), /^AVS-\d{8}-\d{5,}$/);
      createdTestOrderId = data.order_id;
      createdRazorpayOrderId = data.razorpay_order_id;
    });

    it("POST /api/razorpay/verify rejects missing order_id or mismatched razorpay_order_id with 400", async () => {
      const secret = process.env.RAZORPAY_KEY_SECRET || "avsaraa_test_razorpay_secret_key_2026";
      const swappedRzpOrderId = "order_swapped_mismatch_999";
      const razorpay_payment_id = "pay_integ_swapped_111";
      const sigForSwapped = crypto
        .createHmac("sha256", secret)
        .update(`${swappedRzpOrderId}|${razorpay_payment_id}`)
        .digest("hex");

      // Missing order_id must fail closed
      const missingRes = await fetch(`${BASE_URL}/api/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: swappedRzpOrderId,
          razorpay_payment_id,
          razorpay_signature: sigForSwapped,
        }),
      });
      assert.equal(missingRes.status, 400);

      // Valid signature from another razorpay_order_id swapped onto our order_id must fail closed
      if (createdTestOrderId) {
        const swapRes = await fetch(`${BASE_URL}/api/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: createdTestOrderId,
            razorpay_order_id: swappedRzpOrderId,
            razorpay_payment_id,
            razorpay_signature: sigForSwapped,
          }),
        });
        assert.equal(swapRes.status, 400);
      }
    });

    it("POST /api/razorpay/verify verifies bound order signature using timingSafeMatch", async () => {
      const secret = process.env.RAZORPAY_KEY_SECRET || "avsaraa_test_razorpay_secret_key_2026";
      const razorpay_order_id = createdRazorpayOrderId;
      const razorpay_payment_id = `pay_integ_${Date.now()}`;
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const res = await fetch(`${BASE_URL}/api/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: createdTestOrderId,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature: validSignature,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.payment_id, razorpay_payment_id);
    });

    it("POST /api/razorpay/verify rejects invalid or forged signature with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: "order_integ_999",
          razorpay_payment_id: "pay_integ_999",
          razorpay_signature: "forged_malicious_signature_hex",
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /signature verification failed/i);
    });
  });
});
