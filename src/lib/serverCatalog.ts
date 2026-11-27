import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizeProducts } from "@/lib/productUtils";
import { Product } from "@/types/product";
import { sortProductsByShowcase } from "@/lib/showcaseOrderManager";

/**
 * Fetches published catalog products directly on the server for SSR/ISR pages.
 * Returns [] when the store catalog has no published products or is unreachable.
 */
export async function getPublishedCatalog(): Promise<Product[]> {
  try {
    const supabaseAdmin = getAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    const publishedOnly = data.filter((p) => {
      const status = (p as { publish_status?: string | null }).publish_status;
      return !status || status === "published";
    });

    return normalizeProducts(publishedOnly);
  } catch {
    return [];
  }
}

export async function getHomeShowcaseSlices(): Promise<{
  newArrivals: Product[];
  bestsellers: Product[];
}> {
  const all = await getPublishedCatalog();
  const newArrivals = [...all]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  const bestsellers = sortProductsByShowcase([...all])
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    .slice(0, 8);

  return { newArrivals, bestsellers };
}
