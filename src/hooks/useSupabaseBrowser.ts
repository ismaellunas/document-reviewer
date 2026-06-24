"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Lazily creates a browser Supabase client on first use. Avoids calling
 * createClient() during static prerender / SSR where env vars may be absent.
 */
export function useSupabaseBrowser() {
  const clientRef = useRef<SupabaseClient | null>(null);

  return useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = createClient();
    }
    return clientRef.current;
  }, []);
}
