"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { Input } from "@/components/gewci/Input";
import { Textarea } from "@/components/gewci/Textarea";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";

export function DocumentCreateForm() {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [status, setStatus] = React.useState("draft");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ title?: string; content?: string }>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? "Failed to create document");
      }

      const data = (await res.json()) as { document: { id: string } };
      router.push(`/document-review/documents/${data.document.id}`);
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
      <Card className="border border-gewci-gray/20">
        <CardContent className="p-6 space-y-5">
          {/* Title */}
          <Input
            label="Document Title"
            placeholder="e.g., Annual Youth Ministry Strategy 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            disabled={isLoading}
          />

          {/* Status Selection */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
              Initial Review Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all text-gewci-dark font-medium"
            >
              <option value="draft">Draft (Private or hidden from reviewers)</option>
              <option value="in_review">In Review (Ready for reviewer annotations)</option>
            </select>
          </div>

          {/* Content */}
          <Textarea
            label="Document Content (Markdown Supported)"
            placeholder="# Introduction&#10;&#10;Write document sections here using standard markdown formatting..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            error={errors.content}
            rows={15}
            disabled={isLoading}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Buttons */}
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
          <span>Save Document</span>
        </Button>
      </div>
    </form>
  );
}
