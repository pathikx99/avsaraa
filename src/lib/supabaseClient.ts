import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
