/** Canonical production origin for public links and social previews. */
export const PRODUCTION_SITE_URL = "https://gewci-ministry-tools.vercel.app";

function isPreviewDeploymentHost(hostname: string): boolean {
  // e.g. gewci-ministry-tools-qsrr16vop-ismaellunas-projects.vercel.app
  return /-[a-z0-9]+-[\w-]+\.vercel\.app$/i.test(hostname);
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Canonical public site URL for metadata and Open Graph assets.
 * Preview deployment hosts are never used — crawlers cannot fetch SSO-protected assets.
 */
export function getSiteUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /^https?:\/\//,
    "",
  );
  if (vercelProduction) {
    return `https://${vercelProduction}`;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    const host = hostFromUrl(configured);
    if (host && !isPreviewDeploymentHost(host)) {
      return configured;
    }
  }

  return PRODUCTION_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/** Fixed production URL for OG images — not rewritten at runtime. */
export const PRAYER_OG_IMAGE_URL = `${PRODUCTION_SITE_URL}/prayer-thumb-wide.png`;
