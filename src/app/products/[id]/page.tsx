import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductById } from "@/lib/productDetailData";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  return {
    title: `${product.name} | AVSARAA · Wear The Moment`,
    description: product.description || "Handcrafted Indian luxury fashion, sarees, and occasion silhouettes from our artisan atelier.",
    openGraph: {
      title: `${product.name} | AVSARAA`,
      description: product.description,
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url,
    description: product.description || "Handcrafted Indian sarees and festive wear from our artisan atelier.",
    brand: {
      "@type": "Brand",
      name: "AVSARAA",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://avsaraa.in"}/products/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        (product.stock_count ?? 10) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "AVSARAA",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}

