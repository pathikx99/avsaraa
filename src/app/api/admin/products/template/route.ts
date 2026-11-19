import { NextResponse } from "next/server";
import { authenticateAdminRequest } from "@/lib/adminAuth";

export async function GET() {
  const auth = await authenticateAdminRequest();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const csvContent = [
    "name,category,price,mrp,stock_count,fabric,weave,available_sizes,image_url,description",
    '"Virasat Pure Katan Silk Saree","Sarees",18999,24999,8,"Pure Katan Silk","Handloom Banarasi Kadhwa","Free Size (5.5m + 0.8m Blouse)","https://aqpkagsbaecavoznnrlj.supabase.co/storage/v1/object/public/items/products/e2000000-0000-0000-0000-000000000001/hero.webp","Heirloom hand-spun Banarasi silk draped in antique gold zari with artisanal border highlights."',
    '"Gulmohar Chanderi Anarkali Set","Dresses",7499,9999,12,"Pure Chanderi Silk","Zari Weft & Handblock","S, M, L, XL","https://aqpkagsbaecavoznnrlj.supabase.co/storage/v1/object/public/items/products/e2000000-0000-0000-0000-000000000003/hero.webp","Regal 4.5m flared Anarkali ensemble with handcrafted organza dupatta and scalloped borders."',
    '"Noor Hand-spun Linen Kurta","Kurtas",1199,1799,15,"Pure Handloom Linen","Relaxed Kalidar","38 (S), 40 (M), 42 (L), 44 (XL)","https://aqpkagsbaecavoznnrlj.supabase.co/storage/v1/object/public/items/products/e2000000-0000-0000-0000-000000000002/hero.webp","Lightweight daily wear linen kurta featuring natural mother-of-pearl buttons and breathable silhouette."',
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
