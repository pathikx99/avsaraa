import { NextResponse } from "next/server";
import { authenticateAdminRequest } from "@/lib/adminAuth";

export async function GET() {
  const auth = await authenticateAdminRequest();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const csvContent = [
    "name,category,price,mrp,stock_count,fabric,weave,available_sizes,image_url,description",
    '"Pure Katan Silk Saree","Sarees",18999,24999,8,"Pure Katan Silk","Handloom Kadhwa","Free Size (5.5m + 0.8m Blouse)","/images/saree_model_hero.jpg","Handloom silk saree draped in gold zari motifs."',
    '"Chanderi Anarkali Dress","Dresses",7499,9999,12,"Pure Chanderi Silk","Zari Weft & Handblock","S, M, L, XL","/images/occasion_festive.jpg","Flared Anarkali dress with handcrafted dupatta."',
    '"Hand-spun Linen Kurta Set","Men\'s Wear",2499,3299,15,"Pure Handloom Linen","Relaxed Kalidar","38 (S), 40 (M), 42 (L), 44 (XL)","/images/occasion_everyday.jpg","Lightweight linen kurta set with breathable silhouette."',
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="avsaraa-products-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
