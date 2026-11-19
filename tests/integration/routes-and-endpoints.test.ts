import { describe, it } from "node:test";
import assert from "node:assert/strict";

async function resolveAvsaraaBaseUrl(): Promise<{ baseUrl: string; isOnline: boolean }> {
  const candidates = process.env.TEST_BASE_URL
    ? [process.env.TEST_BASE_URL]
    : ["http://localhost:3008", "http://localhost:3000"];

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.status === 200) {
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

describe(
  "E2E Application Routes & Interactive Endpoints Test Suite",
  {
    skip: !isServerOnline
      ? `Live Avsaraa server is offline at ${BASE_URL}. Run 'npm run start' or 'npm run dev' to execute full E2E HTTP route suite.`
      : false,
  },
  () => {
  describe("1. Static & SSR Navigation Routes", () => {
    const pages = [
      { path: "/", name: "Homepage" },
      { path: "/about", name: "Our Story / About" },
      { path: "/account", name: "Account Portal" },
      { path: "/admin", name: "Admin Portal" },
      { path: "/b2b", name: "B2B & Wholesale" },
      { path: "/checkout", name: "Checkout Portal" },
      { path: "/collection", name: "Curated Collections" },
      { path: "/contact", name: "Contact & Concierge" },
      { path: "/forgot-password", name: "Forgot Password" },
      { path: "/login", name: "Customer Login" },
      { path: "/products", name: "Product Catalog" },
      { path: "/register", name: "Customer Registration" },
      { path: "/reset-password", name: "Reset Password" },
      { path: "/shop", name: "Shop Alias" },
      { path: "/thank-you", name: "Order Thank You" },
      { path: "/track", name: "Live Order Tracking" },
      { path: "/under-1299", name: "Under 1299 Edit" },
      { path: "/wishlist", name: "Wishlist Vault" },
    ];

    for (const page of pages) {
      it(`Renders ${page.name} (${page.path}) with HTTP 200`, async () => {
        const res = await fetch(`${BASE_URL}${page.path}`);
        assert.equal(res.status, 200, `Expected 200 for ${page.path}, got ${res.status}`);
      });
    }
  });

  describe("2. Dynamic Product & Order Success Routes", () => {
    it("Renders valid PDP with HTTP 200", async () => {
      const validId = "e0000000-0000-0000-0000-000000000001";
      const res = await fetch(`${BASE_URL}/products/${validId}`);
      assert.equal(res.status, 200);
    });

    it("Returns 404 for non-existent product ID", async () => {
      const res = await fetch(`${BASE_URL}/products/non-existent-guid-9999`);
      assert.equal(res.status, 404);
    });

    it("Renders Order Success page with HTTP 200", async () => {
      const res = await fetch(`${BASE_URL}/order-success/ORD-TEST-999`);
      assert.equal(res.status, 200);
    });
  });

  describe("3. Administrative Authentication & Role Governance", () => {
    let adminCookie = "";

    it("Rejects unauthenticated GET /api/admin/auth with 401", async () => {
      const res = await fetch(`${BASE_URL}/api/admin/auth`);
      assert.equal(res.status, 401);
    });

    it("Rejects invalid admin credentials with 401", async () => {
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@avsaraa.com", password: "wrong-password" }),
      });
      assert.equal(res.status, 401);
    });

    it("Authenticates Super Admin and yields verified cryptographic session cookie", async () => {
      const res = await fetch(`${BASE_URL}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@avsaraa.com",
          password: "avsaraa_super_secret_admin_key_2026",
        }),
      });
      assert.equal(res.status, 200);
      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie, "Admin auth cookie must be provided in response");
      adminCookie = setCookie.split(";")[0];
    });

    it("Allows authenticated access to all Admin API endpoints", async () => {
      const adminEndpoints = [
        "/api/admin/auth",
        "/api/admin/products",
        "/api/admin/coupons",
        "/api/admin/orders",
        "/api/admin/users",
        "/api/admin/reviews",
        "/api/admin/inquiries",
      ];

      for (const ep of adminEndpoints) {
        const res = await fetch(`${BASE_URL}${ep}`, {
          headers: { Cookie: adminCookie },
        });
        assert.equal(res.status, 200, `Expected 200 for authenticated ${ep}`);
      }
    });
  });

  describe("4. Promotional Engine & Coupon Validation", () => {
    it("Correctly computes percentage discount for AVSARAA10", async () => {
      const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "AVSARAA10", subtotal: 5000 }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, true);
      assert.equal(data.coupon.discount_amount, 500); // 10% of 5000
    });

    it("Enforces minimum order threshold for WELCOME500", async () => {
      const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "WELCOME500", subtotal: 1500 }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.match(data.message, /minimum bag value/i);
    });

    it("Rejects non-existent promo codes", async () => {
      const res = await fetch(`${BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "INVALID_PROMO_99", subtotal: 5000 }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.valid, false);
    });
  });

  describe("5. Shipping, Logistics & Geolocation Boundaries", () => {
    it("Verifies serviceability for valid Gujarat pincode 380001", async () => {
      const res = await fetch(`${BASE_URL}/api/shiprocket/serviceability?pincode=380001`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.serviceability);
    });

    it("Rejects missing pincode parameter with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/shiprocket/serviceability`);
      assert.equal(res.status, 400);
    });
  });

  describe("6. Customer Authentication & Phone Verification", () => {
    it("Validates authentic Indian 10-digit mobile number", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/validate-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "9876543210" }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, true);
    });

    it("Rejects malformed phone number with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/validate-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "123" }),
      });
      assert.equal(res.status, 400);
    });
  });

  describe("7. Security, Webhooks & Payments Protection", () => {
    it("Rejects Razorpay verification with forged signature with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/razorpay/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: "order_123",
          razorpay_payment_id: "pay_456",
          razorpay_signature: "forged_signature",
          orderId: "ORD-123",
        }),
      });
      assert.equal(res.status, 400);
    });

    it("Rejects forged Razorpay webhook signature with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/razorpay/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": "forged_hmac",
        },
        body: JSON.stringify({ event: "payment.captured" }),
      });
      assert.equal(res.status, 400);
    });

    it("Rejects unauthorized Shiprocket webhook with 401", async () => {
      const res = await fetch(`${BASE_URL}/api/shiprocket/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_status: "DELIVERED" }),
      });
      assert.equal(res.status, 401);
    });

    it("Safely rejects review photo uploads with non-multipart Content-Type with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/reviews/upload`, {
        method: "POST",
      });
      assert.equal(res.status, 400);
    });
  });
});
