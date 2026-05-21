import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User as UserIcon, Pencil } from "lucide-react";

import { getServerContext } from "@/lib/http";
import { documentsService } from "@/lib/services/documents.service";
import { isDomainError } from "@/lib/errors";
import { Avatar } from "@/components/gewci/Avatar";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { Button } from "@/components/gewci/Button";
import { DocumentStatusBadge } from "@/components/drr/DocumentStatusBadge";
import { DocumentDetailClient } from "@/components/drr/DocumentDetailClient";
import { DocumentDeleteButton } from "@/components/drr/DocumentDeleteButton";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getServerContext();

  let document;
  let comments;
  let viewerCapabilities;
  try {
    ({ document, comments, viewerCapabilities } =
      await documentsService.getDetail(ctx, id));
  } catch (err) {
    if (isDomainError(err) && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const creatorName = document.creator?.display_name || "Unknown Author";
  const { canEdit, canDelete } = viewerCapabilities;

  return (
    <div className="space-y-6">
      <div className="space-y-3 select-none">
        <Breadcrumb
          items={[
            { label: "Documents", href: "/document-review/documents" },
            {
              label: document.title,
              href: `/document-review/documents/${document.id}`,
            },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gewci-dark font-heading tracking-tight truncate">
              {document.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gewci-dark/60">
              <DocumentStatusBadge status={document.status} />
              <span className="inline-flex items-center gap-1.5">
                <Avatar
                  src={document.creator?.avatar_url}
                  name={creatorName}
                  email={document.creator?.email}
                  size="sm"
                  className="h-5 w-5"
                />
                <UserIcon className="h-3 w-3" />
                <span className="font-semibold">{creatorName}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                Updated {formatDate(document.updated_at || document.created_at)}
              </span>
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <Link href={`/document-review/documents/${document.id}/edit`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>
                </Link>
              )}
              {canDelete && (
                <DocumentDeleteButton
                  documentId={document.id}
                  documentTitle={document.title}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <DocumentDetailClient
        document={document}
        initialComments={comments}
        currentUser={ctx.user}
      />
    </div>
  );
}
