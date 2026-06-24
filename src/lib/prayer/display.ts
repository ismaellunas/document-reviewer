import type { PrayerRequest, PrayerRequestClientMetadata } from "@/lib/types";

export function prayerRequestDisplayName(
  request: Pick<PrayerRequest, "first_name" | "last_name">,
): string {
  return [request.first_name, request.last_name].filter(Boolean).join(" ");
}

const METADATA_LABELS: Record<keyof PrayerRequestClientMetadata, string> = {
  ip: "IP address",
  user_agent: "User agent",
  browser: "Browser",
  os: "Operating system",
  device_type: "Device type",
  accept_language: "Language",
  referer: "Referrer",
  timezone: "Timezone",
};

export function formatPrayerRequestMetadata(
  metadata: PrayerRequestClientMetadata | null | undefined,
): { label: string; value: string }[] {
  if (!metadata) return [];

  return (Object.keys(METADATA_LABELS) as (keyof PrayerRequestClientMetadata)[])
    .map((key) => {
      const value = metadata[key];
      if (value == null || value === "") return null;
      return {
        label: METADATA_LABELS[key],
        value: String(value),
      };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}

export function hasPrayerRequestMetadata(
  metadata: PrayerRequestClientMetadata | null | undefined,
): boolean {
  return formatPrayerRequestMetadata(metadata).length > 0;
}
