"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { HeartIcon } from "@/components/Icons";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  badge?: string;
  onSelect?: (product: Product) => void;
  aspectRatio?: "portrait" | "standard";
}

const DEFAULT_IMAGE = "https://aqpkagsbaecavoznnrlj.supabase.co/storage/v1/object/public/items/products/e2000000-0000-0000-0000-000000000001/hero.webp";

export default function ProductCard({
  product,
  badge,
  onSelect,
  aspectRatio = "portrait",
}: ProductCardProps) {
  const router = useRouter();
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

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    } else {
      const colorParam = selectedColor ? `?color=${encodeURIComponent(selectedColor)}` : "";
      router.push(`/products/${product.id}${colorParam}`);
    }
  };


  return (
    <div
      className="luxury-hover-card product-card-container product-card-shimmer"
      onClick={handleCardClick}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(230, 218, 207, 0.8)",
        boxShadow: "0 4px 20px -4px rgba(38, 27, 19, 0.06), 0 1px 3px rgba(38, 27, 19, 0.02)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease",
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
        {/* Shimmer Placeholder before load */}
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
          unoptimized={Boolean(imgSrc && imgSrc.includes("supabase.co"))}
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

        {/* Soft vignette overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(38, 27, 19, 0.08) 0%, transparent 25%, transparent 75%, rgba(38, 27, 19, 0.12) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge: Category, Custom Badge or Price Tag */}
        {(badge || product.category) && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "rgba(26, 18, 12, 0.88)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#ECC880",
              padding: "4px 9px",
              borderRadius: "10px",
              fontSize: "9.5px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              zIndex: 2,
              border: "1px solid rgba(197, 160, 89, 0.4)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "8px" }}>✦</span>
            <span>{badge || product.category}</span>
          </div>
        )}

        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            backgroundColor: isFavorited ? "#8A181A" : "rgba(255, 255, 255, 0.9)",
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
      </div>

      {/* Product Information */}
      <div
        style={{
          padding: "13px 14px 14px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Color Swatch Dots (if available) */}
        {product.color_variants && product.color_variants.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            {product.color_variants.map((v) => {
              const isSelected = selectedColor === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  title={v.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(v.name);
                  }}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: v.hex,
                    border: isSelected ? "2px solid #261B13" : "1px solid #D0C3B5",
                    padding: 0,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transform: isSelected ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.15s ease",
                  }}
                />
              );
            })}
            <span style={{ fontSize: "10px", color: "#8E7D70", marginLeft: "4px" }}>
              {product.color_variants.length} {product.color_variants.length === 1 ? "shade" : "shades"}
            </span>
          </div>
        )}

        <h3
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "#261B13",
            lineHeight: 1.35,
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "40px",
          }}
        >
          {product.name}
        </h3>

        {/* Pricing & Quick Add Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginTop: "auto",
            paddingTop: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap", minWidth: 0 }}>
            <span
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
            {product.price <= 1299 && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#1E5E3A",
                  backgroundColor: "rgba(30, 94, 58, 0.08)",
                  padding: "2px 5px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                Up to ₹1,299
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
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
              cursor: "pointer",
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
          </button>
        </div>
      </div>
    </div>
  );
}
