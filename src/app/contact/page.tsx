"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F7F2EE" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
