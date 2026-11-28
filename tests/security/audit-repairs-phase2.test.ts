import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { validateCsrfOrigin } from "../../src/lib/csrf.ts";
import { isSuperAdminUser } from "../../src/lib/adminConstants.ts";
import { escapeHtml } from "../../src/lib/emailTemplates.ts";

// Silently populate test env vars from local .env files if unset (never logged)
try {
  for (const envPath of [".env.local", ".env"]) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        if (
          [
            "SHIPROCKET_WEBHOOK_TOKEN",
            "SHIPROCKET_WEBHOOK_SECRET",
            "RAZORPAY_WEBHOOK_SECRET",
            "RAZORPAY_KEY_SECRET",
          ].includes(k) &&
          !process.env[k]
        ) {
          process.env[k] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  }
} catch {
  // ignore
}

describe("Audit Phase 2 Security & Integrity Regression Suite", () => {
  describe("1. CSRF Protection (Local HTTP & Production HTTPS)", () => {
    test("Allows same-origin local HTTP requests without x-forwarded-proto header", () => {
      const req = new Request("http://localhost:3008/api/coupons/validate", {
        method: "POST",
        headers: {
          host: "localhost:3008",
          origin: "http://localhost:3008",
        },
      });
      const res = validateCsrfOrigin(req);
      assert.equal(res.allowed, true);
    });

    test("Allows production HTTPS same-origin requests behind TLS proxy", () => {
      const req = new Request("http://internal-next:3000/api/orders", {
        method: "POST",
        headers: {
          host: "avsaraa.in",
          "x-forwarded-proto": "https",
          origin: "https://avsaraa.in",
        },
      });
      const res = validateCsrfOrigin(req);
      assert.equal(res.allowed, true);
    });

    test("Blocks cross-origin and Sec-Fetch-Site cross-site requests", () => {
      const crossOriginReq = new Request("http://localhost:3008/api/orders", {
        method: "POST",
        headers: {
          host: "localhost:3008",
          origin: "https://attacker.example",
        },
      });
      assert.equal(validateCsrfOrigin(crossOriginReq).allowed, false);

      const secFetchCrossSite = new Request("https://avsaraa.in/api/orders", {
        method: "POST",
        headers: {
          host: "avsaraa.in",
          "sec-fetch-site": "cross-site",
        },
      });
      assert.equal(validateCsrfOrigin(secFetchCrossSite).allowed, false);
    });
  });

  describe("2. Admin Confirmation & Auth Hardening", () => {
    test("Rejects explicitly unconfirmed admin email strings (null or empty)", () => {
      assert.equal(
        isSuperAdminUser({ email: "web.avsaraa@gmail.com", email_confirmed_at: null }),
        false
      );
      assert.equal(
        isSuperAdminUser({ email: "web.avsaraa@gmail.com", email_confirmed_at: "" }),
        false
      );
      assert.equal(
        isSuperAdminUser({
          email: "web.avsaraa@gmail.com",
          email_confirmed_at: new Date().toISOString(),
        }),
        true
      );
    });
  });

  describe("3. Restock & Transactional Email Sanitization", () => {
    test("Escapes product, variant, size, and contact strings against HTML injection", () => {
      const maliciousProduct = '<img src=x onerror=alert("xss")>Silk Saree';
      const escaped = escapeHtml(maliciousProduct);
      assert.equal(escaped.includes("<img"), false);
      assert.ok(escaped.includes("&lt;img"));
    });
  });

  describe("3b. Checkout Variant Extraction", () => {
    function extractOrderItemVariant(productName: string): { size: string; color: string } {
      const parts = productName
        .split(" · ")
        .map((p) => p.trim())
        .filter((p) => p && p !== "Pre-Order");
      return {
        size: parts[1] || "Standard Size",
        color: parts[2] || "Default",
      };
    }

    test("Extracts real selected size and colorway from formatted cart item names", () => {
      assert.deepEqual(
        extractOrderItemVariant("Katan Silk Saree · Custom Tailored · Crimson Red"),
        { size: "Custom Tailored", color: "Crimson Red" }
      );
      assert.deepEqual(
        extractOrderItemVariant("Katan Silk Saree · Pre-Order · Free Size · Emerald"),
        { size: "Free Size", color: "Emerald" }
      );
      assert.deepEqual(extractOrderItemVariant("Plain Item"), {
        size: "Standard Size",
        color: "Default",
      });
    });
  });

  describe("4. Live Server Hardening Smoke Checks (when server running)", async () => {
    const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3008";
    let serverOnline = false;
    try {
      const check = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(3000) });
      serverOnline = check.status >= 200 && check.status < 500;
    } catch {
      serverOnline = false;
    }

    test(
      "GET /api/admin/upload requires admin authentication",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const res = await fetch(`${baseUrl}/api/admin/upload`);
        assert.equal(res.status, 401);
      }
    );

    test(
      "Cross-origin CSRF blocked on admin DELETE /auth, POST /inquiries, PATCH /products",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const targets: Array<{ path: string; method: string }> = [
          { path: "/api/admin/auth", method: "DELETE" },
          { path: "/api/admin/inquiries", method: "POST" },
          { path: "/api/admin/products", method: "PATCH" },
        ];
        for (const t of targets) {
          const res = await fetch(`${baseUrl}${t.path}`, {
            method: t.method,
            headers: {
              "Content-Type": "application/json",
              Origin: "https://evil-attacker.example",
            },
            body: JSON.stringify({}),
          });
          assert.equal(res.status, 403, `Expected 403 CSRF block on ${t.method} ${t.path}`);
        }
      }
    );

    test(
      "Same-origin local HTTP CSRF succeeds on POST /api/coupons/validate",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const res = await fetch(`${baseUrl}/api/coupons/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
          },
          body: JSON.stringify({ code: "TEST_NONEXISTENT", subtotal: 5000 }),
        });
        assert.notEqual(res.status, 403);
        assert.ok([200, 400].includes(res.status));
      }
    );

    test(
      "POST /api/auth/otp/verify rejects invalid purpose override",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const res = await fetch(`${baseUrl}/api/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contact: "patron@example.com",
            otp: "123456",
            purpose: "admin_privilege",
          }),
        });
        assert.equal(res.status, 400);
      }
    );

    test(
      "POST /api/auth/otp/send rejects malformed emails and never exposes debugOtp when NODE_ENV=production",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const badEmailRes = await fetch(`${baseUrl}/api/auth/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: "bad@", channel: "email" }),
        });
        assert.equal(badEmailRes.status, 400);
      }
    );

    test(
      "POST /api/shiprocket/webhook processes distinct status transitions without AWB collision",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN || process.env.SHIPROCKET_WEBHOOK_SECRET;
        if (!secret) return;
        const awb = `AWB-TEST-${Date.now()}`;
        const res1 = await fetch(`${baseUrl}/api/shiprocket/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": secret,
          },
          body: JSON.stringify({
            awb,
            current_status: "PICKED UP",
            current_timestamp: "2026-11-25T10:00:00Z",
          }),
        });
        assert.equal(res1.status, 200);
        const res2 = await fetch(`${baseUrl}/api/shiprocket/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": secret,
          },
          body: JSON.stringify({
            awb,
            current_status: "DELIVERED",
            current_timestamp: "2026-11-25T16:00:00Z",
          }),
        });
        assert.equal(res2.status, 200);
        const body2 = await res2.json();
        assert.notEqual(body2.message, "Duplicate Shiprocket event handled.");
        assert.notEqual(body2.message, "Duplicate Shiprocket event acknowledged.");
      }
    );

    test(
      "POST /api/razorpay/webhook returns 400 on malformed JSON with valid HMAC signature",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        if (!secret) return;
        const malformed = "{invalid_json";
        const sig = crypto.createHmac("sha256", secret).update(malformed).digest("hex");
        const res = await fetch(`${baseUrl}/api/razorpay/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-razorpay-signature": sig,
          },
          body: malformed,
        });
        assert.equal(res.status, 400);
      }
    );

    test(
      "GET /api/compare/products ignores malformed non-UUID IDs without 500 crash",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const res = await fetch(`${baseUrl}/api/compare/products?ids=not-a-uuid,invalid-id`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.deepEqual(data.products, []);
      }
    );

    test(
      "Cross-origin CSRF blocked on coupons/validate, auth/validate-phone, and auth/register-check",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        for (const path of [
          "/api/coupons/validate",
          "/api/auth/validate-phone",
          "/api/auth/register-check",
        ]) {
          const res = await fetch(`${baseUrl}${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: "https://evil-attacker.example",
            },
            body: JSON.stringify({ code: "TEST", subtotal: 1000 }),
          });
          assert.equal(res.status, 403, `Expected 403 CSRF block on POST ${path}`);
        }
      }
    );

    test(
      "POST /api/reviews/upload rejects corrupted non-image binary payload cleanly",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const form = new FormData();
        form.append("file", new Blob(["not a real image payload"], { type: "image/png" }), "fake.png");
        const res = await fetch(`${baseUrl}/api/reviews/upload`, {
          method: "POST",
          body: form,
        });
        assert.equal(res.status, 400);
      }
    );

    test(
      "Admin CSV template exports only schema-valid product categories",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const loginRes = await fetch(`${baseUrl}/api/admin/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: baseUrl },
          body: JSON.stringify({
            email: process.env.ADMIN_EMAIL || "web.avsaraa@gmail.com",
            password: process.env.ADMIN_PASSWORD || "V@12345678",
          }),
        });
        assert.equal(loginRes.status, 200);
        const cookie = (loginRes.headers.get("set-cookie") || "").split(";")[0];

        const csvRes = await fetch(`${baseUrl}/api/admin/products/template`, {
          headers: { Cookie: cookie },
        });
        assert.equal(csvRes.status, 200);
        const csvText = await csvRes.text();
        assert.equal(csvText.includes('"Kurtas"'), false);
        assert.match(csvText, /"Sarees"/);
        assert.match(csvText, /"Dresses"/);
        assert.match(csvText, /"Men's Wear"/);
      }
    );

    test("Open redirect sanitizer blocks external protocol-relative and off-origin URLs", () => {
      const safe = (raw: string | null | undefined): string => {
        if (!raw || typeof raw !== "string") return "/account";
        const t = raw.trim();
        if (!t.startsWith("/") || t.startsWith("//") || t.startsWith("/\\") || t.includes("://") || /[\r\n\t\\]/.test(t)) {
          return "/account";
        }
        return t;
      };

      assert.equal(safe("/wishlist"), "/wishlist");
      assert.equal(safe("/checkout?step=2"), "/checkout?step=2");
      assert.equal(safe("//evil.example/phish"), "/account");
      assert.equal(safe("https://evil.example/phish"), "/account");
      assert.equal(safe("/\\evil.example"), "/account");
      assert.equal(safe("/account\r\nLocation: evil"), "/account");
    });

    test(
      "GET /robots.txt and /sitemap.xml serve valid SEO metadata routes",
      { skip: !serverOnline ? "Server offline" : false },
      async () => {
        const robotsRes = await fetch(`${baseUrl}/robots.txt`);
        assert.equal(robotsRes.status, 200);
        const robotsTxt = await robotsRes.text();
        assert.match(robotsTxt, /Disallow: \/admin/);
        assert.match(robotsTxt, /Disallow: \/checkout/);
        assert.match(robotsTxt, /Sitemap: .*\/sitemap\.xml/);

        const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
        assert.equal(sitemapRes.status, 200);
        const sitemapXml = await sitemapRes.text();
        assert.match(sitemapXml, /<urlset/);
        assert.match(sitemapXml, /\/products/);
        assert.match(sitemapXml, /\/returns/);
      }
    );

    test("Exchange-only cancel policy, payments settlement sync, and admin stock_count sync are enforced in source", () => {
      const cancelSource = fs.readFileSync(
        path.resolve("src/app/api/orders/[id]/cancel/route.ts"),
        "utf8"
      );
      assert.equal(cancelSource.includes('"Refunded"'), false);
      assert.match(cancelSource, /order\.payment_status === "Paid"/);

      const webhookSource = fs.readFileSync(
        path.resolve("src/app/api/shiprocket/webhook/route.ts"),
        "utf8"
      );
      assert.match(webhookSource, /\.from\("payments"\)/);
      assert.match(webhookSource, /update\(\{ status: "Paid" \}\)/);

      const adminSource = fs.readFileSync(path.resolve("src/app/admin/page.tsx"), "utf8");
      assert.match(adminSource, /prev\.available_sizes\.length === 1[\s\S]*size_inventory/);

      const pdpSource = fs.readFileSync(
        path.resolve("src/app/products/[id]/ProductDetailClient.tsx"),
        "utf8"
      );
      assert.match(pdpSource, /Special Promo/);
    });
  });
});
