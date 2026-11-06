"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { RevealSection } from "@/components/RevealSection";

export default function PriceEdit() {
  return (
    <section id="price-edit" className="price-edit-section" aria-label="The ₹1,299 Edit">
      <div className="price-edit-container">
        <RevealSection>
          <Link
            href="/under-1299"
            className="price-edit-box-card luxury-hover-card"
            aria-label="Explore The ₹1,299 Edit - All pieces up to ₹1,299"
          >
            {/* Gilded Corner Filigrees */}
            <div className="price-edit-corner top-left" aria-hidden="true" />
            <div className="price-edit-corner top-right" aria-hidden="true" />
            <div className="price-edit-corner bottom-left" aria-hidden="true" />
            <div className="price-edit-corner bottom-right" aria-hidden="true" />

            <div className="price-edit-box-inner">
              {/* Image Window */}
              <div className="price-edit-image-col">
                <div className="price-edit-image-window">
                  <Image
                    src="/images/product_suit_under1299.jpg"
                    alt="The ₹1,299 Edit - Handcrafted Daily Wear"
                    fill
                    sizes="(max-width: 767px) 94vw, 48vw"
                    className="price-edit-img"
                  />
                  {/* Floating Price Pill */}
                  <div className="price-edit-floating-tag">
                    <span>UP TO ₹1,299</span>
                  </div>
                </div>
              </div>

              {/* Minimal Editorial Content */}
              <div className="price-edit-content-col">
                <span className="price-edit-badge">
                  ✦ CURATED VALUE EDIT ✦
                </span>

                <h2 className="price-edit-title">The ₹1,299 Edit</h2>

                <p className="price-edit-subtitle">
                  Everyday Elegance · Handcrafted Kurtas, Sets &amp; Stoles
                </p>

                <div className="price-edit-cta-btn btn-shine">
                  <span>EXPLORE THE EDIT</span>
                  <span className="price-edit-cta-arrow">→</span>
                </div>
              </div>
            </div>
          </Link>
        </RevealSection>
      </div>
    </section>
  );
}
