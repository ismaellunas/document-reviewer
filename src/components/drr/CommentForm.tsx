"use client";

import React from "react";
import { Send, CornerDownRight } from "lucide-react";
import { Textarea } from "@/components/gewci/Textarea";
import { Button } from "@/components/gewci/Button";

interface CommentFormProps {
  documentId: string;
  parentId?: string | null;
  anchorText?: string | null;
  anchorStart?: number | null;
  anchorEnd?: number | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function CommentForm({
  documentId,
  parentId = null,
  anchorText = null,
  anchorStart = null,
  anchorEnd = null,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/documents/${documentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          parent_id: parentId,
          anchor_text: anchorText,
          anchor_start: anchorStart,
          anchor_end: anchorEnd,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit comment");
      }

      setContent("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      {anchorText && (
        <div className="bg-primary/5 border border-primary/10 rounded-[--radius-button] p-2.5 text-xs text-primary leading-normal flex items-start gap-1.5 animate-[fade-in_0.2s_ease-out]">
          <CornerDownRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold select-none uppercase tracking-wider text-[9px] block mb-0.5 opacity-70">
              Selected text:
            </span>
            <span className="italic">"{anchorText}"</span>
          </div>
        </div>
      )}

      <Textarea
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={parentId ? 2 : 3}
        disabled={isLoading}
        error={error}
        className="text-xs sm:text-sm bg-gewci-gray/5 border-gewci-gray/30 hover:border-gewci-gray/50"
      />

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isLoading}
          isLoading={isLoading}
          className="text-xs gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{parentId ? "Reply" : "Comment"}</span>
        </Button>
      </div>
    </form>
  );
}
