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

  return <ProductDetailClient initialProduct={product} />;
}

