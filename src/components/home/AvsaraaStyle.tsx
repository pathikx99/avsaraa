"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { ShoppingBagIcon, CheckIcon, SparkleStarIcon } from "@/components/Icons";
import { Product } from "@/types/product";

interface StylePiece {
  id: string;
  name: string;
  category: "Dresses" | "Occasion Wear" | "Sarees" | "Co-ords";
  price: number;
  image_url: string;
  description: string;
  color: string;
  fabric: string;
  product_type: "top" | "bottom";
}

const TOPS: StylePiece[] = [
  {
    id: "style-top-1",
    name: "Peach Slub Cotton Embroidered Kurta",
    category: "Dresses",
    price: 999,
    image_url: "/images/product_kurta_under1299.jpg",
    description: "Breathable pure cotton slub daily wear kurta adorned with Kashmiri threadwork.",
    color: "Peach Blush",
    fabric: "Pure Slub Cotton",
    product_type: "top",
  },
  {
    id: "style-top-2",
    name: "Emerald Zari Handcrafted Choli",
    category: "Occasion Wear",
    price: 1299,
    image_url: "/images/royal_organza_saree.jpg",
    description: "Tailored jewel-toned silk crop blouse with antique zari borders.",
    color: "Emerald Green",
    fabric: "Raw Silk Blend",
    product_type: "top",
  },
  {
    id: "style-top-3",
    name: "Ivory Chikankari Sleeveless Kurti",
    category: "Dresses",
    price: 899,
    image_url: "/images/product_kurti_under1299.jpg",
    description: "Fine Lucknowi shadow threadwork on semi-sheer breathable modal cotton.",
    color: "Royal Ivory",
    fabric: "Modal Muslin",
    product_type: "top",
  },
];

const BOTTOMS: StylePiece[] = [
  {
    id: "style-bottom-1",
    name: "Royal Ivory Zari Woven Chanderi Dupatta",
    category: "Occasion Wear",
    price: 899,
    image_url: "/images/product_dupatta_under1299.jpg",
    description: "Classic handwoven Chanderi stole with gold zari booti weaving and tassel hem.",
    color: "Ivory Gold",
    fabric: "Chanderi Silk",
    product_type: "bottom",
  },
  {
    id: "style-bottom-2",
    name: "Ivory Gold Tissue Flared Sharara",
    category: "Dresses",
    price: 1299,
    image_url: "/images/product_suit_under1299.jpg",
    description: "Multi-panel flowing silhouette crafted from luminous woven tissue.",
    color: "Gold Shimmer",
    fabric: "Tissue Brocade",
    product_type: "bottom",
  },
  {
    id: "style-bottom-3",
    name: "Rose Quartz Banarasi Woven Skirt",
    category: "Occasion Wear",
    price: 1299,
    image_url: "/images/banarasi_silk_saree.jpg",
    description: "Lustrous pleated skirt with heritage floral jaal and gold border.",
    color: "Rose Quartz",
    fabric: "Katan Silk",
    product_type: "bottom",
  },
];

