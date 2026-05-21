import React from "react";
import { redirect } from "next/navigation";

import { Header } from "@/components/gewci/Header";
import { Footer } from "@/components/gewci/Footer";
import { isDomainError } from "@/lib/errors";
import { getServerContext } from "@/lib/http";
import { permissionsService } from "@/lib/services/permissions.service";

/**
 * Server-side gate for the entire `/admin/*` tree. Non-admins are
 * silently redirected to `/document-review` so they never know an admin
 * area exists. Authenticated admins fall through to the page contents.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getServerContext();
  try {
    await permissionsService.requireAdmin(ctx);
  } catch (err) {
    if (isDomainError(err) && err.code === "FORBIDDEN") {
      redirect("/document-review");
    }
    throw err;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gewci-white">
      <Header />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {children}
      </div>
      <Footer />
    </div>
  );
}
