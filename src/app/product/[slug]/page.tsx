import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchProductById } from "@/lib/productDetailData";
import ProductDetailClient from "@/app/products/[id]/ProductDetailClient";

export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Match by id or slugified name
  const product = await fetchProductById(slug);

  if (!product) {
    notFound();
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
  const product = await fetchProductById(slug);

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
    description: product.description || "Handcrafted Indian sarees and festive wear from Surat.",
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
