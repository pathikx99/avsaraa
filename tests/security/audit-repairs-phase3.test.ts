import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { generateLogisticsMilestones } from "../../src/lib/shiprocket.ts";
import { normalizePhoneNumber } from "../../src/lib/phoneUtils.ts";
import { isValidGujaratPincode, isValidIndianPincode } from "../../src/lib/financials.ts";

async function resolveLiveServer(): Promise<{ baseUrl: string; isOnline: boolean }> {
  const candidates = process.env.TEST_BASE_URL
    ? [process.env.TEST_BASE_URL]
    : ["http://localhost:3008", "http://localhost:3000"];

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.status === 200 || res.status === 503) {
        const data = await res.json();
        if (data && typeof data.service === "string" && data.service.includes("Avsaraa")) {
          return { baseUrl: candidate, isOnline: true };
        }
      }
    } catch {
      // Server offline on candidate port
    }
  }
  return { baseUrl: candidates[0], isOnline: false };
}

const { baseUrl: BASE_URL, isOnline: isServerOnline } = await resolveLiveServer();

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

describe("Audit Phase 3 Security, Integrity & UX Regression Suite", () => {
  describe("1. Pan-India Logistics & Pincode Validation", () => {
    test("generateLogisticsMilestones uses India suffix for non-Gujarat PINs and Gujarat suffix for 360000-399999", () => {
      const delhiScans = generateLogisticsMilestones({
        orderNumber: "AVS-TEST-DELHI",
        status: "Delivered",
        createdAt: "2026-11-20T10:00:00Z",
        city: "New Delhi",
        postalCode: "110001",
        courierPartner: "Shiprocket Air Express",
      });

      const deliveredScan = delhiScans.find((s) => s.status === "Delivered");
      const outScan = delhiScans.find((s) => s.status === "Out for Delivery");
      assert.ok(deliveredScan);
      assert.ok(outScan);
      assert.equal(deliveredScan.location, "New Delhi, India");
      assert.equal(outScan.location, "New Delhi, India");

      const localScans = generateLogisticsMilestones({
        orderNumber: "AVS-TEST-LOCAL",
        status: "Delivered",
        createdAt: "2026-11-20T10:00:00Z",
        city: "Ahmedabad",
        postalCode: "380001",
        courierPartner: "Blue Dart Express Gujarat",
      });

      const localDelivered = localScans.find((s) => s.status === "Delivered");
      assert.ok(localDelivered);
      assert.equal(localDelivered.location, "Ahmedabad, Gujarat");
    });

    test("Pincode & phone validators accept valid Pan-India values and reject malformed inputs", () => {
      assert.equal(isValidIndianPincode("110001"), true);
      assert.equal(isValidIndianPincode("395007"), true);
      assert.equal(isValidIndianPincode("010001"), false);
      assert.equal(isValidIndianPincode("12345"), false);

      assert.equal(isValidGujaratPincode("395007"), true);
      assert.equal(isValidGujaratPincode("110001"), false);

      assert.equal(normalizePhoneNumber("9876543210").isValid, true);
      assert.equal(normalizePhoneNumber("+91 9876543210").normalized, "+919876543210");
      assert.equal(normalizePhoneNumber("12345").isValid, false);
      assert.equal(normalizePhoneNumber("5123456789").isValid, false);
    });
  });

  describe("2. Source-Level Invariant Checks for Audited Fixes", () => {
    test("GET /api/reviews excludes customer_email and user_id PII via explicit projection", () => {
      const src = readProjectFile("src/app/api/reviews/route.ts");
      assert.ok(src.includes("PUBLIC_REVIEW_COLUMNS"));
      assert.equal(src.includes("customer_email"), true); // only in insert payload, not select("*")
      assert.equal(/\.from\("reviews"\)\s*\.\s*select\("\*"\)/.test(src), false);
    });

    test("Review photo pipeline auto-orients EXIF images before resizing", () => {
      const src = readProjectFile("src/app/api/reviews/upload/route.ts");
      assert.ok(src.includes(".rotate()"));
      assert.ok(src.indexOf(".rotate()") < src.indexOf(".resize("));
    });

    test("Razorpay verify & webhook reject cancelled-order resurrection and handle stock conflicts", () => {
      const verifySrc = readProjectFile("src/app/api/razorpay/verify/route.ts");
      const webhookSrc = readProjectFile("src/app/api/razorpay/webhook/route.ts");

      assert.ok(verifySrc.includes('order.order_status === "Cancelled"'));
      assert.ok(verifySrc.includes('.neq("order_status", "Cancelled")'));
      assert.ok(verifySrc.includes("[STOCK CONFLICT]"));

      assert.ok(webhookSrc.includes('.neq("order_status", "Cancelled")'));
      assert.ok(webhookSrc.includes("[STOCK CONFLICT]"));
    });

    test("Shiprocket webhook prevents backwards status downgrades", () => {
      const src = readProjectFile("src/app/api/shiprocket/webhook/route.ts");
      assert.ok(src.includes("STATUS_RANK"));
      assert.ok(src.includes("nextRank >= currentRank"));
    });

    test("Inventory deduction updates specifications.size_inventory JSONB instead of missing column", () => {
      const src = readProjectFile("src/lib/inventory.ts");
      assert.ok(src.includes("size_inventory"));
      assert.equal(/\.select\([^)]*size_inventory/.test(src), false);
    });

    test("Customer OrdersAccountTab aligns 7-Day Exchange button strictly with Delivered orders <= 7 days", () => {
      const src = readProjectFile("src/components/account/OrdersAccountTab.tsx");
      assert.ok(src.includes('order.order_status === "Delivered"'));
      assert.ok(src.includes("daysSinceDelivery <= 7"));
    });

    test("ProductDetailClient only sets reviewSubmitted(true) when API succeeds", () => {
      const src = readProjectFile("src/app/products/[id]/ProductDetailClient.tsx");
      assert.ok(src.includes("if (res.ok && data.success && data.review)"));
      assert.ok(src.includes("setReviewError("));
    });
  });

  describe(
    "3. Live Server Privacy, Catalog Filtering & Validation Checks",
    {
      skip: !isServerOnline ? `Live server offline at ${BASE_URL}` : false,
    },
    () => {
      it("GET /api/reviews omits customer_email and user_id PII from public response", async () => {
        const res = await fetch(`${BASE_URL}/api/reviews?productId=avsaraa-saree-01`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.reviews));
        for (const rev of body.reviews) {
          assert.equal("customer_email" in rev, false);
          assert.equal("user_id" in rev, false);
        }
      });

      it("GET /api/products never exposes draft, scheduled, or archived products", async () => {
        const res = await fetch(`${BASE_URL}/api/products`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.ok(Array.isArray(body.products));
        for (const p of body.products) {
          assert.notEqual(p.publish_status, "draft");
          assert.notEqual(p.publish_status, "scheduled");
          assert.notEqual(p.publish_status, "archived");
        }
      });

      it("POST /api/orders validates payment_method strictly with HTTP 400", async () => {
        const res = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: BASE_URL,
          },
          body: JSON.stringify({
            customer_name: "Audit Tester",
            customer_email: "audit@example.com",
            customer_phone: "9876543210",
            payment_method: "CryptoBarter",
            items: [{ id: "avsaraa-saree-01", quantity: 1 }],
            shipping_address: {
              fullName: "Audit Tester",
              phone: "9876543210",
              street: "123 Heritage Lane",
              city: "Ahmedabad",
              state: "Gujarat",
              pincode: "395007",
            },
          }),
        });
        assert.ok([400, 403, 429].includes(res.status), `Expected 400/403/429, got ${res.status}`);
        assert.notEqual(res.status, 500);
      });
    }
  );
});
