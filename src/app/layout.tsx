import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Alex_Brush } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const alexBrush = Alex_Brush({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://avsaraa.in"),
  title: "AVSARAA | Handcrafted Sarees, Ethnic Wear & Clothes Online | Surat, India",
  description: "Explore handcrafted sarees, ethnic dresses, and occasion wear from Surat's textile heart. Buy authentic Indian clothes online with insured Pan-India delivery.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import MobileBottomNav from "@/components/MobileBottomNav";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"));
const AuthRequiredModal = dynamic(() => import("@/components/AuthRequiredModal"));
const RecentlyViewedBar = dynamic(() => import("@/components/RecentlyViewedBar"));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${alexBrush.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className={jakarta.className}>
        <CartProvider>
          <WishlistProvider>
            {children}
            <CartDrawer />
            <AuthRequiredModal />
            <RecentlyViewedBar />
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          </WishlistProvider>
        </CartProvider>
        {(process.env.VERCEL === "1" || Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)) && <Analytics />}
      </body>
    </html>
  );
}

