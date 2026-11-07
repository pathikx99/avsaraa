import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchProductById, SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import ProductDetailClient from "@/app/products/[id]/ProductDetailClient";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Match by id or slugified name
  const product =
    (await fetchProductById(slug)) ||
    SEED_CATALOG_PRODUCTS.find(
      (p) =>
        p.id === slug ||
        p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
    );

  if (!product) {
    return {
      title: "Product Not Found | AVSARAA",
      description: "Handcrafted Indian luxury fashion and occasion wear.",
    };
  }

  return {
    title: `${product.name} | AVSARAA · Wear The Moment`,
    description: product.description || "Handcrafted Indian luxury couture and sarees.",
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

export default async function ProductSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const product =
    (await fetchProductById(slug)) ||
    SEED_CATALOG_PRODUCTS.find(
      (p) =>
        p.id === slug ||
        p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
    );

  if (!product) {
    notFound();
  }

  // Canonical redirect if accessed via non-canonical slug
  if (product.id === slug) {
    redirect(`/products/${product.id}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url,
    description: product.description || "Handcrafted Indian luxury couture and sarees from Surat atelier.",
    brand: {
      "@type": "Brand",
      name: "AVSARAA",
    },
    offers: {
      "@type": "Offer",
      url: `https://avsaraa.com/products/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      availability:
        (product.stock_count ?? 10) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "AVSARAA Atelier",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
