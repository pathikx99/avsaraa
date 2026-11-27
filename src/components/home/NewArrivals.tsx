"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCarouselSection from "./ProductCarouselSection";

export default function NewArrivals({ initialProducts }: { initialProducts?: Product[] }) {
  return (
    <ProductCarouselSection
      id="new-arrivals"
      kicker="✦ NEW ARRIVALS ✦"
      title="New Arrivals"
      subtitle="Freshly finished on Indian and Varanasi handlooms for the 2026 festive season."
      viewAllHref="/products?sort=newest"
      viewAllLabel="View All Arrivals →"
      badgeText="NEW ARRIVAL"
      sortMode="newest"
      initialProducts={initialProducts}
    />
  );
}
