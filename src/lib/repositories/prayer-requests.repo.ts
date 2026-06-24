import type { SupabaseClient } from "@supabase/supabase-js";

import type { PrayerRequest, PrayerRequestClientMetadata, PrayerRequestStatus } from "@/lib/types";

export interface PrayerRequestInsertInput {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  body: string;
  wants_pray_with: boolean;
  contact_via_email: boolean;
  is_anonymous: boolean;
  client_metadata: PrayerRequestClientMetadata;
}

export interface PrayerRequestListFilters {
  status?: PrayerRequestStatus | "all";
  from?: string;
  to?: string;
}

const EMPTY_CLIENT_METADATA: PrayerRequestClientMetadata = {
  ip: null,
  user_agent: null,
  browser: null,
  os: null,
  device_type: "unknown",
  accept_language: null,
  referer: null,
  timezone: null,
};

function normalizeClientMetadata(raw: unknown): PrayerRequestClientMetadata {
  if (!raw || typeof raw !== "object") return EMPTY_CLIENT_METADATA;
  const obj = raw as Record<string, unknown>;
  const device = obj.device_type;
  const device_type =
    device === "desktop" ||
    device === "mobile" ||
    device === "tablet" ||
    device === "unknown"
      ? device
      : "unknown";

  return {
    ip: typeof obj.ip === "string" ? obj.ip : null,
    user_agent: typeof obj.user_agent === "string" ? obj.user_agent : null,
    browser: typeof obj.browser === "string" ? obj.browser : null,
    os: typeof obj.os === "string" ? obj.os : null,
    device_type,
    accept_language:
      typeof obj.accept_language === "string" ? obj.accept_language : null,
    referer: typeof obj.referer === "string" ? obj.referer : null,
    timezone: typeof obj.timezone === "string" ? obj.timezone : null,
  };
}

function normalizePrayerRequest(row: PrayerRequest): PrayerRequest {
  return {
    ...row,
    is_anonymous: row.is_anonymous ?? false,
    client_metadata: normalizeClientMetadata(row.client_metadata),
  };
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
      is_anonymous: input.is_anonymous,
      client_metadata: input.client_metadata,
      status: "pending" as const,
      prayed_at: null,
    };

    // Do not chain .select() here: anonymous users may INSERT but cannot SELECT
    // (admin-only read policy). PostgREST RETURNING would fail RLS.
    const { error } = await supabase.from("prayer_requests").insert(row);

    if (error) {
      throw new Error(`prayerRequestsRepo.create: ${error.message}`);
    }

    return normalizePrayerRequest({
      ...row,
      created_at: new Date().toISOString(),
    });
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
    return (data ?? []).map(normalizePrayerRequest);
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
