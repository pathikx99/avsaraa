"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F7F2EE" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
