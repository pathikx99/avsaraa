"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/home/HeroBanner";
import ShopByOccasion from "@/components/home/ShopByOccasion";
import PriceEdit from "@/components/home/PriceEdit";
import NewArrivals from "@/components/home/NewArrivals";
import AvsaraaStyle from "@/components/home/AvsaraaStyle";
import Bestsellers from "@/components/home/Bestsellers";
import ShoppingBenefits from "@/components/home/ShoppingBenefits";

export default function HomePage() {
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
      {/* 1. Header with Announcement Bar & Sticky Nav */}
      <Header />

      <main style={{ flex: 1 }}>
        {/* 2. Hero: Arch Frame on Mobile, Cinematic Editorial on Desktop */}
        <HeroBanner />

        {/* 3. Shop by Occasion (6-card curated grid: 2 cols on mobile, 3 cols on desktop) */}
        <ShopByOccasion />

        {/* 4. The ₹1,299 Edit (Curated value edit: UP TO ₹1,299) */}
        <PriceEdit />

        {/* 5. New Arrivals (Horizontal swipeable carousel on mobile) */}
        <NewArrivals />

        {/* 6. AVSARAA Style (Mix & Match combinations studio link to /products/styles) */}
        <AvsaraaStyle />

        {/* 7. Our Bestsellers (Patron favorites & top ranked pieces) */}
        <Bestsellers />

        {/* 8. Shopping Benefits (Trust Strip: Free express delivery, COD, 7-day returns, keepsake box) */}
        <ShoppingBenefits />
      </main>

      {/* 9. Footer with all brand, service, and policy links */}
      <Footer />
    </div>
  );
}
