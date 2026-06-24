"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";
import { AutoSaveStatus } from "@/components/drr/AutoSaveStatus";
import { DocumentEditorWorkspace } from "@/components/drr/DocumentEditorWorkspace";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import type { DocumentStatus, DRRDocument } from "@/lib/types";

interface DocumentEditFormProps {
  document: DRRDocument;
}

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: "draft", label: "Draft (private, hidden from reviewers)" },
  { value: "in_review", label: "In Review (open for reviewer annotations)" },
  { value: "needs_revision", label: "Needs Revision (returned to author)" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/**
 * Edit form for an existing document. Pre-fills from the passed document,
 * PUTs through /api/v1/documents/[id] which handles permission checks +
 * audit logging server-side. Auto-saves debounced changes in the background.
 */
export function DocumentEditForm({ document }: DocumentEditFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(document.title);
  const [content, setContent] = React.useState(document.content ?? "");
  const [status, setStatus] = React.useState<DocumentStatus>(document.status);
  const [savedSnapshot, setSavedSnapshot] = React.useState({
    title: document.title,
    content: document.content ?? "",
    status: document.status,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    title?: string;
    content?: string;
  }>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    autoSaveStatus,
    autoSaveError,
    lastSavedAt,
    isDirty,
    canAutoSave,
  } = useDocumentAutoSave({
    documentId: document.id,
    title,
    content,
    status,
    savedSnapshot,
    onSaved: setSavedSnapshot,
  });

  const validate = () => {
    const next: typeof errors = {};
    if (!title.trim()) {
      next.title = "Title is required";
    } else if (title.length > 500) {
      next.title = "Title must be less than 500 characters";
    }
    if (!content.trim()) {
      next.content = "Document content is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveDocument = async () => {
    const payload = {
      title: title.trim(),
      content,
      status,
    };

    const res = await fetch(`/api/v1/documents/${document.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? `Update failed (${res.status})`);
    }

    setSavedSnapshot(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    if (!isDirty) {
      router.push(`/document-review/documents/${document.id}`);
      return;
    }

    setIsLoading(true);
    try {
      await saveDocument();

      router.push(`/document-review/documents/${document.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to save changes.",
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-end">
        <AutoSaveStatus
          status={autoSaveStatus}
          error={autoSaveError}
          lastSavedAt={lastSavedAt}
          isDirty={isDirty}
          canAutoSave={canAutoSave}
        />
      </div>

      <Card className="border border-gewci-gray/20">
        <CardContent className="p-6">
          <DocumentEditorWorkspace
            title={title}
            onTitleChange={setTitle}
            onContentChange={setContent}
            status={status}
            onStatusChange={setStatus}
            statusOptions={STATUS_OPTIONS}
            initialMarkdown={document.content ?? ""}
            editorKey={document.id}
            titleError={errors.title}
            contentError={errors.content}
            disabled={isLoading}
            editorPlaceholder="Edit your document. Switch to source mode in the toolbar to view raw markdown."
            autoSaveStatus={autoSaveStatus}
            autoSaveError={autoSaveError}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
            canAutoSave={canAutoSave}
          />
        </CardContent>
      </Card>

      {submitError && (
        <div className="flex items-start gap-3 rounded-[--radius-card] bg-error/5 border border-error/20 p-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-error" />
          <p className="text-xs text-error/90 leading-relaxed">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/document-review/documents/${document.id}`)}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Button>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isDirty && autoSaveStatus !== "pending"}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          <span>
            {isDirty || autoSaveStatus === "pending"
              ? "Done"
              : "No changes"}
          </span>
        </Button>
      </div>
    </form>
  );
}
