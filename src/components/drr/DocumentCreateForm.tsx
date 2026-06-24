"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";
import { AutoSaveStatus } from "@/components/drr/AutoSaveStatus";
import { DocumentEditorWorkspace } from "@/components/drr/DocumentEditorWorkspace";
import { useDocumentAutoSave } from "@/hooks/useDocumentAutoSave";
import type { DocumentStatus } from "@/lib/types";

const CREATE_STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: "draft", label: "Draft (Private or hidden from reviewers)" },
  { value: "in_review", label: "In Review (Ready for reviewer annotations)" },
];

export function DocumentCreateForm() {
  const router = useRouter();

  const [documentId, setDocumentId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState<DocumentStatus>("draft");
  const [savedSnapshot, setSavedSnapshot] = React.useState({
    title: "",
    content: "",
    status: "draft" as DocumentStatus,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ title?: string; content?: string }>(
    {},
  );

  const {
    autoSaveStatus,
    autoSaveError,
    lastSavedAt,
    isDirty,
    canAutoSave,
  } = useDocumentAutoSave({
    documentId,
    title,
    content,
    status,
    savedSnapshot,
    onSaved: setSavedSnapshot,
    onDocumentCreated: (id) => {
      setDocumentId(id);
      router.replace(`/document-review/documents/${id}/edit`);
      router.refresh();
    },
  });

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 500) {
      newErrors.title = "Title must be less than 500 characters";
    }

    if (!content.trim()) {
      newErrors.content = "Document content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDocument = async () => {
    const payload = {
      title: title.trim(),
      content,
      status,
    };

    if (documentId) {
      const res = await fetch(`/api/v1/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? "Failed to save document");
      }
      return documentId;
    }

    const res = await fetch("/api/v1/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(errorData.error ?? "Failed to create document");
    }

    const data = (await res.json()) as { document: { id: string } };
    setDocumentId(data.document.id);
    setSavedSnapshot(payload);
    return data.document.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const id = isDirty || !documentId ? await saveDocument() : documentId;
      router.push(`/document-review/documents/${id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      alert(message);
    } finally {
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
            statusOptions={CREATE_STATUS_OPTIONS}
            statusLabel="Initial Review Status"
            initialMarkdown=""
            editorKey={documentId ?? "new"}
            titleError={errors.title}
            contentError={errors.content}
            disabled={isLoading}
            editorPlaceholder="Write your document here. Use the toolbar for headings, lists, links, and tables."
            autoSaveStatus={autoSaveStatus}
            autoSaveError={autoSaveError}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
            canAutoSave={canAutoSave}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Button>

        <Button type="submit" isLoading={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          <span>{documentId ? "Done" : "Save Document"}</span>
        </Button>
      </div>
    </form>
  );
}
