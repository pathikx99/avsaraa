import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatOrderNumber,
  formatProductSku,
  formatInvoiceNumber,
  extractTrailingSequence,
  generateSequentialOrderNumber,
  generateSequentialProductSkus,
} from "../../src/lib/idGenerator.ts";

describe("Systematic, Sequential & Chronological ID Generator Tests", () => {
  const fixedDate = new Date("2026-11-27T10:30:00+05:30");

  it("Formats order numbers sequentially with IST YYYYMMDD date and 5-digit 00001 padding", () => {
    assert.equal(formatOrderNumber(1, fixedDate), "AVS-20261127-00001");
    assert.equal(formatOrderNumber(42, fixedDate), "AVS-20261127-00042");
    assert.equal(formatOrderNumber(12345, fixedDate), "AVS-20261127-12345");
    assert.equal(formatOrderNumber(100005, fixedDate), "AVS-20261127-100005");
  });

  it("Formats product SKUs systematically with category code, YYMM, and sequential index", () => {
    assert.equal(formatProductSku("Sarees", 1, fixedDate), "AVS-SAR-2611-0001");
    assert.equal(formatProductSku("Dresses", 2, fixedDate), "AVS-DRS-2611-0002");
    assert.equal(formatProductSku("Co-ords", 3, fixedDate), "AVS-CRD-2611-0003");
    assert.equal(formatProductSku("Men's Wear", 4, fixedDate), "AVS-MEN-2611-0004");
    assert.equal(formatProductSku("New Arrivals", 5, fixedDate), "AVS-NEW-2611-0005");
    assert.equal(formatProductSku("Occasion Wear", 6, fixedDate), "AVS-OCC-2611-0006");
  });

  it("Derives sequential tax invoice numbers cleanly from sequential order numbers", () => {
    assert.equal(formatInvoiceNumber("AVS-20261127-00001", "2026-11-27T05:00:00Z"), "INV-2026-00001");
    assert.equal(formatInvoiceNumber("AVS-20261127-00128", "2026-11-27T05:00:00Z"), "INV-2026-00128");
  });

  it("Extracts trailing numeric sequences cleanly", () => {
    assert.equal(extractTrailingSequence("AVS-20261127-00001"), 1);
    assert.equal(extractTrailingSequence("AVS-SAR-2611-0042"), 42);
    assert.equal(extractTrailingSequence("INVALID"), 0);
  });

  it("Generates sequential order number starting at 00001 when DB table is empty", async () => {
    const mockClient = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({ data: [], count: 0, error: null }),
          }),
        }),
      }),
    };
    const next = await generateSequentialOrderNumber(mockClient, fixedDate);
    assert.equal(next, "AVS-20261127-00001");
  });

  it("Advances sequential order number past highest existing order sequence", async () => {
    const mockClient = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({
              data: [{ order_number: "AVS-20261126-00007" }, { order_number: "AVS-20261125-00002" }],
              count: 4,
              error: null,
            }),
          }),
        }),
      }),
    };
    const next = await generateSequentialOrderNumber(mockClient, fixedDate);
    assert.equal(next, "AVS-20261127-00008");
  });

  it("Generates consecutive sequential SKUs across bulk product imports while respecting explicit overrides", async () => {
    const mockClient = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: async () => ({
              data: [{ specifications: { sku: "AVS-SAR-2611-0002" } }],
              count: 2,
              error: null,
            }),
          }),
        }),
      }),
    };

    const skus = await generateSequentialProductSkus(
      mockClient,
      [
        { category: "Sarees" },
        { category: "Dresses", explicitSku: "CUSTOM-DRS-99" },
        { category: "Men's Wear" },
      ],
      fixedDate
    );

    assert.deepEqual(skus, [
      "AVS-SAR-2611-0003",
      "CUSTOM-DRS-99",
      "AVS-MEN-2611-0004",
    ]);
  });
});
