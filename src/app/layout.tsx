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
  title: "AVSARAA | Handcrafted Sarees, Ethnic Wear & Clothes Online | Surat, India",
  description: "Explore handcrafted sarees, ethnic dresses, and occasion wear from Surat's textile heart. Buy authentic Indian clothes online with nationwide delivery across India.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/CartDrawer";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import MobileBottomNav from "@/components/MobileBottomNav";

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
            <MobileBottomNav />
          </WishlistProvider>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}

