import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductById, SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import ProductDetailClient from "./ProductDetailClient";

export async function generateStaticParams() {
  return SEED_CATALOG_PRODUCTS.map((p) => ({
    id: p.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | AVSARAA",
      description: "Handcrafted Indian luxury fashion and occasion wear.",
    };
  }

  return {
    title: `${product.name} | AVSARAA · Wear The Moment`,
    description: product.description || "Handcrafted Indian luxury fashion, sarees, and occasion silhouettes from Surat.",
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
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
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

