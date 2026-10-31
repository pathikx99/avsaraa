"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export const HERO_SLIDES = [
  {
    id: "new-arrivals",
    badge: "NEW COLLECTION",
    atelierTag: "Handloom Silk • Surat Atelier",
    titleLine1: "Every",
    titleLine2: "Moment",
    titleLine3: "A Little More",
    titleScript: "You",
    subtitle: "TIMELESS PIECES FOR YOUR EVERY STORY.",
    desc: "Handcrafted pure silks and artisanal weaves, thoughtfully designed for defining celebrations.",
    ctaText: "SHOP NEW ARRIVALS",
    ctaLink: "/products?category=New%20Arrivals",
    secondaryText: "EXPLORE SAREES",
    secondaryLink: "/products?category=Sarees",
    mobileBanner: "/images/handloom_silk_saree.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_1.jpg",
    alt: "Avsaraa New Collection - Handcrafted Saree in Natural Sunlight",
    pieceNo: "№ 108",
    craft: "Pure Katan Silk & Zari Weave",
  },
  {
    id: "banarasi-silks",
    badge: "HANDLOOM ATELIER",
    atelierTag: "Varanasi Heritage Looms",
    titleLine1: "Woven",
    titleLine2: "With Pure",
    titleLine3: "Heritage &",
    titleScript: "Grace",
    subtitle: "AUTHENTIC VARANASI WEAVES CRAFTED FOR CELEBRATIONS.",
    desc: "Intricately interlocked gold and silver zari on pure mulberry silk, crafted on traditional pit looms.",
    ctaText: "EXPLORE SAREES",
    ctaLink: "/products?category=Sarees",
    secondaryText: "VIEW ALL PRODUCTS",
    secondaryLink: "/products",
    mobileBanner: "/images/banarasi_silk_saree.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_2.jpg",
    alt: "Handcrafted Banarasi Silk Sarees",
    pieceNo: "№ 247",
    craft: "Varanasi Pit Loom Katan Silk",
  },
  {
    id: "royal-dresses",
    badge: "FESTIVE COLLECTION",
    atelierTag: "Artisan Occasion Wear",
    titleLine1: "Artisan",
    titleLine2: "Occasion",
    titleLine3: "Silhouettes for",
    titleScript: "Celebrations",
    subtitle: "BESPOKE ETHNIC DRESSES & TIMELESS SILKS.",
    desc: "Royal anarkalis and Chanderi silhouettes with hand-stitched gota patti and heritage accents.",
    ctaText: "EXPLORE DRESSES",
    ctaLink: "/products?category=Dresses",
    secondaryText: "AVSARAA STYLE",
    secondaryLink: "/products/styles",
    mobileBanner: "/images/royal_occasion_dress.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_3.jpg",
    alt: "Royal Occasion Wear & Handcrafted Festive Dresses",
    pieceNo: "№ 312",
    craft: "Handwoven Chanderi & Gota Patti",
  },
];

