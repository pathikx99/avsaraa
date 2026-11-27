"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCarouselSection from "./ProductCarouselSection";

export default function Bestsellers({ initialProducts }: { initialProducts?: Product[] }) {
  return (
    <ProductCarouselSection
      id="bestsellers"
      kicker="✦ MOST LOVED ✦"
      title="Our Bestsellers"
      subtitle="Our most loved handcrafted sarees and festive outfits."
      viewAllHref="/products?sort=bestsellers"
      viewAllLabel="View All Bestsellers →"
      badgeText="BESTSELLER"
      sortMode="bestselling"
      initialProducts={initialProducts}
    />
  );
}
