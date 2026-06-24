const DEFAULT_PRODUCTION_SITE_URL = "https://gewci-ministry-tools.vercel.app";

/**
 * Canonical public site URL for metadata and Open Graph assets.
 * Preview deployments are often SSO-protected, so crawlers cannot fetch
 * images from VERCEL_URL — always prefer NEXT_PUBLIC_SITE_URL or production.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return DEFAULT_PRODUCTION_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
