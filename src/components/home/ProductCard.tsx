"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { HeartIcon, ShoppingBagIcon } from "@/components/Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  badge?: string;
  onSelect?: (product: Product) => void;
  aspectRatio?: "portrait" | "standard";
}

const DEFAULT_IMAGE = "/images/banarasi_silk_saree.jpg";

export default function ProductCard({
  product,
  badge,
  onSelect,
  aspectRatio = "portrait",
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(resolveProductImage(product.image_url) || DEFAULT_IMAGE);

  useEffect(() => {
    setImgSrc(resolveProductImage(product.image_url) || DEFAULT_IMAGE);
  }, [product.image_url]);

  const isFavorited = isInWishlist(product.id);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = addToCart(product);
    if (success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
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
        border: "1px solid #E8DED3",
        boxShadow: "0 4px 18px -6px rgba(38,27,19,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 20%",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.4s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgSrc(DEFAULT_IMAGE);
            setImgLoaded(true);
          }}
        />

        {/* Badge: Category, Custom Badge or Price Tag */}
        {(badge || product.category) && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              backgroundColor: "rgba(38, 27, 19, 0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#FAF7F2",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              zIndex: 2,
              border: "1px solid rgba(197, 160, 89, 0.3)",
            }}
          >
            {badge || product.category}
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
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: isFavorited ? "#8A181A" : "rgba(255, 255, 255, 0.92)",
            color: isFavorited ? "#FFFFFF" : "#261B13",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: isFavorited ? "scale(1.05)" : "scale(1)",
            zIndex: 3,
          }}
        >
          <HeartIcon size={18} fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" />
        </button>
      </div>

      {/* Product Information */}
      <div
        style={{
          padding: "14px 14px 14px 14px",
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
                fontWeight: 600,
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
                  fontSize: "9.5px",
                  fontWeight: 600,
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
            onClick={handleQuickAdd}
            aria-label={isAdded ? "Added to Bag" : `Quick add ${product.name} to bag`}
            className="product-card-quick-add-btn btn-shine"
            style={{
              padding: "7px 11px",
              borderRadius: "6px",
              backgroundColor: isAdded ? "#1E5E3A" : "#261B13",
              color: "#FAF7F2",
              border: "1px solid rgba(197, 160, 89, 0.35)",
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 2px 8px rgba(38,27,19,0.14)",
              flexShrink: 0,
            }}
          >
            {isAdded ? (
              <span>✓ Added</span>
            ) : (
              <>
                <ShoppingBagIcon size={13} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
