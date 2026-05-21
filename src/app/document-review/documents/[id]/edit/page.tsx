import React from "react";
import { notFound, redirect } from "next/navigation";

import { getServerContext } from "@/lib/http";
import { documentsService } from "@/lib/services/documents.service";
import { isDomainError } from "@/lib/errors";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { DocumentEditForm } from "@/components/drr/DocumentEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getServerContext();

  let document;
  try {
    document = await documentsService.getDetailForEdit(ctx, id);
  } catch (err) {
    if (isDomainError(err)) {
      if (err.code === "NOT_FOUND") notFound();
      if (err.code === "FORBIDDEN") {
        redirect(`/document-review/documents/${id}`);
      }
    }
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 select-none">
        <Breadcrumb
          items={[
            { label: "Documents", href: "/document-review/documents" },
            {
              label: document.title,
              href: `/document-review/documents/${document.id}`,
            },
            {
              label: "Edit",
              href: `/document-review/documents/${document.id}/edit`,
            },
          ]}
        />
        <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight mt-1 truncate">
          Edit document
        </h1>
        <p className="text-xs text-gewci-dark/50">
          Changes are saved in place. Existing comments stay attached to the
          live document, but anchored annotations may drift if you change the
          text they reference.
        </p>
      </div>

      <div className="max-w-4xl">
        <DocumentEditForm document={document} />
      </div>
    </div>
  );
}
