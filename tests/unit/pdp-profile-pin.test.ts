import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_INDIAN_STATES,
  lookupExactCityByPinPrefix,
  lookupPincodeLocally,
  normalizeIndianStateName,
} from "../../src/lib/pincodeLookup.ts";
import { recommendSizeForProduct } from "../../src/lib/sizeRecommendation.ts";

describe("PIN Auto-Fill & Body Profile Size Recommendation Tests", () => {
  it("resolves city and state accurately from 6-digit Indian PIN codes", () => {
    const ahd = lookupPincodeLocally("380001");
    assert.ok(ahd);
    assert.equal(ahd.city, "Ahmedabad");
    assert.equal(ahd.state, "Gujarat");

    const mum = lookupPincodeLocally("400001");
    assert.ok(mum);
    assert.equal(mum.city, "Mumbai");
    assert.equal(mum.state, "Maharashtra");

    const del = lookupPincodeLocally("110001");
    assert.ok(del);
    assert.equal(del.city, "New Delhi");
    assert.equal(del.state, "Delhi");

    const blr = lookupPincodeLocally("560001");
    assert.ok(blr);
    assert.equal(blr.city, "Bengaluru");
    assert.equal(blr.state, "Karnataka");

    assert.equal(lookupPincodeLocally("012345"), null);
    assert.equal(lookupPincodeLocally("3800"), null);

    // Non-metro PINs must not falsely override India Post districts via 3-digit metro table
    assert.equal(lookupExactCityByPinPrefix("387001"), null);
    assert.equal(lookupExactCityByPinPrefix("380001")?.city, "Ahmedabad");

    // UT / state normalization aligns with Checkout state <select>
    assert.ok(ALL_INDIAN_STATES.includes(normalizeIndianStateName("Andaman & Nicobar Islands") as (typeof ALL_INDIAN_STATES)[number]));
    assert.ok(ALL_INDIAN_STATES.includes(normalizeIndianStateName("LADAKH") as (typeof ALL_INDIAN_STATES)[number]));
  });

  it("recommends garment size from customer body measurements and fit preference", () => {
    const regularFit = recommendSizeForProduct(
      {
        profile_name: "Mother",
        gender: "female",
        bust_chest_in: 36,
        waist_in: 30,
        hip_in: 40,
        fit_preference: "regular",
      },
      ["XS", "S", "M", "L", "XL"]
    );
    assert.equal(regularFit.matchedAvailableSize, "M");
    assert.ok(regularFit.summary.includes("Mother"));

    const relaxedFit = recommendSizeForProduct(
      {
        profile_name: "Sister",
        gender: "female",
        bust_chest_in: 36,
        waist_in: 30,
        hip_in: 40,
        fit_preference: "relaxed",
      },
      ["XS", "S", "M", "L", "XL"]
    );
    assert.equal(relaxedFit.matchedAvailableSize, "L");
  });

  it("estimates size from height and weight fallback and provides saree blouse guidance", () => {
    const heightWeightRec = recommendSizeForProduct(
      {
        profile_name: "My Profile",
        gender: "female",
        height_cm: 162,
        weight_kg: 68,
        fit_preference: "regular",
      },
      ["S", "M", "L", "XL"]
    );
    assert.equal(heightWeightRec.matchedAvailableSize, "L");

    const sareeRec = recommendSizeForProduct(
      {
        profile_name: "Wife",
        gender: "female",
        bust_chest_in: 34,
        waist_in: 28,
        fit_preference: "regular",
      },
      ["Free Size (5.5m + 0.8m Blouse)"],
      "Sarees"
    );
    assert.equal(sareeRec.confidence, "free_size");
    assert.ok(sareeRec.summary.includes("Size S"));
  });
});

describe("Live PIN Lookup & FREESHIP Coupon API", async () => {
  const baseUrl = process.env.TEST_BASE_URL || "";

  it("serves /api/pincode auto-fill and validates FREESHIP promo code", async (t) => {
    if (!baseUrl) {
      t.skip("TEST_BASE_URL not active for live HTTP check");
      return;
    }

    const pinRes = await fetch(`${baseUrl}/api/pincode?code=380001`);
    assert.equal(pinRes.status, 200);
    const pinData = await pinRes.json();
    assert.equal(pinData.valid, true);
    assert.equal(pinData.city, "Ahmedabad");
    assert.equal(pinData.state, "Gujarat");

    const coupRes = await fetch(`${baseUrl}/api/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({ code: "FREESHIP", subtotal: 2499 }),
    });
    assert.equal(coupRes.status, 200);
    const coupData = await coupRes.json();
    assert.equal(coupData.valid, true);
    assert.equal(coupData.coupon.discount_type, "free_shipping");
  });
});
