import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";

import { documentsService } from "@/lib/services/documents.service";
import { isDomainError } from "@/lib/errors";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { DocumentReader } from "@/components/drr/DocumentReader";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicDocumentPage({ params }: PageProps) {
  const { id } = await params;

  let document;
  try {
    document = await documentsService.getPublicLibraryDocument(id);
  } catch (err) {
    if (isDomainError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 select-none">
        <Breadcrumb
          items={[
            { label: "Library", href: "/" },
            { label: document.title, href: `/documents/${document.id}` },
          ]}
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              Approved
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gewci-dark/60">
              <Calendar className="h-3 w-3" />
              Updated {formatDate(document.updated_at || document.created_at)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gewci-dark font-heading tracking-tight">
            {document.title}
          </h1>

          <p className="text-sm text-gewci-dark/55">
            This is a published ministry document.{" "}
            <Link
              href="/login?redirectTo=/document-review"
              className="font-semibold text-primary hover:text-primary-light transition-colors"
            >
              Sign in
            </Link>{" "}
            to access the review room and commenting tools.
          </p>
        </div>
      </div>

      <article className="bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-xs p-6 sm:p-8 min-w-0">
        <DocumentReader doc={document} />
      </article>
    </div>
  );
}
