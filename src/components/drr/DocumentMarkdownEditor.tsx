"use client";

import React from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { cn } from "@/lib/utils";
import { ForwardRefEditor } from "@/components/drr/mdx-editor/ForwardRefEditor";

interface DocumentMarkdownEditorProps {
  /** Initial markdown value (uncontrolled after mount; use `editorKey` to reset). */
  markdown: string;
  onChange: (markdown: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Remount the editor when the backing document changes (e.g. document id). */
  editorKey?: string;
  className?: string;
  isFullscreen?: boolean;
  labelAction?: React.ReactNode;
}

export function DocumentMarkdownEditor({
  markdown,
  onChange,
  label = "Document Content",
  error,
  disabled = false,
  placeholder = "Start writing your document…",
  editorKey,
  className,
  isFullscreen = false,
  labelAction,
}: DocumentMarkdownEditorProps) {
  const editorRef = React.useRef<MDXEditorMethods>(null);

  return (
    <div className={cn("flex flex-col space-y-1.5 w-full", className)}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between gap-3">
          {label ? (
            <label className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
              {label}
            </label>
          ) : (
            <span />
          )}
          {labelAction}
        </div>
      )}

      <div
        className={cn(
          "document-mdx-editor-shell overflow-hidden rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          isFullscreen && "document-mdx-editor-shell--fullscreen flex flex-col min-h-[calc(100vh-14rem)]",
          error && "border-error focus-within:ring-error/20 focus-within:border-error",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <ForwardRefEditor
          key={editorKey}
          ref={editorRef}
          markdown={markdown}
          onChange={onChange}
          readOnly={disabled}
          placeholder={placeholder}
          contentEditableClassName={isFullscreen ? "document-editor-content--fullscreen" : undefined}
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-error select-none">{error}</p>
      )}
    </div>
  );
}
