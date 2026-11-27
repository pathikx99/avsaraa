"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HeartIcon, TrashIcon } from "@/components/Icons";
import { useWishlist } from "@/context/WishlistContext";
import { resolveProductImage } from "@/lib/productUtils";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist, clearWishlist, user, isLoaded } = useWishlist();

  return (
    <div
      className="page-enter"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAF7F2",
      }}
    >
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Breadcrumb & Header Banner */}
        <section
          className="collection-hero-pattern"
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 44px 24px",
            textAlign: "center",
            position: "relative",
            borderBottom: "1px solid #3E2D22",
          }}
        >
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            style={{
              fontSize: "12px",
              color: "#C4AB94",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <Link href="/" style={{ color: "#C4AB94", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>Wishlist</span>
          </nav>

          <span
            className="luxury-badge"
            style={{
              marginBottom: "12px",
              backgroundColor: "rgba(196, 171, 148, 0.15)",
              color: "#E2D7CC",
              border: "1px solid rgba(196, 171, 148, 0.3)",
            }}
          >
            ✦ SAVED ITEMS ✦
          </span>

          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(34px, 5vw, 52px)",
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: "14px",
              color: "#FAF7F2",
            }}
          >
            My Wishlist
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#D6C7B8",
              maxWidth: "580px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Your saved collection of handcrafted sarees, dresses, and festive wear.
          </p>
        </section>

        {/* Wishlist Content */}
        <section style={{ padding: "60px 24px 120px 24px", maxWidth: "1240px", margin: "0 auto" }}>
          {!user && isLoaded ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "24px",
                padding: "60px 32px",
                boxShadow: "0 10px 30px rgba(38, 27, 19, 0.04)",
                textAlign: "center",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(197, 160, 89, 0.12)",
                  border: "1px solid rgba(197, 160, 89, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                }}
              >
                <HeartIcon size={26} color="#866951" />
              </div>

              <span className="luxury-badge" style={{ marginBottom: "12px", display: "inline-block" }}>
                ✦ MY WISHLIST ✦
              </span>

              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#261B13",
                  marginBottom: "10px",
                }}
              >
                Sign In to View Your Wishlist
              </h2>

              <p
                style={{
                  fontSize: "14.5px",
                  color: "#6E5B4E",
                  lineHeight: 1.7,
                  maxWidth: "460px",
                  margin: "0 auto 28px auto",
                }}
              >
                Please sign in to view your saved items, keep track of your favourites, and easily add them to your bag.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "340px", margin: "0 auto" }}>
                <Link
                  href="/login?redirectTo=/wishlist"
                  className="avsaraa-btn-primary btn-shine"
                  style={{
                    height: "48px",
                    fontSize: "12.5px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textDecoration: "none",
                    borderRadius: "24px",
                  }}
                >
                  <span>Sign In to Your Account</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/register"
                  className="avsaraa-btn-outline"
                  style={{
                    height: "46px",
                    fontSize: "12.5px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    borderRadius: "24px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <span>Create New Account</span>
                </Link>

                <Link
                  href="/products"
                  style={{
                    marginTop: "8px",
                    fontSize: "12.5px",
                    color: "#866951",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    fontWeight: 500,
                  }}
                >
                  Explore Collection →
                </Link>
              </div>
            </div>
          ) : wishlist.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "24px",
                padding: "60px 32px",
                boxShadow: "0 10px 30px rgba(38, 27, 19, 0.04)",
                textAlign: "center",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#FAF7F2",
                  border: "1px solid #E6DACF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                }}
              >
                <HeartIcon size={26} color="#866951" />
              </div>

              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "#261B13",
                  marginBottom: "10px",
                }}
              >
                Your Wishlist is Empty
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#6E5B4E",
                  lineHeight: 1.7,
                  maxWidth: "420px",
                  margin: "0 auto 28px auto",
                }}
              >
                Explore our handcrafted silk sarees and festive wear to save your favourites.
              </p>

              <Link
                href="/products"
                className="avsaraa-btn-primary btn-shine"
                style={{
                  height: "50px",
                  padding: "0 34px",
                  fontSize: "12.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  borderRadius: "25px",
                }}
              >
                <span>Explore Collection</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div>
              {/* Top Bar: Count & Clear */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "32px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #EAE0D5",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>
                  {wishlist.length} {wishlist.length === 1 ? "Piece Saved" : "Pieces Saved"}
                </span>

                <button
                  type="button"
                  onClick={clearWishlist}
                  style={{
                    fontSize: "12px",
                    color: "#8E7D70",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Responsive Product Grid */}
              <div className="responsive-product-grid">
                {wishlist.map((product) => (
                  <div
                    key={product.id}
                    className="luxury-hover-card product-card-container"
                    onClick={() => router.push(`/products/${product.id}`)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      overflow: "hidden",
                      border: "1px solid #E8DED3",
                      boxShadow: "0 8px 24px -10px rgba(38,27,19,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {/* Image Frame */}
                    <div
                      className="luxury-image-zoom-container product-card-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/products/${product.id}`);
                      }}
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "360px",
                        backgroundColor: "#F2EBE3",
                        cursor: "pointer",
                      }}
                    >
                      <Image
                        src={resolveProductImage(product.image_url) || "/images/saree_model_hero.jpg"}
                        alt={product.name}
                        fill
                        sizes="(min-width: 900px) 25vw, 50vw"
                        style={{ objectFit: "cover", objectPosition: "center 20%" }}
                      />

                      {/* Category Badge */}
                      <div
                        className="product-card-badge"
                        style={{
                          position: "absolute",
                          top: "14px",
                          left: "14px",
                          backgroundColor: "rgba(38, 27, 19, 0.85)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          color: "#FAF7F2",
                          padding: "5px 12px",
                          borderRadius: "14px",
                          fontSize: "10.5px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {product.category}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(product.id);
                        }}
                        aria-label="Remove from wishlist"
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(250, 247, 242, 0.94)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(197, 160, 89, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 3,
                          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                        }}
                      >
                        <TrashIcon size={14} color="#866951" />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div
                      className="product-card-body"
                      style={{
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <Link
                        href={`/products/${product.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: "none" }}
                      >
                        <h3
                          className="product-card-title"
                          style={{
                            fontFamily: "var(--font-serif), Georgia, serif",
                            fontSize: "19px",
                            fontWeight: 600,
                            color: "#261B13",
                            marginBottom: "6px",
                            lineHeight: 1.3,
                          }}
                        >
                          {product.name}
                        </h3>
                      </Link>

                      <p
                        className="product-card-desc"
                        style={{
                          fontSize: "13px",
                          color: "#6E5B4E",
                          lineHeight: 1.55,
                          marginBottom: "16px",
                          flex: 1,
                        }}
                      >
                        {product.description}
                      </p>

                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "14px",
                          borderTop: "1px solid #F0E8DF",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                          <span
                            className="product-card-price"
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#261B13",
                            }}
                          >
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>

                          <Link
                            href={`/contact?inquire=${encodeURIComponent(product.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#866951",
                              textDecoration: "underline",
                              textUnderlineOffset: "3px",
                            }}
                          >
                            Inquire ↗
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/${product.id}`);
                          }}
                          className="avsaraa-btn-primary product-card-btn btn-shine"
                          style={{
                            height: "40px",
                            fontSize: "11px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            borderRadius: "20px",
                            width: "100%",
                            backgroundColor: "#261B13",
                            transition: "background-color 0.3s ease",
                            cursor: "pointer",
                          }}
                        >
                          <span>Select Size & Order →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
