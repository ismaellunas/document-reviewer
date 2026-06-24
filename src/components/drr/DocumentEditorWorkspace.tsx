"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import { Input } from "@/components/gewci/Input";
import { Button } from "@/components/gewci/Button";
import { DocumentMarkdownEditor } from "@/components/drr/DocumentMarkdownEditor";
import { AutoSaveStatus } from "@/components/drr/AutoSaveStatus";
import type { AutoSaveStatus as AutoSaveStatusType } from "@/hooks/useDocumentAutoSave";
import type { DocumentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusOption {
  value: DocumentStatus;
  label: string;
}

interface DocumentEditorWorkspaceProps {
  title: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  status: DocumentStatus;
  onStatusChange: (value: DocumentStatus) => void;
  statusOptions: StatusOption[];
  statusLabel?: string;
  initialMarkdown: string;
  editorKey: string;
  titleError?: string;
  contentError?: string;
  disabled?: boolean;
  editorPlaceholder?: string;
  autoSaveStatus: AutoSaveStatusType;
  autoSaveError?: string | null;
  lastSavedAt?: Date | null;
  isDirty?: boolean;
  canAutoSave?: boolean;
}

export function DocumentEditorWorkspace({
  title,
  onTitleChange,
  onContentChange,
  status,
  onStatusChange,
  statusOptions,
  statusLabel = "Review Status",
  initialMarkdown,
  editorKey,
  titleError,
  contentError,
  disabled = false,
  editorPlaceholder,
  autoSaveStatus,
  autoSaveError,
  lastSavedAt,
  isDirty = false,
  canAutoSave = true,
}: DocumentEditorWorkspaceProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const workspace = (
    <div
      className={cn(
        isFullscreen
          ? "document-editor-fullscreen fixed inset-0 z-[100] flex flex-col bg-gewci-white"
          : "space-y-5",
      )}
    >
      {isFullscreen && (
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gewci-gray/20 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gewci-dark/50">
              Full window editor
            </p>
            <p className="truncate text-sm font-semibold text-gewci-dark">
              {title.trim() || "Untitled document"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AutoSaveStatus
              status={autoSaveStatus}
              error={autoSaveError}
              lastSavedAt={lastSavedAt}
              isDirty={isDirty}
              canAutoSave={canAutoSave}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="gap-1.5"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit</span>
            </Button>
          </div>
        </header>
      )}

      <div
        className={cn(
          isFullscreen &&
            "flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6",
        )}
      >
        <div
          className={cn(
            "space-y-5",
            isFullscreen && "mx-auto h-full max-w-5xl",
          )}
        >
          <Input
            label="Document Title"
            placeholder="e.g., Annual Youth Ministry Strategy 2026"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            error={titleError}
            disabled={disabled}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
              {statusLabel}
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as DocumentStatus)}
              disabled={disabled}
              className="flex h-10 w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all text-gewci-dark font-medium"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <DocumentMarkdownEditor
            markdown={initialMarkdown}
            onChange={onContentChange}
            editorKey={editorKey}
            error={contentError}
            disabled={disabled}
            placeholder={editorPlaceholder}
            isFullscreen={isFullscreen}
            labelAction={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen((value) => !value)}
                disabled={disabled}
                className="h-7 px-2 gap-1.5 text-gewci-dark/70"
                aria-label={
                  isFullscreen ? "Exit full window mode" : "Open full window mode"
                }
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span>Exit full window</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Full window</span>
                  </>
                )}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );

  if (mounted && isFullscreen) {
    return createPortal(workspace, document.body);
  }

  return workspace;
}
