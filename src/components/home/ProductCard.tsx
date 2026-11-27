"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { HeartIcon, EyeIcon } from "@/components/Icons";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  badge?: string;
  onSelect?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  aspectRatio?: "portrait" | "standard";
}

const DEFAULT_IMAGE = "/images/saree_model_hero.jpg";

export default function ProductCard({
  product,
  badge,
  onSelect,
  onQuickView,
  aspectRatio = "portrait",
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const activeColorVariant = selectedColor
    ? product.color_variants?.find((v) => v.name === selectedColor)
    : null;
  const activeImage =
    activeColorVariant?.primary_image ||
    activeColorVariant?.image_url ||
    product.image_url;
  const imgSrc = imgError ? DEFAULT_IMAGE : (resolveProductImage(activeImage) || DEFAULT_IMAGE);

  const isFavorited = isInWishlist(product.id);
  const colorParam = selectedColor ? `?color=${encodeURIComponent(selectedColor)}` : "";
  const productHref = `/products/${product.id}${colorParam}`;

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : product.discount_percent || 0;

  const isOutOfStock = product.stock_count === 0;

  return (
    <article
      className="luxury-hover-card product-card-container product-card-shimmer"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(230, 218, 207, 0.85)",
        boxShadow: "0 4px 20px -4px rgba(38, 27, 19, 0.06), 0 1px 3px rgba(38, 27, 19, 0.02)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100%",
        transition:
          "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease",
      }}
    >
      {/* Product Image Frame */}
      <div
        className={`luxury-image-zoom-container product-card-image ${aspectRatio === "portrait" ? "portrait" : "standard"}`}
        style={{
          position: "relative",
          width: "100%",
          backgroundColor: "#F2EBE3",
          overflow: "hidden",
        }}
      >
        <Link
          href={productHref}
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault();
              onSelect(product);
            }
          }}
          aria-label={`View ${product.name}`}
          style={{ position: "absolute", inset: 0, display: "block", zIndex: 1 }}
        >
          {!imgLoaded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, #F2EBE3 0%, #EADFD5 50%, #F2EBE3 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite ease-in-out",
              }}
            />
          )}

          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            style={{
              objectFit: "cover",
              objectPosition: "center 20%",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.3s ease, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(true);
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(38, 27, 19, 0.08) 0%, transparent 25%, transparent 75%, rgba(38, 27, 19, 0.14) 100%)",
              pointerEvents: "none",
            }}
          />
        </Link>

        {/* Top-Left Badge */}
        {(badge || product.category || isOutOfStock) && (
          <div
            className="product-card-badge"
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: isOutOfStock ? "rgba(138, 24, 26, 0.92)" : "rgba(26, 18, 12, 0.88)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: isOutOfStock ? "#FAF7F2" : "#ECC880",
              padding: "4px 9px",
              borderRadius: "10px",
              fontSize: "9.5px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              zIndex: 2,
              border: isOutOfStock
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "1px solid rgba(197, 160, 89, 0.4)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: "8px" }}>✦</span>
            <span>{isOutOfStock ? "Sold Out" : badge || product.category}</span>
          </div>
        )}

        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWishlist(product);
          }}
          aria-label={isFavorited ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isFavorited}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            backgroundColor: isFavorited ? "#8A181A" : "rgba(255, 255, 255, 0.92)",
            color: isFavorited ? "#FFFFFF" : "#261B13",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isFavorited
              ? "0 4px 12px rgba(138, 24, 26, 0.35)"
              : "0 4px 14px rgba(38, 27, 19, 0.12)",
            border: isFavorited ? "1px solid #8A181A" : "1px solid rgba(197, 160, 89, 0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: isFavorited ? "scale(1.05)" : "scale(1)",
            zIndex: 3,
          }}
        >
          <HeartIcon size={17} fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" />
        </button>

        {/* Quick View Trigger (Desktop pill + Touch-friendly Mobile icon) */}
        {onQuickView && (
          <button
            type="button"
            className="product-card-quickview-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onQuickView(product);
            }}
            aria-label={`Quick view ${product.name}`}
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              backgroundColor: "rgba(250, 247, 242, 0.94)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#261B13",
              padding: "6px 11px",
              borderRadius: "18px",
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "1px solid rgba(197, 160, 89, 0.55)",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              zIndex: 3,
            }}
          >
            <EyeIcon size={14} color="#261B13" />
            <span className="desktop-only">Quick View</span>
          </button>
        )}
      </div>

      {/* Product Information */}
      <div
        className="product-card-body"
        style={{
          padding: "13px 14px 14px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Color Swatch Dots */}
        {product.color_variants && product.color_variants.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "6px",
              flexWrap: "wrap",
            }}
          >
            {product.color_variants.slice(0, 4).map((v) => {
              const isSelected = selectedColor === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  title={v.name}
                  aria-label={`Preview ${product.name} in ${v.name}`}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(isSelected ? null : v.name);
                  }}
                  className="product-swatch-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "24px",
                    minHeight: "24px",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: v.hex,
                      border: isSelected ? "2px solid #261B13" : "1px solid #C8B8A6",
                      boxShadow: isSelected ? "0 0 0 2px #FAF7F2, 0 0 0 3px #261B13" : "0 1px 3px rgba(0,0,0,0.1)",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </button>
              );
            })}
            <span style={{ fontSize: "10.5px", color: "#6A584B", marginLeft: "2px" }}>
              {selectedColor || `${product.color_variants.length} ${product.color_variants.length === 1 ? "shade" : "shades"}`}
            </span>
          </div>
        )}

        {/* Title Link */}
        <h3
          className="product-card-title"
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "15.5px",
            fontWeight: 600,
            color: "#261B13",
            lineHeight: 1.3,
            marginBottom: "4px",
          }}
        >
          <Link
            href={productHref}
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(product);
              }
            }}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "40px",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {product.name}
          </Link>
        </h3>

        {/* Subtle Fabric/Weave Tag */}
        {product.fabric && (
          <div
            style={{
              fontSize: "11px",
              color: "#6A584B",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.fabric}
          </div>
        )}

        {/* Pricing & Action Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginTop: "auto",
            paddingTop: "8px",
            borderTop: "1px solid #F2EBE3",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px", flexWrap: "wrap", minWidth: 0 }}>
            <span
              className="product-card-price"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#261B13",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.2,
              }}
            >
              {formatINR(product.price)}
            </span>
            {discountPercent > 0 && product.mrp && product.mrp > product.price && (
              <>
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#6A584B",
                    textDecoration: "line-through",
                  }}
                >
                  {formatINR(product.mrp)}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#1E5E3A",
                  }}
                >
                  {discountPercent}% OFF
                </span>
              </>
            )}
            {product.price <= 1299 && discountPercent === 0 && (
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  color: "#1E5E3A",
                  backgroundColor: "rgba(30, 94, 58, 0.08)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                Value Edit
              </span>
            )}
          </div>

          <Link
            href={productHref}
            onClick={(e) => {
              if (onSelect) {
                e.preventDefault();
                onSelect(product);
              }
            }}
            aria-label={`View options for ${product.name}`}
            className="product-card-quick-add-btn btn-shine"
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              border: "1px solid rgba(197, 160, 89, 0.4)",
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 2px 8px rgba(38,27,19,0.14)",
              flexShrink: 0,
            }}
          >
            <span>View</span>
            <span style={{ fontSize: "11px" }}>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
