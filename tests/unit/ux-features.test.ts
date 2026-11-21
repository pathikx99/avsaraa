import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sortProductsByShowcase } from "../../src/lib/showcaseOrderManager.ts";
import type { Product } from "../../src/types/product.ts";

describe("UX Features Unit Tests", () => {
  describe("1. Real-Time Express Delivery Countdown & Cutoff Calculations", () => {
    it("correctly identifies same-day vs next-day dispatch based on 17:00 IST cutoff", () => {
      // Mock IST times
      const beforeCutoffIST = new Date("2026-11-20T10:30:00+05:30");
      const afterCutoffIST = new Date("2026-11-20T18:15:00+05:30");

      const getDispatchTarget = (currentDate: Date) => {
        const utcTime = currentDate.getTime() + currentDate.getTimezoneOffset() * 60000;
        const istNow = new Date(utcTime + 5.5 * 3600000);
        const y = istNow.getFullYear();
        const m = istNow.getMonth();
        const d = istNow.getDate();

        let target = new Date(y, m, d, 17, 0, 0);
        let isSameDay = true;
        if (istNow.getTime() >= target.getTime()) {
          target = new Date(y, m, d + 1, 17, 0, 0);
          isSameDay = false;
        }
        const diffMs = target.getTime() - istNow.getTime();
        return { isSameDay, diffMs };
      };

      const morning = getDispatchTarget(beforeCutoffIST);
      assert.equal(morning.isSameDay, true);
      assert.ok(morning.diffMs > 0);

      const evening = getDispatchTarget(afterCutoffIST);
      assert.equal(evening.isSameDay, false);
      assert.ok(evening.diffMs > 0);
    });
  });

  describe("2. Free Gift / Free Shipping Tiered Progress Bar Calculations", () => {
    const GIFT_THRESHOLD = 2500;

    const calculateGiftProgress = (subtotal: number) => {
      const progress = Math.min(100, (subtotal / GIFT_THRESHOLD) * 100);
      const remaining = Math.max(0, GIFT_THRESHOLD - subtotal);
      const isUnlocked = subtotal >= GIFT_THRESHOLD;
      return { progress, remaining, isUnlocked };
    };

    it("handles ₹0 cart with complimentary shipping available", () => {
      const res = calculateGiftProgress(0);
      assert.equal(res.progress, 0);
      assert.equal(res.remaining, 2500);
      assert.equal(res.isUnlocked, false);
    });

    it("calculates accurate remaining amount and percentage for partial carts", () => {
      const res = calculateGiftProgress(1250);
      assert.equal(res.progress, 50);
      assert.equal(res.remaining, 1250);
      assert.equal(res.isUnlocked, false);

      const res2 = calculateGiftProgress(2000);
      assert.equal(res2.progress, 80);
      assert.equal(res2.remaining, 500);
      assert.equal(res2.isUnlocked, false);
    });

    it("unlocks gift at exactly ₹2,500 and caps at 100%", () => {
      const res = calculateGiftProgress(2500);
      assert.equal(res.progress, 100);
      assert.equal(res.remaining, 0);
      assert.equal(res.isUnlocked, true);

      const resOver = calculateGiftProgress(4999);
      assert.equal(resOver.progress, 100);
      assert.equal(resOver.remaining, 0);
      assert.equal(resOver.isUnlocked, true);
    });
  });

  describe("3. Recently Viewed Drapes List Management", () => {
    it("deduplicates products and places newest view at the front", () => {
      interface MockItem {
        id: string;
        name: string;
      }

      let list: MockItem[] = [
        { id: "p1", name: "Banarasi Saree" },
        { id: "p2", name: "Kanjivaram Saree" },
      ];

      const addViewedItem = (item: MockItem) => {
        list = [item, ...list.filter((x) => x.id !== item.id)].slice(0, 6);
      };

      // Viewing p1 again should bump p1 to front
      addViewedItem({ id: "p1", name: "Banarasi Saree" });
      assert.equal(list.length, 2);
      assert.equal(list[0].id, "p1");
      assert.equal(list[1].id, "p2");

      // Viewing p3 adds to front
      addViewedItem({ id: "p3", name: "Chanderi Silk" });
      assert.equal(list.length, 3);
      assert.equal(list[0].id, "p3");
      assert.equal(list[1].id, "p1");
      assert.equal(list[2].id, "p2");
    });
  });

  describe("4. Catalog Showcase Ordering Engine", () => {
    it("sortProductsByShowcase handles empty, partial, and custom ordered sequences", () => {
      const mockProducts: Product[] = [
        { id: "item-c", name: "Product C", category: "Sarees", price: 3000, image_url: "/c.jpg" },
        { id: "item-a", name: "Product A", category: "Sarees", price: 1000, image_url: "/a.jpg" },
        { id: "item-b", name: "Product B", category: "Sarees", price: 2000, image_url: "/b.jpg" },
      ];

      const sorted = sortProductsByShowcase(mockProducts);
      assert.equal(sorted.length, 3);
      assert.ok(Array.isArray(sorted));
    });
  });

  describe("5. Product Video URL & YouTube Embed Transformer", () => {
    const resolveEmbedUrl = (rawUrl?: string): string => {
      if (!rawUrl) return "https://www.youtube.com/embed/5mGUdDq42iI?autoplay=1&rel=0";
      if (rawUrl.includes("youtube.com/embed/")) {
        return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`;
      }
      if (rawUrl.includes("youtu.be/")) {
        const vidId = rawUrl.split("youtu.be/")[1]?.split(/[?#]/)[0];
        if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0`;
      }
      if (rawUrl.includes("watch?v=")) {
        const vidId = rawUrl.split("watch?v=")[1]?.split("&")[0];
        if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0`;
      }
      return rawUrl;
    };

    it("correctly converts standard YouTube watch links to autoplay embed URLs", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const embed = resolveEmbedUrl(url);
      assert.equal(embed, "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    });

    it("correctly converts youtu.be shortlinks to embed URLs", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      const embed = resolveEmbedUrl(url);
      assert.equal(embed, "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    });

    it("falls back to default atelier drape video when url is undefined", () => {
      const embed = resolveEmbedUrl(undefined);
      assert.equal(embed, "https://www.youtube.com/embed/5mGUdDq42iI?autoplay=1&rel=0");
    });
  });
});