export default function HeroBanner() {
  const [heroSlide, setHeroSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleMobileTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        setHeroSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
      } else {
        setHeroSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
      }
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-viewport" aria-label="Haute Couture Showcase">
      {/* MOBILE PRESENTATION: Arch Frame Card with Touch Swipe */}
      <div
        className="mobile-only hero-arch-container"
        onTouchStart={handleMobileTouchStart}
        onTouchEnd={handleMobileTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div className="hero-arch-card hero-arch-outer-card">
          {/* Ornamental Gilded Corner Filigree */}
          <div className="hero-arch-corner top-left" aria-hidden="true" />
          <div className="hero-arch-corner top-right" aria-hidden="true" />
          <div className="hero-arch-corner bottom-left" aria-hidden="true" />
          <div className="hero-arch-corner bottom-right" aria-hidden="true" />

          {/* Top Apex Star Ornament with Gilded Flourish */}
          <div className="hero-arch-top-ornament">
            <span className="hero-arch-ornament-line left" aria-hidden="true" />
            <span className="hero-arch-apex-star">✦</span>
            <span className="hero-arch-ornament-line right" aria-hidden="true" />
          </div>

          {/* Semicircular Royal Arch Frame Window */}
          <div className="hero-arch-frame-window">
            <Image
              key={HERO_SLIDES[heroSlide].id}
              src={HERO_SLIDES[heroSlide].mobileBanner}
              alt={HERO_SLIDES[heroSlide].alt}
              fill
              priority
              sizes="(max-width: 899px) 94vw, 1px"
              className="hero-arch-img"
            />

            {/* Directional Soft Limestone Gradient Scrim */}
            <div className="hero-arch-scrim" />

            {/* Left-Aligned Editorial Typography */}
            <div className="hero-arch-content">
              <span className="hero-arch-kicker">
                ✦ {HERO_SLIDES[heroSlide].badge} ✦
              </span>

              <h1 className="hero-arch-title">
                <div>{HERO_SLIDES[heroSlide].titleLine1}</div>
                <div>{HERO_SLIDES[heroSlide].titleLine2}</div>
                <div>{HERO_SLIDES[heroSlide].titleLine3}</div>
                <div className="font-script hero-arch-script">
                  {HERO_SLIDES[heroSlide].titleScript}
                </div>
              </h1>

              <p className="hero-arch-subtitle">
                {HERO_SLIDES[heroSlide].subtitle}
              </p>

              <Link
                href={HERO_SLIDES[heroSlide].ctaLink}
                className="hero-arch-cta-btn btn-shine"
                id="hero-mobile-cta"
              >
                <span>{HERO_SLIDES[heroSlide].ctaText}</span>
                <span className="hero-arch-cta-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* Bottom Carousel Indicator Dots */}
          <div className="hero-arch-dots-bar" role="tablist" aria-label="Hero carousel navigation">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroSlide(idx)}
                aria-label={`Slide ${idx + 1}: ${HERO_SLIDES[idx].badge}`}
                aria-selected={heroSlide === idx}
                role="tab"
                className={`hero-arch-dot ${heroSlide === idx ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DESKTOP PRESENTATION: Full-Bleed High-Fashion Cinematic Editorial */}
      <div className="hero-cinematic-stage">
        {/* 1. Full-Bleed Cinematic Background Image */}
        <div className="hero-cinematic-bg-wrapper">
          <Image
            key={HERO_SLIDES[heroSlide].id}
            src={HERO_SLIDES[heroSlide].desktopBanner}
            alt={HERO_SLIDES[heroSlide].alt}
            fill
            priority
            sizes="(max-width: 899px) 1px, 100vw"
            className="hero-cinematic-img"
            style={{
              objectFit: "cover",
              objectPosition: "right 25%",
            }}
          />
          {/* Seamless Soft Directional Ambient Gradient */}
          <div className="hero-cinematic-overlay" />
        </div>

        {/* 2. Editorial Typography & Story Canvas */}
        <div className="hero-cinematic-content">
          {/* Atelier Gilded Badge */}
          <div style={{ marginBottom: "16px" }}>
            <span className="hero-cinematic-badge">
              ✦ {HERO_SLIDES[heroSlide].badge} • ATELIER 2026 ✦
            </span>
          </div>

          {/* Editorial Grand Headline */}
          <h1 className="hero-cinematic-title">
            <div>{HERO_SLIDES[heroSlide].titleLine1}</div>
            <div>{HERO_SLIDES[heroSlide].titleLine2}</div>
            <div>{HERO_SLIDES[heroSlide].titleLine3}</div>
            <div className="font-script gold-foil-text hero-cinematic-script">
              {HERO_SLIDES[heroSlide].titleScript}
            </div>
          </h1>

          {/* Subtitle & Craft Narrative */}
          <p className="hero-cinematic-subtitle">
            {HERO_SLIDES[heroSlide].subtitle}
          </p>
          <p className="hero-cinematic-desc">
            {HERO_SLIDES[heroSlide].desc}
          </p>

          {/* Haute Couture Action Buttons */}
          <div className="hero-cinematic-actions">
            <Link
              href={HERO_SLIDES[heroSlide].ctaLink}
              className="hero-cta-btn-link btn-shine"
            >
              <span>{HERO_SLIDES[heroSlide].ctaText}</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </Link>

            <Link
              href={HERO_SLIDES[heroSlide].secondaryLink}
              className="hero-secondary-btn"
            >
              <span>{HERO_SLIDES[heroSlide].secondaryText}</span>
              <span>↗</span>
            </Link>
          </div>

          {/* Artisan Guarantees Row */}
          <div className="hero-cinematic-guarantees">
            <div className="hero-guarantee-item">
              <span className="hero-guarantee-star">✦</span>
              <span>Silk Mark Certified</span>
            </div>
            <div className="hero-guarantee-item">
              <span className="hero-guarantee-star">✦</span>
              <span>Pure Varanasi & Surat Looms</span>
            </div>
            <div className="hero-guarantee-item">
              <span className="hero-guarantee-star">✦</span>
              <span>Complimentary Fall & Pico</span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Desktop Provenance Card & Slide Switchers */}
        <div className="hero-cinematic-footer">
          <div className="hero-provenance-box">
            <span className="hero-provenance-kicker">
              EDITION 0{heroSlide + 1} / 0{HERO_SLIDES.length}
            </span>
            <div className="hero-provenance-meta">
              <span className="hero-provenance-piece">{HERO_SLIDES[heroSlide].pieceNo}</span>
              <span className="hero-provenance-divider">•</span>
              <span className="hero-provenance-craft">
                {HERO_SLIDES[heroSlide].craft}
              </span>
            </div>
          </div>

          {/* Editorial Prev / Next Buttons */}
          <div className="hero-slide-controls">
            <button
              onClick={() =>
                setHeroSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
              }
              className="hero-arrow-btn"
              aria-label={`Previous edition: ${HERO_SLIDES[heroSlide === 0 ? HERO_SLIDES.length - 1 : heroSlide - 1].badge}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              onClick={() =>
                setHeroSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1))
              }
              className="hero-arrow-btn"
              aria-label={`Next edition: ${HERO_SLIDES[(heroSlide + 1) % HERO_SLIDES.length].badge}`}
            >
              <span className="hero-next-preview-label">
                {HERO_SLIDES[(heroSlide + 1) % HERO_SLIDES.length].badge}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Progress Rail */}
        <div className="hero-progress-rail">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = heroSlide === idx;
            return (
              <button
                key={slide.id}
                onClick={() => setHeroSlide(idx)}
                className={`hero-rail-segment ${isActive ? "active" : ""}`}
                aria-label={`Select edition ${idx + 1}: ${slide.badge}`}
              >
                <span className="hero-rail-number">0{idx + 1}</span>
                <span className="hero-rail-line" />
                <span className="hero-rail-label">{slide.badge}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
