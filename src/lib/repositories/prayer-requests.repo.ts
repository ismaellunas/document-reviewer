import type { SupabaseClient } from "@supabase/supabase-js";

import type { PrayerRequest, PrayerRequestStatus } from "@/lib/types";

export interface PrayerRequestInsertInput {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  body: string;
  wants_pray_with: boolean;
  contact_via_email: boolean;
}

export interface PrayerRequestListFilters {
  status?: PrayerRequestStatus | "all";
  from?: string;
  to?: string;
}

export const prayerRequestsRepo = {
  async create(
    supabase: SupabaseClient,
    input: PrayerRequestInsertInput,
  ): Promise<PrayerRequest> {
    const id = crypto.randomUUID();
    const row = {
      id,
      first_name: input.first_name,
      last_name: input.last_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      body: input.body,
      wants_pray_with: input.wants_pray_with,
      contact_via_email: input.contact_via_email,
      status: "pending" as const,
      prayed_at: null,
    };

    // Do not chain .select() here: anonymous users may INSERT but cannot SELECT
    // (admin-only read policy). PostgREST RETURNING would fail RLS.
    const { error } = await supabase.from("prayer_requests").insert(row);

    if (error) {
      throw new Error(`prayerRequestsRepo.create: ${error.message}`);
    }

    return {
      ...row,
      created_at: new Date().toISOString(),
    };
  },

  async list(
    supabase: SupabaseClient,
    filters: PrayerRequestListFilters = {},
  ): Promise<PrayerRequest[]> {
    let query = supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.from) {
      query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
    }

    if (filters.to) {
      query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
    }

    const { data, error } = await query.returns<PrayerRequest[]>();
    if (error) {
      throw new Error(`prayerRequestsRepo.list: ${error.message}`);
    }
    return data ?? [];
  },

  async markPrayed(
    supabase: SupabaseClient,
    ids: string[],
  ): Promise<number> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("prayer_requests")
      .update({ status: "prayed", prayed_at: now })
      .in("id", ids)
      .eq("status", "pending")
      .select("id");

    if (error) {
      throw new Error(`prayerRequestsRepo.markPrayed: ${error.message}`);
    }
    return data?.length ?? 0;
  },

  async deleteByIds(
    supabase: SupabaseClient,
    ids: string[],
  ): Promise<number> {
    const { data, error } = await supabase
      .from("prayer_requests")
      .delete()
      .in("id", ids)
      .select("id");

    if (error) {
      throw new Error(`prayerRequestsRepo.deleteByIds: ${error.message}`);
    }
    return data?.length ?? 0;
  },
};
