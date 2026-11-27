"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export const HERO_SLIDES = [
  {
    id: "new-arrivals",
    badge: "NEW COLLECTION",
    atelierTag: "Avsaraa Couture Atelier",
    mobileDisplayLine: "Every Moment,",
    mobileScriptWord: "Unforgettable",
    titleLine1: "Every",
    titleLine2: "Moment",
    titleLine3: "A Little More",
    titleScript: "You",
    subtitle: "TIMELESS PIECES FOR YOUR EVERY STORY.",
    desc: "Handcrafted pure silks and artisanal weaves, thoughtfully designed for defining celebrations.",
    ctaText: "SHOP NEW ARRIVALS",
    mobileCtaText: "Shop Collection",
    ctaLink: "/products?category=New%20Arrivals",
    secondaryText: "EXPLORE SAREES",
    mobileSecondaryText: "Sarees",
    secondaryLink: "/products?category=Sarees",
    mobileBanner: "/images/saree_model_hero.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_1.jpg",
    alt: "Avsaraa New Collection - Handcrafted Saree in Natural Sunlight",
    pieceNo: "№ 108",
    craft: "Pure Katan Silk & Zari Weave",
  },
  {
    id: "banarasi-silks",
    badge: "HANDLOOM HERITAGE",
    atelierTag: "Varanasi Heritage Looms",
    mobileDisplayLine: "Woven Heritage,",
    mobileScriptWord: "Timeless Grace",
    titleLine1: "Woven",
    titleLine2: "With Pure",
    titleLine3: "Heritage &",
    titleScript: "Grace",
    subtitle: "AUTHENTIC VARANASI WEAVES CRAFTED FOR CELEBRATIONS.",
    desc: "Intricately interlocked gold and silver zari on pure mulberry silk, crafted on traditional pit looms.",
    ctaText: "EXPLORE SAREES",
    mobileCtaText: "Explore Sarees",
    ctaLink: "/products?category=Sarees",
    secondaryText: "VIEW ALL PRODUCTS",
    mobileSecondaryText: "All Weaves",
    secondaryLink: "/products",
    mobileBanner: "/images/occasion_traditional.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_2.jpg",
    alt: "Handcrafted Banarasi Silk Sarees",
    pieceNo: "№ 247",
    craft: "Varanasi Pit Loom Katan Silk",
  },
  {
    id: "royal-dresses",
    badge: "FESTIVE COLLECTION",
    atelierTag: "Artisan Occasion Wear",
    mobileDisplayLine: "Artisan Silhouettes,",
    mobileScriptWord: "Radiant Evenings",
    titleLine1: "Artisan",
    titleLine2: "Occasion",
    titleLine3: "Silhouettes for",
    titleScript: "Celebrations",
    subtitle: "BESPOKE ETHNIC DRESSES & TIMELESS SILKS.",
    desc: "Royal anarkalis and Chanderi silhouettes with hand-stitched gota patti and heritage accents.",
    ctaText: "EXPLORE DRESSES",
    mobileCtaText: "Shop Festive",
    ctaLink: "/products?category=Dresses",
    secondaryText: "VIEW ALL PRODUCTS",
    mobileSecondaryText: "Lookbook",
    secondaryLink: "/products",
    mobileBanner: "/images/occasion_festive.jpg",
    desktopBanner: "/images/desktop_hero_cinematic_3.jpg",
    alt: "Royal Occasion Wear & Handcrafted Festive Dresses",
    pieceNo: "№ 312",
    craft: "Handwoven Chanderi & Gota Patti",
  },
];

