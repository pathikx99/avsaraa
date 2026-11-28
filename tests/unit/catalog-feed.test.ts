import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  expandCatalogRows,
  buildGoogleMetaXmlFeed,
  buildMetaGoogleCsvFeed,
  buildMarketplaceCsvExport,
} from "../../src/lib/catalogFeed.ts";
import type { Product } from "../../src/types/product.ts";

const sampleProducts: Product[] = [
  {
    id: "prod-banarasi-01",
    name: "Royal & Crimson Banarasi Silk Saree",
    category: "Sarees",
    price: 3800,
    mrp: 4500,
    image_url: "/images/saree-crimson.jpg",
    gallery_images: ["/images/saree-crimson-2.jpg"],
    description: "Handwoven Banarasi <silk> saree with gold zari.",
    sku: "AVS-SAR-001",
    fabric: "Pure Katan Silk",
    weave: "Kadwa Zari",
    hsn_code: "5007",
    country_of_origin: "India",
    occasion_tags: ["Bridal & Festive"],
    publish_status: "published",
    weight_grams: 680,
    highlights: [
      { title: "Weave", description: "Handloom Kadwa Zari" },
      { title: "Blouse", description: "Includes unstitched silk blouse piece" },
    ],
    color_variants: [
      {
        name: "Crimson",
        hex: "#8B1E24",
        image_url: "/images/saree-crimson.jpg",
        sizes: [
          { size: "Free Size", stock: 4, sku: "AVS-SAR-001-CRIM" },
        ],
      },
      {
        name: "Emerald",
        hex: "#114B3C",
        image_url: "/images/saree-emerald.jpg",
        sizes: [
          { size: "Free Size", stock: 0, sku: "AVS-SAR-001-EMER" },
        ],
      },
    ],
  },
  {
    id: "prod-kurta-02",
    name: "Ivory Chikankari Kurta",
    category: "Men's Wear",
    price: 2499,
    image_url: "https://cdn.avsaraa.in/kurta.jpg",
    description: "=HYPERLINK(\"http://bad.example\",\"Click\") Festive handloom kurta.",
    sku: "AVS-MEN-002",
    available_sizes: ["M", "L"],
    size_inventory: { M: 3, L: 0 },
    publish_status: "published",
  },
  {
    id: "prod-draft-03",
    name: "Unpublished Draft Dress",
    category: "Dresses",
    price: 1999,
    image_url: "/images/draft.jpg",
    publish_status: "draft",
  },
];

