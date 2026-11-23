import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getCartItemKey, isCartItemMatch, type CartItem } from "../../src/lib/cartUtils.ts";
import type { Product } from "../../src/types/product.ts";

describe("Cart Actions, Matching & Drawer Operations Unit Tests", () => {
  const mockProduct1: Product = {
    id: "prod-101",
    name: "Crimson Banarasi Silk Saree",
    description: "Handcrafted pure silk saree.",
    price: 4999,
    mrp: 6999,
    category: "Sarees",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    stock_count: 5,
  };

  const mockProduct2: Product = {
    id: "prod-202",
    name: "Royal Blue Kanjivaram Saree",
    description: "Traditional South Indian drape.",
    price: 7999,
    mrp: 9999,
    category: "Sarees",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    stock_count: 10,
  };

  const cartItem1: CartItem = { product: mockProduct1, quantity: 2 };
  const cartItem2: CartItem = { product: mockProduct2, quantity: 1 };

  describe("1. Flexible Cart Item Key Resolution", () => {
    it("generates canonical key: ${id}__${name}", () => {
      const canonicalKey = getCartItemKey(mockProduct1);
      assert.equal(canonicalKey, "prod-101__Crimson Banarasi Silk Saree");
    });

    it("matches item by bare product ID", () => {
      assert.equal(isCartItemMatch(cartItem1, "prod-101"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101"), false);
      assert.equal(isCartItemMatch(cartItem2, "prod-202"), true);
    });

    it("matches item by canonical key", () => {
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101__Crimson Banarasi Silk Saree"), false);
    });

    it("matches item by UI drawer key with array index appended", () => {
      // CartDrawer uses `${item.product.id}__${item.product.name}__${idx}`
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree__0"), true);
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree__4"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101__Crimson Banarasi Silk Saree__0"), false);
    });

    it("rejects partial non-delimited substring collisions", () => {
      // e.g. "prod-101999" should NOT match "prod-101"
      assert.equal(isCartItemMatch(cartItem1, "prod-101999"), false);
      assert.equal(isCartItemMatch(cartItem1, "prod-10"), false);
      assert.equal(isCartItemMatch(cartItem1, ""), false);
    });
  });

  describe("2. Cart Quantity Mutation & Stock Capping Logic", () => {
    let items: CartItem[];

    it("increments quantity correctly when within stock bounds", () => {
      items = [{ product: mockProduct1, quantity: 2 }];

      const updateQty = (id: string, newQty: number) => {
        items = items.map((item) => {
          if (!isCartItemMatch(item, id)) return item;
          const maxStock = item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
          return { ...item, quantity: Math.min(maxStock, newQty) };
        });
      };

      // + button clicked with product.id
      updateQty("prod-101", 3);
      assert.equal(items[0].quantity, 3);

      // + button clicked with composite key containing index
      updateQty("prod-101__Crimson Banarasi Silk Saree__0", 4);
      assert.equal(items[0].quantity, 4);
    });

    it("strictly caps quantity at product stock_count (5)", () => {
      items = [{ product: mockProduct1, quantity: 4 }];

      const updateQty = (id: string, newQty: number) => {
        items = items.map((item) => {
          if (!isCartItemMatch(item, id)) return item;
          const maxStock = item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
          return { ...item, quantity: Math.min(maxStock, newQty) };
        });
      };

      updateQty("prod-101", 10);
      assert.equal(items[0].quantity, 5); // Capped at stock_count = 5
    });

    it("decrements quantity correctly", () => {
      items = [{ product: mockProduct1, quantity: 3 }];

      const updateQty = (id: string, newQty: number) => {
        items = items.map((item) => {
          if (!isCartItemMatch(item, id)) return item;
          const maxStock = item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
          return { ...item, quantity: Math.min(maxStock, newQty) };
        });
      };

      // - button clicked
      updateQty("prod-101", 2);
      assert.equal(items[0].quantity, 2);
    });

    it("automatically removes item when quantity reaches 0", () => {
      items = [
        { product: mockProduct1, quantity: 1 },
        { product: mockProduct2, quantity: 2 },
      ];

      const removeItem = (id: string) => {
        items = items.filter((item) => !isCartItemMatch(item, id));
      };

      const updateQty = (id: string, newQty: number) => {
        if (newQty <= 0) {
          removeItem(id);
          return;
        }
        items = items.map((item) => {
          if (!isCartItemMatch(item, id)) return item;
          return { ...item, quantity: newQty };
        });
      };

      // Decrement quantity 1 -> 0
      updateQty("prod-101", 0);
      assert.equal(items.length, 1);
      assert.equal(items[0].product.id, "prod-202");
    });

    it("removes item directly via Remove button using product.id or indexed key", () => {
      items = [
        { product: mockProduct1, quantity: 1 },
        { product: mockProduct2, quantity: 2 },
      ];

      const removeItem = (id: string) => {
        items = items.filter((item) => !isCartItemMatch(item, id));
      };

      // Remove mockProduct2 using indexed key
      removeItem("prod-202__Royal Blue Kanjivaram Saree__1");
      assert.equal(items.length, 1);
      assert.equal(items[0].product.id, "prod-101");

      // Remove mockProduct1 using direct product.id
      removeItem("prod-101");
      assert.equal(items.length, 0);
    });
  });
});