export default function HeroBanner() {
  const [heroSlide, setHeroSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const pendingTargetRef = useRef<number | null>(null);
  const lastAnnouncedRef = useRef(0);
  const rafScrollRef = useRef<number | null>(null);
  const scrollFallbackTimerRef = useRef<number | null>(null);

  const scrollToSlide = useCallback((targetIdx: number, announce = true) => {
    const normalizedIdx =
      ((targetIdx % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length;
    pendingTargetRef.current = normalizedIdx;
    setHeroSlide(normalizedIdx);
    if (announce && lastAnnouncedRef.current !== normalizedIdx) {
      lastAnnouncedRef.current = normalizedIdx;
      setAnnouncement(
        `Slide ${normalizedIdx + 1} of ${HERO_SLIDES.length}: ${HERO_SLIDES[normalizedIdx].badge}`
      );
    }

    const track = trackRef.current;
    if (track && track.clientWidth > 0) {
      const targetLeft = normalizedIdx * track.clientWidth;
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({
        left: targetLeft,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }
  }, []);

  const syncFromTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) return;
    if (pendingTargetRef.current !== null) return;
    const idx = Math.min(
      HERO_SLIDES.length - 1,
      Math.max(0, Math.round(track.scrollLeft / track.clientWidth))
    );
    setHeroSlide((prev) => (prev === idx ? prev : idx));
  }, []);

  const handleSettle = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0) return;
    const settledIdx = Math.min(
      HERO_SLIDES.length - 1,
      Math.max(0, Math.round(track.scrollLeft / track.clientWidth))
    );
    pendingTargetRef.current = null;
    setHeroSlide(settledIdx);
    if (lastAnnouncedRef.current !== settledIdx) {
      lastAnnouncedRef.current = settledIdx;
      setAnnouncement(
        `Slide ${settledIdx + 1} of ${HERO_SLIDES.length}: ${HERO_SLIDES[settledIdx].badge}`
      );
    }
  }, []);

  const handleMobileScroll = () => {
    if (rafScrollRef.current !== null) {
      cancelAnimationFrame(rafScrollRef.current);
    }
    rafScrollRef.current = requestAnimationFrame(() => {
      syncFromTrackScroll();
      rafScrollRef.current = null;
    });

    if (typeof window !== "undefined" && !("onscrollend" in window)) {
      if (scrollFallbackTimerRef.current !== null) {
        clearTimeout(scrollFallbackTimerRef.current);
      }
      scrollFallbackTimerRef.current = globalThis.setTimeout(handleSettle, 140) as unknown as number;
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof window === "undefined") return;
    const onScrollEnd = () => handleSettle();
    track.addEventListener("scrollend", onScrollEnd);
    return () => {
      track.removeEventListener("scrollend", onScrollEnd);
      if (rafScrollRef.current !== null) cancelAnimationFrame(rafScrollRef.current);
      if (scrollFallbackTimerRef.current !== null) clearTimeout(scrollFallbackTimerRef.current);
    };
  }, [handleSettle]);

  useEffect(() => {
    if (isPaused) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setHeroSlide((prev) => {
        const next = prev === HERO_SLIDES.length - 1 ? 0 : prev + 1;
        const track = trackRef.current;
        if (track && track.clientWidth > 0) {
          pendingTargetRef.current = next;
          track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
        }
        return next;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      className="hero-viewport"
      aria-roledescription="carousel"
      aria-label="Haute Couture Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* MOBILE PRESENTATION: Full-Bleed Atelier Lookbook Carousel */}
      <div className="mobile-only hero-mobile-editorial">
        <div className="hero-mobile-shell">
          {/* Hairline Inner Champagne Frame */}
          <div className="hero-mobile-inner-keyline" aria-hidden="true" />

          {/* Top Floating Atelier Edition Tag */}
          <div className="hero-mobile-top-hud">
            <div className="hero-mobile-edition-pill">
              <span className="hero-mobile-edition-index">
                0{heroSlide + 1} / 0{HERO_SLIDES.length}
              </span>
              <span className="hero-mobile-edition-sep" aria-hidden="true" />
              <span>{HERO_SLIDES[heroSlide].atelierTag}</span>
            </div>
          </div>

          {/* Native Snap-Scroll Editorial Track */}
          <div
            ref={trackRef}
            className="hero-mobile-track"
            onScroll={handleMobileScroll}
            onTouchStart={() => setIsPaused(true)}
            role="group"
            aria-label="Hero collection editions"
          >
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = heroSlide === idx;
              const HeadlineTag = idx === 0 ? "h1" : "h2";
              return (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${HERO_SLIDES.length}: ${slide.badge}`}
                  className={`hero-mobile-slide ${isActive ? "is-active" : ""}`}
                >
                  <Image
                    src={slide.mobileBanner}
                    alt={slide.alt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 899px) 96vw, 1px"
                    className="hero-mobile-slide-img"
                  />

                  <div className="hero-mobile-scrim" aria-hidden="true" />

                  <div className="hero-mobile-slide-content">
                    <div className="hero-mobile-craft-line">
                      <span className="hero-mobile-piece">{slide.pieceNo}</span>
                      <span aria-hidden="true" style={{ opacity: 0.55 }}>·</span>
                      <span>{slide.craft}</span>
                    </div>

                    <HeadlineTag className="hero-mobile-headline">
                      <span className="hero-mobile-headline-serif">
                        {slide.mobileDisplayLine}
                      </span>
                      <span className="font-script hero-mobile-script">
                        {slide.mobileScriptWord}
                      </span>
                    </HeadlineTag>

                    <div className="hero-mobile-actions">
                      <Link
                        href={slide.ctaLink}
                        className="hero-mobile-cta-primary btn-shine"
                        id={idx === 0 ? "hero-mobile-cta" : undefined}
                      >
                        <span>{slide.mobileCtaText}</span>
                        <span aria-hidden="true">→</span>
                      </Link>

                      <Link
                        href={slide.secondaryLink}
                        className="hero-mobile-cta-secondary"
                      >
                        <span>{slide.mobileSecondaryText}</span>
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimalist Lookbook Pagination & Prev/Next Bar */}
        <div className="hero-mobile-footer-rail">
          <button
            type="button"
            onClick={() => scrollToSlide(heroSlide - 1)}
            className="hero-mobile-arrow-btn"
            aria-label="Previous hero collection"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <nav className="hero-mobile-markers" aria-label="Choose a hero collection">
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = heroSlide === idx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Edition ${idx + 1}: ${slide.badge}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`hero-mobile-marker ${isActive ? "active" : ""}`}
                />
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => scrollToSlide(heroSlide + 1)}
            className="hero-mobile-arrow-btn"
            aria-label="Next hero collection"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Subtle Silk Provenance Signature Ribbon */}
        <div className="hero-mobile-heritage-bar" aria-label="Brand assurances">
          <span>Silk Mark Certified</span>
          <span aria-hidden="true">·</span>
          <span>Pure Indian Handlooms</span>
          <span aria-hidden="true">·</span>
          <span>Free Fall &amp; Pico</span>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
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
            priority={heroSlide === 0}
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
              ✦ {HERO_SLIDES[heroSlide].badge} • COLLECTION 2026 ✦
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
              <span>Pure Varanasi &amp; Indian Looms</span>
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
              type="button"
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
