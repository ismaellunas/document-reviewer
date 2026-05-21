import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { DocumentEditForm } from "@/components/drr/DocumentEditForm";
import type { DRRDocument } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: document, error: docError } = await supabase
    .from("drr_documents")
    .select("*")
    .eq("id", id)
    .single<DRRDocument>();

  if (docError || !document) {
    console.error("Edit page document load failed:", { id, docError });
    notFound();
  }

  // Same permission rule as the PUT API: admin, editor, or owner.
  const { data: viewerProfile } = await supabase
    .from("gewci_users")
    .select("roles")
    .eq("id", user.id)
    .single<{ roles: string[] | null }>();
  const roles = viewerProfile?.roles ?? [];
  const canEdit =
    roles.includes("document-review:admin") ||
    roles.includes("document-review:editor") ||
    document.created_by === user.id;

  if (!canEdit) {
    redirect(`/document-review/documents/${id}`);
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
