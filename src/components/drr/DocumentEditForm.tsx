"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "@/components/gewci/Input";
import { Textarea } from "@/components/gewci/Textarea";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";
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
 * audit logging server-side. Detects "no changes" client-side so we don't
 * waste an audit-log entry on a noop save.
 */
export function DocumentEditForm({ document }: DocumentEditFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(document.title);
  const [content, setContent] = React.useState(document.content ?? "");
  const [status, setStatus] = React.useState<DocumentStatus>(document.status);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    title?: string;
    content?: string;
  }>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const hasChanges =
    title.trim() !== document.title.trim() ||
    content !== (document.content ?? "") ||
    status !== document.status;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;
    if (!hasChanges) {
      router.push(`/document-review/documents/${document.id}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/documents/${document.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? `Update failed (${res.status})`);
      }

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
      <Card className="border border-gewci-gray/20">
        <CardContent className="p-6 space-y-5">
          <Input
            label="Document Title"
            placeholder="e.g., Annual Youth Ministry Strategy 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            disabled={isLoading}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
              Review Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DocumentStatus)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all text-gewci-dark font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Document Content (Markdown Supported)"
            placeholder="# Section&#10;&#10;Write document sections here using standard markdown formatting..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={errors.content}
            rows={18}
            disabled={isLoading}
            className="font-mono text-sm"
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
          disabled={!hasChanges}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          <span>{hasChanges ? "Save changes" : "No changes"}</span>
        </Button>
      </div>
    </form>
  );
}