export default function AvsaraaStyle() {
  const { addToCart } = useCart();

  const [selectedTop, setSelectedTop] = useState<StylePiece>(TOPS[0]);
  const [selectedBottom, setSelectedBottom] = useState<StylePiece>(BOTTOMS[0]);
  const [isAdded, setIsAdded] = useState(false);

  // Set Calculations
  const individualTotal = selectedTop.price + selectedBottom.price;
  const setSavings = 200; // Atelier Set Savings
  const setPrice = individualTotal - setSavings;

  const handleAddSetToBag = () => {
    // Add top to cart
    const topProduct: Product = {
      id: selectedTop.id,
      name: `${selectedTop.name} (AVSARAA Style Set)`,
      category: selectedTop.category,
      price: selectedTop.price - 100, // distribute 200 savings evenly
      image_url: selectedTop.image_url,
      description: selectedTop.description,
      product_type: "top",
    };

    // Add bottom to cart
    const bottomProduct: Product = {
      id: selectedBottom.id,
      name: `${selectedBottom.name} (AVSARAA Style Set)`,
      category: selectedBottom.category,
      price: selectedBottom.price - 100,
      image_url: selectedBottom.image_url,
      description: selectedBottom.description,
      product_type: "bottom",
    };

    const addedTop = addToCart(topProduct, 1);
    if (addedTop) {
      addToCart(bottomProduct, 1);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2400);
    }
  };

  return (
    <section
      id="avsaraa-style"
      style={{
        backgroundColor: "#261B13",
        color: "#FAF7F2",
        padding: "80px 20px",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid #3E2D22",
        borderBottom: "1px solid #3E2D22",
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226, 190, 114, 0.12) 0%, rgba(38, 27, 19, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "20px",
              backgroundColor: "rgba(226, 190, 114, 0.15)",
              border: "1px solid rgba(226, 190, 114, 0.35)",
              color: "#E2BE72",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <SparkleStarIcon size={14} color="#E2BE72" />
            <span>AVSARAA STYLE · COMBINATIONS STUDIO</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              margin: "4px 0 10px",
              color: "#FAF7F2",
            }}
          >
            Curate Your Silhouette
          </h2>

          <p
            style={{
              color: "#C5A880",
              maxWidth: "580px",
              margin: "0 auto",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Pair complementary handcrafted tops and artisanal bottoms or drapes. Instant set pricing
            with exclusive atelier pairing savings.
          </p>
        </div>

        {/* Combinations Studio Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "center",
          }}
        >
          {/* Left: Interactive Visual Studio Preview */}
          <div
            style={{
              backgroundColor: "#1F150F",
              border: "1px solid rgba(226, 190, 114, 0.2)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#E2BE72", fontWeight: 600 }}>
                Live Set Preview
              </span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(40, 167, 69, 0.15)",
                  color: "#4ade80",
                  fontWeight: 600,
                  border: "1px solid rgba(40, 167, 69, 0.3)",
                }}
              >
                Save ₹200 as Set
              </span>
            </div>

            {/* Side-by-side piece viewer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              {/* Selected Top */}
              <div
                style={{
                  backgroundColor: "#261B13",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(226, 190, 114, 0.25)",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "230px" }}>
                  <Image
                    src={resolveProductImage(selectedTop.image_url)}
                    alt={selectedTop.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 250px"
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      backgroundColor: "rgba(38, 27, 19, 0.85)",
                      backdropFilter: "blur(4px)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#E2BE72",
                      textTransform: "uppercase",
                    }}
                  >
                    Top Piece
                  </div>
                </div>

                <div style={{ padding: "12px" }}>
                  <h4 style={{ fontSize: "13px", margin: 0, fontWeight: 600, color: "#FAF7F2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedTop.name}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#C5A880", fontWeight: 700 }}>
                    {formatINR(selectedTop.price)}
                  </p>
                </div>
              </div>

              {/* Selected Bottom */}
              <div
                style={{
                  backgroundColor: "#261B13",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(226, 190, 114, 0.25)",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "230px" }}>
                  <Image
                    src={resolveProductImage(selectedBottom.image_url)}
                    alt={selectedBottom.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 250px"
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      backgroundColor: "rgba(38, 27, 19, 0.85)",
                      backdropFilter: "blur(4px)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#E2BE72",
                      textTransform: "uppercase",
                    }}
                  >
                    Bottom / Drape
                  </div>
                </div>

                <div style={{ padding: "12px" }}>
                  <h4 style={{ fontSize: "13px", margin: 0, fontWeight: 600, color: "#FAF7F2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedBottom.name}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#C5A880", fontWeight: 700 }}>
                    {formatINR(selectedBottom.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Set Pricing & CTA */}
            <div
              style={{
                backgroundColor: "#261B13",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(226, 190, 114, 0.15)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#FAF7F2" }}>
                    {formatINR(setPrice)}
                  </span>
                  <span style={{ fontSize: "13px", color: "#866951", textDecoration: "line-through" }}>
                    {formatINR(individualTotal)}
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600 }}>
                  Includes 2 Harmonious Pieces + ₹200 Atelier Set Savings
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddSetToBag}
                style={{
                  padding: "12px 24px",
                  borderRadius: "24px",
                  backgroundColor: "#E2BE72",
                  color: "#261B13",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 16px rgba(226, 190, 114, 0.3)",
                }}
              >
                {isAdded ? (
                  <>
                    <CheckIcon size={16} color="#261B13" />
                    <span>Added Complete Set!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBagIcon size={16} color="#261B13" />
                    <span>Add Complete Set to Bag</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Piece Selector Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Step 1: Choose Top */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#E2BE72",
                    color: "#261B13",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  1
                </span>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#FAF7F2", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Select Top / Kurta / Choli
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {TOPS.map((top) => {
                  const isSelected = selectedTop.id === top.id;
                  return (
                    <div
                      key={top.id}
                      onClick={() => setSelectedTop(top)}
                      style={{
                        backgroundColor: isSelected ? "rgba(226, 190, 114, 0.15)" : "#1F150F",
                        border: isSelected
                          ? "2px solid #E2BE72"
                          : "1px solid rgba(226, 190, 114, 0.15)",
                        borderRadius: "12px",
                        padding: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "90px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          marginBottom: "8px",
                        }}
                      >
                        <Image
                          src={resolveProductImage(top.image_url)}
                          alt={top.name}
                          fill
                          sizes="100px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#FAF7F2",
                          margin: "0 0 2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {top.name}
                      </p>
                      <span style={{ fontSize: "11px", color: "#E2BE72", fontWeight: 700 }}>
                        {formatINR(top.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Bottom */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#E2BE72",
                    color: "#261B13",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  2
                </span>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#FAF7F2", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Select Bottom / Dupatta / Skirt
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {BOTTOMS.map((bottom) => {
                  const isSelected = selectedBottom.id === bottom.id;
                  return (
                    <div
                      key={bottom.id}
                      onClick={() => setSelectedBottom(bottom)}
                      style={{
                        backgroundColor: isSelected ? "rgba(226, 190, 114, 0.15)" : "#1F150F",
                        border: isSelected
                          ? "2px solid #E2BE72"
                          : "1px solid rgba(226, 190, 114, 0.15)",
                        borderRadius: "12px",
                        padding: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "90px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          marginBottom: "8px",
                        }}
                      >
                        <Image
                          src={resolveProductImage(bottom.image_url)}
                          alt={bottom.name}
                          fill
                          sizes="100px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#FAF7F2",
                          margin: "0 0 2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {bottom.name}
                      </p>
                      <span style={{ fontSize: "11px", color: "#E2BE72", fontWeight: 700 }}>
                        {formatINR(bottom.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editorial Footer CTA */}
            <div style={{ paddingTop: "8px" }}>
              <Link
                href="/collection"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#E2BE72",
                  textDecoration: "underline",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                <span>Explore All Curated Combinations in Atelier Catalog →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

