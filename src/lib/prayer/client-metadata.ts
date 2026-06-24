import type { PrayerRequestClientMetadata } from "@/lib/types";

function firstHeader(
  request: Request,
  names: string[],
): string | null {
  for (const name of names) {
    const value = request.headers.get(name)?.trim();
    if (value) return value;
  }
  return null;
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return firstHeader(request, ["x-real-ip", "cf-connecting-ip"]);
}

type DeviceType = PrayerRequestClientMetadata["device_type"];

function parseUserAgent(userAgent: string | null): {
  browser: string | null;
  os: string | null;
  device_type: DeviceType;
} {
  if (!userAgent) {
    return { browser: null, os: null, device_type: "unknown" };
  }

  let browser: string | null = null;
  const edge = userAgent.match(/\bEdg\/(\d+)/);
  const firefox = userAgent.match(/\bFirefox\/(\d+)/);
  const chrome = userAgent.match(/\bChrome\/(\d+)/);
  const safari = userAgent.match(/\bVersion\/(\d+).+Safari/);

  if (edge) browser = `Edge ${edge[1]}`;
  else if (firefox) browser = `Firefox ${firefox[1]}`;
  else if (chrome) browser = `Chrome ${chrome[1]}`;
  else if (safari) browser = `Safari ${safari[1]}`;
  else if (userAgent.includes("Safari")) browser = "Safari";

  let os: string | null = null;
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";
  else if (userAgent.includes("Linux")) os = "Linux";

  let device_type: DeviceType = "desktop";
  if (/iPad|Tablet/i.test(userAgent)) device_type = "tablet";
  else if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) device_type = "mobile";

  return { browser, os, device_type };
}

export function collectPrayerRequestClientMetadata(
  request: Request,
  timezone?: string,
): PrayerRequestClientMetadata {
  const user_agent = request.headers.get("user-agent");
  const parsed = parseUserAgent(user_agent);

  return {
    ip: clientIp(request),
    user_agent,
    browser: parsed.browser,
    os: parsed.os,
    device_type: parsed.device_type,
    accept_language: request.headers.get("accept-language"),
    referer: request.headers.get("referer"),
    timezone: timezone?.trim() || null,
  };
}
