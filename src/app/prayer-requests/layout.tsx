import React from "react";
import type { Metadata } from "next";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { Footer } from "@/components/gewci/Footer";
import { PRODUCTION_SITE_URL } from "@/lib/config/site";

// Static shell: avoids runtime metadata rewriting to VERCEL_URL on preview deployments.
export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_URL),
};

export default function PrayerRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gewci-white">
      <LibraryHeader />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </div>
      <Footer />
    </div>
  );
}
