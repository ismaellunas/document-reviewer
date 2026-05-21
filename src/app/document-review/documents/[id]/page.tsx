import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, User as UserIcon, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/gewci/Avatar";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { Button } from "@/components/gewci/Button";
import { DocumentStatusBadge } from "@/components/drr/DocumentStatusBadge";
import { DocumentDetailClient } from "@/components/drr/DocumentDetailClient";
import { DocumentDeleteButton } from "@/components/drr/DocumentDeleteButton";
import { formatDate } from "@/lib/utils";
import type { DRRComment, DRRDocument } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Document with creator metadata
  const { data: document, error: docError } = await supabase
    .from("drr_documents")
    .select(
      `
      *,
      creator:gewci_users!drr_documents_created_by_fkey (
        id,
        email,
        display_name,
        avatar_url,
        roles
      )
    `,
    )
    .eq("id", id)
    .single<DRRDocument>();

  if (docError || !document) {
    console.error("Document detail load failed:", { id, docError });
    notFound();
  }

  // Comments with author metadata, ordered oldest first.
  const { data: commentsRaw, error: commentsError } = await supabase
    .from("drr_comments")
    .select(
      `
      *,
      user:gewci_users!drr_comments_user_id_fkey (
        id,
        email,
        display_name,
        avatar_url,
        roles
      )
    `,
    )
    .eq("document_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("Failed to load comments for document:", { id, commentsError });
  }

  const comments: DRRComment[] = (commentsRaw ?? []) as DRRComment[];

  const creatorName = document.creator?.display_name || "Unknown Author";

  // Resolve edit + delete permission server-side so the controls never leak
  // to viewers who lack the ability -- both mirror their API route checks.
  const { data: viewerProfile } = await supabase
    .from("gewci_users")
    .select("roles")
    .eq("id", user.id)
    .single<{ roles: string[] | null }>();
  const viewerRoles = viewerProfile?.roles ?? [];
  const isAdmin = viewerRoles.includes("document-review:admin");
  const isEditor = viewerRoles.includes("document-review:editor");
  const isOwner = document.created_by === user.id;
  const canEdit = isAdmin || isEditor || isOwner;
  const canDelete = isAdmin || isOwner;

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
        currentUser={user}
      />
    </div>
  );
}
