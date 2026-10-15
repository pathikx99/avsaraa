import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://slovsjusigggadxxkgcs.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_TM_iuGMbcMcqHEeRPNET9A_cTwB8lfv";

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
