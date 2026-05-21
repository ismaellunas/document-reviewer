import React from "react";
import { Code2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Inline Facebook glyph -- the bundled lucide-react version (1.16.0)
 * intentionally omits brand icons, so we ship the path locally. Sized
 * via parent classes (h-* w-*) just like a lucide icon.
 */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

interface SiteCreditsProps {
  /**
   * `dark`  -- on dark backgrounds (e.g. the global footer)
   * `light` -- on light backgrounds (e.g. the login page)
   * Defaults to `light`.
   */
  variant?: "dark" | "light";
  className?: string;
}

const CHURCH_FACEBOOK = "https://www.facebook.com/greatemmanuel.worshipchurch/";
const DEVELOPER_FACEBOOK = "https://www.facebook.com/ElCajoOfficial";

/**
 * Shared ownership credit block: GEWCI Facebook link + developer credit
 * link + copyright line. Rendered in the global footer and on the login
 * page so the ownership statement is visible regardless of auth state.
 */
export function SiteCredits({ variant = "light", className }: SiteCreditsProps) {
  const currentYear = new Date().getFullYear();

  const isDark = variant === "dark";
  const linkClass = cn(
    "p-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    isDark
      ? "text-gewci-white/60 hover:text-gewci-gold focus-visible:ring-gewci-gold/40 focus-visible:ring-offset-gewci-dark"
      : "text-gewci-dark/40 hover:text-primary focus-visible:ring-primary/30 focus-visible:ring-offset-gewci-white",
  );
  const textClass = cn(
    "text-[10px] leading-normal text-center max-w-sm",
    isDark ? "text-gewci-white/50" : "text-gewci-dark/45",
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 select-none",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <a
          href={CHURCH_FACEBOOK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Great Emmanuel Worship Church on Facebook"
          title="Great Emmanuel Worship Church on Facebook"
          className={linkClass}
        >
          <FacebookIcon className="h-4 w-4" />
        </a>
        <a
          href={DEVELOPER_FACEBOOK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the developer's Facebook page"
          title="Developer"
          className={linkClass}
        >
          <Code2 className="h-4 w-4" />
        </a>
      </div>

      <p className={textClass}>
        &copy; {currentYear}{" "}
        <span className="font-bold">GEWCI</span> (Great Emmanuel Worship Church
        Inc.). This tool is owned by the church and all rights are reserved to
        the owner.
      </p>
    </div>
  );
}
