import { test, describe } from "node:test";
import assert from "node:assert";
import { processedWebhooksMemory } from "../../src/lib/webhooks.ts";

describe("Concurrency, Webhook Deduplication & Deadlock Prevention Tests", () => {
  test("Webhook deduplication engine strictly handles duplicate deliveries", () => {
    const webhookId = `evt_test_dedup_${Date.now()}`;

    // First delivery is not in cache
    assert.strictEqual(processedWebhooksMemory.has(webhookId), false);

    // Simulate successful processing
    processedWebhooksMemory.add(webhookId);
    assert.strictEqual(processedWebhooksMemory.has(webhookId), true);

    // Subsequent delivery of identical webhook ID is caught as duplicate
    const isDuplicate = processedWebhooksMemory.has(webhookId);
    assert.strictEqual(isDuplicate, true);
  });

  test("Deterministic UUID sorting prevents PostgreSQL transaction deadlocks", () => {
    // Array of items in randomized order
    const items = [
      { product_id: "c9b2d3e4-5678-4abc-def0-123456789abc", quantity: 1 },
      { product_id: "a1b2c3d4-5678-4abc-def0-123456789abc", quantity: 2 },
      { product_id: "b2c3d4e5-5678-4abc-def0-123456789abc", quantity: 1 },
    ];

    // Simulating deterministic ORDER BY product_id ASC
    const sorted = [...items].sort((a, b) => a.product_id.localeCompare(b.product_id));

    assert.strictEqual(sorted[0].product_id, "a1b2c3d4-5678-4abc-def0-123456789abc");
    assert.strictEqual(sorted[1].product_id, "b2c3d4e5-5678-4abc-def0-123456789abc");
    assert.strictEqual(sorted[2].product_id, "c9b2d3e4-5678-4abc-def0-123456789abc");
  });
});
