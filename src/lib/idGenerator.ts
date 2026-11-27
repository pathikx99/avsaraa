/**
 * Systematic, Sequential & Chronological Business ID Generators
 *
 * Order Number format: AVS-YYYYMMDD-00001 (IST date + 5-digit zero-padded sequence)
 * Product SKU format:  AVS-<CAT>-YYMM-0001 (Category code + YYMM + 4-digit zero-padded sequence)
 */

export const CATEGORY_SKU_CODES: Record<string, string> = {
  Sarees: "SAR",
  Dresses: "DRS",
  "Co-ords": "CRD",
  "Men's Wear": "MEN",
  "New Arrivals": "NEW",
  "Occasion Wear": "OCC",
};

interface SupabaseLikeQuery {
  rpc?: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (cols: string, opts?: { count?: "exact"; head?: boolean }) => {
      order?: (col: string, opts?: { ascending?: boolean }) => {
        limit?: (n: number) => PromiseLike<{ data: Array<Record<string, unknown>> | null; count?: number | null; error: unknown }>;
      };
      limit?: (n: number) => PromiseLike<{ data: Array<Record<string, unknown>> | null; error: unknown }>;
    };
  };
}

function getIstDateParts(date: Date = new Date()): {
  year: string;
  yy: string;
  month: string;
  day: string;
} {
  const istStr = date.toLocaleString("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA produces "YYYY-MM-DD"
  const [year, month, day] = istStr.split("-");
  return {
    year: year || String(date.getFullYear()),
    yy: (year || String(date.getFullYear())).slice(-2),
    month: month || String(date.getMonth() + 1).padStart(2, "0"),
    day: day || String(date.getDate()).padStart(2, "0"),
  };
}

/**
 * Formats an order number deterministically: AVS-YYYYMMDD-00001
 */
export function formatOrderNumber(sequenceNumber: number, date: Date = new Date()): string {
  const { year, month, day } = getIstDateParts(date);
  const seqStr = String(Math.max(1, Math.floor(sequenceNumber))).padStart(5, "0");
  return `AVS-${year}${month}${day}-${seqStr}`;
}

/**
 * Formats a product SKU deterministically: AVS-<CAT>-YYMM-0001
 */
export function formatProductSku(
  category: string,
  sequenceNumber: number,
  date: Date = new Date()
): string {
  const { yy, month } = getIstDateParts(date);
  const catCode = CATEGORY_SKU_CODES[category] || "PRD";
  const seqStr = String(Math.max(1, Math.floor(sequenceNumber))).padStart(4, "0");
  return `AVS-${catCode}-${yy}${month}-${seqStr}`;
}

/**
 * Derives a clean GST Tax Invoice number from an order number (e.g. INV-2026-00001).
 */
export function formatInvoiceNumber(orderNumber?: string | null, createdAt?: string | null): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const safeOrder = String(orderNumber || "").trim();
  const seqMatch = safeOrder.match(/-(\d+)$/);
  if (seqMatch) {
    return `INV-${year}-${seqMatch[1]}`;
  }
  const alnum = safeOrder.replace(/[^A-Za-z0-9]/g, "");
  return `INV-${year}-${alnum.slice(-5) || "00001"}`;
}

/**
 * Extracts trailing numeric sequence from strings like "AVS-20261127-00001" or "AVS-SAR-2611-0001".
 */
export function extractTrailingSequence(code?: string | null): number {
  if (!code || typeof code !== "string") return 0;
  const match = code.trim().match(/-(\d+)$/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Generates the next sequential, chronological Order Number (AVS-YYYYMMDD-00001).
 * Uses atomic Postgres RPC `next_order_number()` when available, and safely falls back
 * to scanning existing `orders` counts + trailing sequences when migrating live schemas.
 */
export async function generateSequentialOrderNumber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  date: Date = new Date()
): Promise<string> {
  const client = adminClient as SupabaseLikeQuery | null | undefined;
  try {
    if (client && typeof client.rpc === "function") {
      const { data, error } = await client.rpc("next_order_number");
      if (!error && typeof data === "string" && /^AVS-\d{8}-\d{5,}$/.test(data)) {
        return data;
      }
    }
  } catch {
    // RPC not installed yet; inspect table sequences directly
  }

  let nextSeq = 1;
  try {
    if (client) {
      const res = await client
        .from("orders")
        .select("order_number", { count: "exact" })
        .order?.("created_at", { ascending: false })
        .limit?.(50);

      const count = typeof res?.count === "number" ? res.count : 0;
      const rows = Array.isArray(res?.data) ? res.data : [];
      let maxSeq = 0;
      for (const row of rows) {
        const seq = extractTrailingSequence(row.order_number as string | undefined);
        if (seq > maxSeq) maxSeq = seq;
      }
      nextSeq = Math.max(maxSeq, count) + 1;
    }
  } catch {
    nextSeq = 1;
  }

  return formatOrderNumber(nextSeq, date);
}

/**
 * Generates sequential, chronological Product SKUs (AVS-<CAT>-YYMM-0001) for a batch of products.
 * Preserves any explicit admin-entered SKU, while auto-generating consecutive SKUs for empty entries.
 */
export async function generateSequentialProductSkus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  categories: Array<{ category: string; explicitSku?: string | null }>,
  date: Date = new Date()
): Promise<string[]> {
  const results: string[] = [];
  const client = adminClient as SupabaseLikeQuery | null | undefined;

  // Determine starting fallback sequence once for batch consistency
  let fallbackNextSeq: number | null = null;
  const resolveNextSeq = async (): Promise<number> => {
    if (fallbackNextSeq !== null) {
      const current = fallbackNextSeq;
      fallbackNextSeq += 1;
      return current;
    }
    let nextSeq = 1;
    try {
      if (client) {
        const res = await client
          .from("products")
          .select("specifications", { count: "exact" })
          .order?.("created_at", { ascending: false })
          .limit?.(100);

        const count = typeof res?.count === "number" ? res.count : 0;
        const rows = Array.isArray(res?.data) ? res.data : [];
        let maxSeq = 0;
        for (const row of rows) {
          const specs = row.specifications as Record<string, unknown> | null | undefined;
          const sku = (row.sku as string | undefined) || (specs?.sku as string | undefined);
          const seq = extractTrailingSequence(sku);
          if (seq > maxSeq) maxSeq = seq;
        }
        nextSeq = Math.max(maxSeq, count) + 1;
      }
    } catch {
      nextSeq = 1;
    }
    fallbackNextSeq = nextSeq + 1;
    return nextSeq;
  };

  for (const item of categories) {
    const cleanExplicit = typeof item.explicitSku === "string" ? item.explicitSku.trim() : "";
    if (cleanExplicit) {
      results.push(cleanExplicit);
      continue;
    }

    let generated: string | null = null;
    try {
      if (client && typeof client.rpc === "function") {
        const { data, error } = await client.rpc("next_product_sku", { p_category: item.category });
        if (!error && typeof data === "string" && /^AVS-[A-Z]{3}-\d{4}-\d{4,}$/.test(data)) {
          generated = data;
        }
      }
    } catch {
      // RPC not installed yet; use sequential table scan fallback
    }

    if (!generated) {
      const seq = await resolveNextSeq();
      generated = formatProductSku(item.category, seq, date);
    }

    results.push(generated);
  }

  return results;
}
