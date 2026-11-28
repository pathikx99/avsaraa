import type { MetadataRoute } from "next";
import { getPublishedCatalog } from "@/lib/serverCatalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://avsaraa.in").replace(/\/+$/, "");

  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/products", changeFrequency: "daily", priority: 0.9 },
    { path: "/shop", changeFrequency: "daily", priority: 0.9 },
    { path: "/collection", changeFrequency: "weekly", priority: 0.8 },
    { path: "/under-1299", changeFrequency: "weekly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
    { path: "/track", changeFrequency: "monthly", priority: 0.5 },
    { path: "/policies", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
    { path: "/shipping", changeFrequency: "monthly", priority: 0.4 },
    { path: "/returns", changeFrequency: "monthly", priority: 0.4 },
    { path: "/b2b", changeFrequency: "monthly", priority: 0.5 },
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const products = await getPublishedCatalog();
    for (const product of products) {
      if (!product?.id) continue;
      entries.push({
        url: `${siteUrl}/products/${product.id}`,
        lastModified: product.created_at ? new Date(product.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Return static entries if catalog fetch fails
  }

  return entries;
}
