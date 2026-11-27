import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getCartItemKey, isCartItemMatch, normalizeCartKey, parseCartItemDisplay, type CartItem } from "../../src/lib/cartUtils.ts";
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

  // Two variants of the same product (same base id, different variant names)
  const variantRed: CartItem = {
    product: {
      ...mockProduct1,
      name: "Crimson Banarasi Silk Saree · Free Size · Crimson Red",
    },
    quantity: 1,
  };

  const variantEmerald: CartItem = {
    product: {
      ...mockProduct1,
      name: "Crimson Banarasi Silk Saree · Free Size · Royal Emerald",
    },
    quantity: 2,
  };

  const cartItem1: CartItem = { product: mockProduct1, quantity: 2 };
  const cartItem2: CartItem = { product: mockProduct2, quantity: 1 };

  describe("1. Flexible Cart Item Key Resolution & Normalization", () => {
    it("generates canonical key: ${id}__${name}", () => {
      const canonicalKey = getCartItemKey(mockProduct1);
      assert.equal(canonicalKey, "prod-101__Crimson Banarasi Silk Saree");
    });

    it("normalizes indexed keys by removing trailing array index suffix", () => {
      assert.equal(normalizeCartKey("prod-101__Crimson Banarasi Silk Saree__0"), "prod-101__Crimson Banarasi Silk Saree");
      assert.equal(normalizeCartKey("prod-101__Crimson Banarasi Silk Saree__12"), "prod-101__Crimson Banarasi Silk Saree");
      assert.equal(normalizeCartKey("prod-101__Crimson Banarasi Silk Saree"), "prod-101__Crimson Banarasi Silk Saree");
      assert.equal(normalizeCartKey("prod-101"), "prod-101");
    });

    it("matches item by bare product ID when no variant name is present in identifier", () => {
      assert.equal(isCartItemMatch(cartItem1, "prod-101"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101"), false);
      assert.equal(isCartItemMatch(cartItem2, "prod-202"), true);
    });

    it("matches item by canonical key", () => {
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101__Crimson Banarasi Silk Saree"), false);
    });

    it("matches item by UI drawer key with array index appended", () => {
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree__0"), true);
      assert.equal(isCartItemMatch(cartItem1, "prod-101__Crimson Banarasi Silk Saree__4"), true);
      assert.equal(isCartItemMatch(cartItem2, "prod-101__Crimson Banarasi Silk Saree__0"), false);
    });

    it("strictly isolates variants sharing the same product ID", () => {
      const keyRed = getCartItemKey(variantRed.product);
      const keyEmerald = getCartItemKey(variantEmerald.product);

      // Red key matches ONLY Red variant
      assert.equal(isCartItemMatch(variantRed, keyRed), true);
      assert.equal(isCartItemMatch(variantEmerald, keyRed), false);

      // Emerald key matches ONLY Emerald variant
      assert.equal(isCartItemMatch(variantEmerald, keyEmerald), true);
      assert.equal(isCartItemMatch(variantRed, keyEmerald), false);

      // Indexed keys match only their respective variant
      assert.equal(isCartItemMatch(variantRed, `${keyRed}__0`), true);
      assert.equal(isCartItemMatch(variantEmerald, `${keyRed}__0`), false);
    });
  });

  describe("2. Multi-Item & Variant Cart Isolation on Removal", () => {
    it("removing one variant leaves the other variant of the same product intact in cart", () => {
      let cart = [variantRed, variantEmerald];

      // Remove Red variant by canonical key
      const keyRed = getCartItemKey(variantRed.product);
      cart = cart.filter((item, idx) => !isCartItemMatch(item, keyRed, idx));

      // Cart MUST still have Emerald variant
      assert.equal(cart.length, 1);
      assert.equal(cart[0].product.name, variantEmerald.product.name);
      assert.equal(cart[0].quantity, 2);
    });

    it("removing by explicit array index removes ONLY the targeted item", () => {
      let cart = [variantRed, variantEmerald];

      // Remove item at index 0 (variantRed)
      const targetIndex = 0;
      cart = cart.filter((_, idx) => idx !== targetIndex);

      assert.equal(cart.length, 1);
      assert.equal(cart[0].product.name, variantEmerald.product.name);
    });

    it("removing one product from a multi-product cart preserves all other products", () => {
      let cart = [cartItem1, cartItem2];

      // Remove cartItem1
      const key1 = getCartItemKey(cartItem1.product);
      cart = cart.filter((item, idx) => !isCartItemMatch(item, key1, idx, 0));

      assert.equal(cart.length, 1);
      assert.equal(cart[0].product.id, "prod-202");
      assert.equal(cart[0].quantity, 1);
    });
  });

  describe("3. Cart Quantity Mutation & Stock Capping Logic", () => {
    let items: CartItem[];

    it("increments quantity correctly when within stock bounds", () => {
      items = [{ product: mockProduct1, quantity: 2 }];

      const updateQty = (id: string, newQty: number, idx?: number) => {
        items = items.map((item, itemIdx) => {
          if (!isCartItemMatch(item, id, itemIdx, idx)) return item;
          const maxStock = item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
          return { ...item, quantity: Math.min(maxStock, newQty) };
        });
      };

      // + button clicked with canonical key and index
      updateQty(getCartItemKey(mockProduct1), 3, 0);
      assert.equal(items[0].quantity, 3);

      // + button clicked with composite key containing index
      updateQty("prod-101__Crimson Banarasi Silk Saree__0", 4, 0);
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

      updateQty(getCartItemKey(mockProduct1), 10);
      assert.equal(items[0].quantity, 5); // Capped at stock_count = 5
    });

    it("decrements quantity correctly without affecting other items", () => {
      items = [variantRed, variantEmerald];

      const updateQty = (key: string, newQty: number, targetIdx?: number) => {
        items = items.map((item, idx) => {
          const isMatch = typeof targetIdx === "number" ? idx === targetIdx : isCartItemMatch(item, key, idx);
          if (!isMatch) return item;
          return { ...item, quantity: newQty };
        });
      };

      // Decrement Emerald quantity from 2 to 1 (at index 1)
      updateQty(getCartItemKey(variantEmerald.product), 1, 1);
      assert.equal(items[1].quantity, 1);
      // Red quantity MUST remain untouched (1)
      assert.equal(items[0].quantity, 1);
    });

    it("automatically removes item when quantity reaches 0", () => {
      items = [
        { product: mockProduct1, quantity: 1 },
        { product: mockProduct2, quantity: 2 },
      ];

      const removeItem = (id: string, targetIdx?: number) => {
        items = items.filter((item, idx) => {
          if (typeof targetIdx === "number") return idx !== targetIdx;
          return !isCartItemMatch(item, id, idx);
        });
      };

      const updateQty = (id: string, newQty: number, targetIdx?: number) => {
        if (newQty <= 0) {
          removeItem(id, targetIdx);
          return;
        }
        items = items.map((item, idx) => {
          if (typeof targetIdx === "number" ? idx !== targetIdx : !isCartItemMatch(item, id, idx)) return item;
          return { ...item, quantity: newQty };
        });
      };

      // Decrement quantity of first item 1 -> 0
      updateQty(getCartItemKey(mockProduct1), 0, 0);
      assert.equal(items.length, 1);
      assert.equal(items[0].product.id, "prod-202");
    });
  });

  describe("4. Cart Variant Display Parser", () => {
    it("extracts title, size, and color from composite product names", () => {
      const parsed = parseCartItemDisplay(variantRed.product);
      assert.equal(parsed.title, "Crimson Banarasi Silk Saree");
      assert.equal(parsed.size, "Free Size");
      assert.equal(parsed.color, "Crimson Red");
      assert.equal(parsed.isPreOrder, false);
    });

    it("handles pre-order items and plain titles without delimiters", () => {
      const preOrderParsed = parseCartItemDisplay({
        ...mockProduct1,
        name: "Katan Silk · Pre-Order · M · Emerald",
      });
      assert.equal(preOrderParsed.title, "Katan Silk");
      assert.equal(preOrderParsed.isPreOrder, true);
      assert.equal(preOrderParsed.size, "M");
      assert.equal(preOrderParsed.color, "Emerald");

      const plainParsed = parseCartItemDisplay(mockProduct1);
      assert.equal(plainParsed.title, "Crimson Banarasi Silk Saree");
      assert.equal(plainParsed.size, null);
      assert.equal(plainParsed.color, null);
    });
  });
});
