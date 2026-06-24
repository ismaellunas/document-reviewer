import React from "react";
import { LibraryHeader } from "@/components/library/LibraryHeader";
import { Footer } from "@/components/gewci/Footer";

// Library shell reads auth state via Supabase; skip static prerender at build.
export const dynamic = "force-dynamic";

export default function LibraryLayout({
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