describe("Catalog Feed & Marketplace Exports", () => {
  it("excludes non-published products and expands color/size variants", () => {
    const rows = expandCatalogRows(sampleProducts, "https://avsaraa.in/");
    assert.equal(rows.length, 4);
    assert.ok(!rows.some((r) => r.item_group_id === "prod-draft-03"));

    const crimson = rows.find((r) => r.id === "AVS-SAR-001-CRIM");
    const emerald = rows.find((r) => r.id === "AVS-SAR-001-EMER");
    assert.ok(crimson);
    assert.ok(emerald);
    assert.equal(crimson.item_group_id, "AVS-SAR-001");
    assert.equal(crimson.availability, "in_stock");
    assert.equal(emerald.availability, "out_of_stock");
    assert.equal(crimson.price, "4500.00 INR");
    assert.equal(crimson.sale_price, "3800.00 INR");
    assert.equal(crimson.link, "https://avsaraa.in/products/prod-banarasi-01");
    assert.equal(crimson.image_link, "https://avsaraa.in/images/saree-crimson.jpg");
    assert.equal(crimson.gender, "female");
    assert.equal(crimson.custom_label_1, "5007");

    const kurtaM = rows.find((r) => r.item_group_id === "AVS-MEN-002" && r.size === "M");
    const kurtaL = rows.find((r) => r.item_group_id === "AVS-MEN-002" && r.size === "L");
    assert.ok(kurtaM && kurtaL);
    assert.equal(kurtaM.gender, "male");
    assert.equal(kurtaM.availability, "in_stock");
    assert.equal(kurtaL.availability, "out_of_stock");
    assert.equal(kurtaM.price, "2499.00 INR");
    assert.equal(kurtaM.sale_price, "");
  });

  it("generates valid RSS 2.0 XML for Meta & Google Merchant Center with XML escaping", () => {
    const xml = buildGoogleMetaXmlFeed(sampleProducts, "https://avsaraa.in");
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">'));
    assert.ok(xml.includes("<g:title>Royal &amp; Crimson Banarasi Silk Saree - Crimson</g:title>"));
    assert.ok(xml.includes("&lt;silk&gt;"));
    assert.ok(xml.includes("<g:sale_price>3800.00 INR</g:sale_price>"));
    assert.ok(!xml.includes("Unpublished Draft Dress"));
  });

  it("generates CSV feeds for Meta/Google and neutralizes spreadsheet formula prefixes", () => {
    const csv = buildMetaGoogleCsvFeed(sampleProducts, "https://avsaraa.in");
    const lines = csv.split("\n");
    assert.equal(lines.length, 5); // header + 4 expanded rows
    assert.ok(lines[0].startsWith("id,item_group_id,title,description,availability,condition,price,sale_price,"));
    assert.ok(csv.includes("'=HYPERLINK("));
  });

  it("generates channel-specific CSV bulk sheets for amazon, myntra, and ajio", () => {
    const amazonCsv = buildMarketplaceCsvExport(sampleProducts, "https://avsaraa.in", "amazon");
    assert.ok(amazonCsv.split("\n")[0].startsWith("item_sku,parent_sku,brand_name,item_name,"));
    assert.ok(amazonCsv.includes("7-Day Exchange Guarantee (No Refunds)"));

    const myntraCsv = buildMarketplaceCsvExport(sampleProducts, "https://avsaraa.in", "myntra");
    assert.ok(myntraCsv.split("\n")[0].startsWith("vendor_sku_code,style_id,brand,article_type,"));

    const ajioCsv = buildMarketplaceCsvExport(sampleProducts, "https://avsaraa.in", "ajio");
    assert.ok(ajioCsv.split("\n")[0].startsWith("seller_sku,style_code,brand_name,category,"));
  });
});

describe("Live Catalog Feed Endpoint (/api/catalog/feed)", async () => {
  let baseUrl = process.env.TEST_BASE_URL || "";
  if (!baseUrl) {
    try {
      const probe = await fetch("http://localhost:3008/api/health", { signal: AbortSignal.timeout(1000) });
      if (probe.ok || probe.status === 503) baseUrl = "http://localhost:3008";
    } catch {
      baseUrl = "";
    }
  }

  it("serves RSS XML, Meta/Google CSV, and Amazon/Myntra/Ajio CSV exports over HTTP", async (t) => {
    if (!baseUrl) {
      t.skip("TEST_BASE_URL not active for live HTTP feed probe");
      return;
    }

    const xmlRes = await fetch(`${baseUrl}/api/catalog/feed?format=xml`);
    assert.equal(xmlRes.status, 200);
    assert.ok((xmlRes.headers.get("content-type") || "").includes("application/xml"));
    const xmlBody = await xmlRes.text();
    assert.ok(xmlBody.includes('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">'));

    const csvRes = await fetch(`${baseUrl}/api/catalog/feed?format=csv`);
    assert.equal(csvRes.status, 200);
    assert.ok((csvRes.headers.get("content-type") || "").includes("text/csv"));
    const csvBody = await csvRes.text();
    assert.ok(csvBody.startsWith("id,item_group_id,title,description,"));

    for (const channel of ["amazon", "myntra", "ajio"] as const) {
      const res = await fetch(`${baseUrl}/api/catalog/feed?channel=${channel}`);
      assert.equal(res.status, 200);
      const disp = res.headers.get("content-disposition") || "";
      assert.ok(disp.includes(`avsaraa-${channel}-catalog.csv`));
    }
  });
});
