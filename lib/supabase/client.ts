import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 未配置：请设置环境变量后启用云端功能。");
  }
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
