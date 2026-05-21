import React from "react";

interface DocumentReviewLogoProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

/**
 * Inline brand mark for the Document Review Room.
 * Renders as an SVG so it scales crisply at any size and can be coloured /
 * sized purely via Tailwind utility classes on the wrapping element.
 *
 * The same artwork ships at `public/document-review-logo.svg` (OG / emails)
 * and `src/app/icon.svg` (browser favicon via the Next.js icon convention).
 */
export function DocumentReviewLogo({
  title = "GEWCI Document Review Room",
  ...props
}: DocumentReviewLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      {/* Document body */}
      <path
        d="M14 6 H38 L54 22 V52 A6 6 0 0 1 48 58 H14 A6 6 0 0 1 8 52 V12 A6 6 0 0 1 14 6 Z"
        fill="#1E3461"
      />
      {/* Folded corner */}
      <path
        d="M38 6 L54 22 H42 A4 4 0 0 1 38 18 V6 Z"
        fill="#2b467d"
      />
      {/* Text lines inside the document */}
      <rect x="16" y="28" width="24" height="3" rx="1.5" fill="#FEFEFE" fillOpacity="0.85" />
      <rect x="16" y="34" width="28" height="3" rx="1.5" fill="#FEFEFE" fillOpacity="0.85" />
      <rect x="16" y="40" width="18" height="3" rx="1.5" fill="#FEFEFE" fillOpacity="0.85" />
      {/* Gold review badge with checkmark */}
      <circle cx="48" cy="50" r="13" fill="#DBB64B" stroke="#FEFEFE" strokeWidth="2" />
      <path
        d="M42 50 L46.5 54.5 L54 47"
        stroke="#0A193C"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
