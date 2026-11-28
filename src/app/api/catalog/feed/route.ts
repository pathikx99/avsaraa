import { NextResponse } from "next/server";
import { getPublishedCatalog } from "@/lib/serverCatalog";
import {
  buildGoogleMetaXmlFeed,
  buildMarketplaceCsvExport,
  buildMetaGoogleCsvFeed,
} from "@/lib/catalogFeed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const channel = (searchParams.get("channel") || "").trim().toLowerCase();
    const format = (searchParams.get("format") || "xml").trim().toLowerCase();

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || origin || "https://avsaraa.in").replace(/\/+$/, "");
    const products = await getPublishedCatalog();

    if (channel === "amazon" || channel === "myntra" || channel === "ajio") {
      const csv = buildMarketplaceCsvExport(products, siteUrl, channel);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="avsaraa-${channel}-catalog.csv"`,
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    if (format === "csv" || channel === "meta-csv" || channel === "google-csv") {
      const csv = buildMetaGoogleCsvFeed(products, siteUrl);
      const isDownload = searchParams.get("download") === "1";
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          ...(isDownload ? { "Content-Disposition": 'attachment; filename="avsaraa-meta-google-catalog.csv"' } : {}),
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    const xml = buildGoogleMetaXmlFeed(products, siteUrl);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate product catalog feed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
