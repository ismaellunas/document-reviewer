"use client";

import React from "react";
import { AlertCircle, Check, Cloud, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AutoSaveStatus as AutoSaveStatusType } from "@/hooks/useDocumentAutoSave";
import { cn } from "@/lib/utils";

interface AutoSaveStatusProps {
  status: AutoSaveStatusType;
  error?: string | null;
  lastSavedAt?: Date | null;
  isDirty?: boolean;
  canAutoSave?: boolean;
  className?: string;
}

export function AutoSaveStatus({
  status,
  error,
  lastSavedAt,
  isDirty = false,
  canAutoSave = true,
  className,
}: AutoSaveStatusProps) {
  const label = React.useMemo(() => {
    if (!canAutoSave && status !== "saving" && status !== "error") {
      return "Auto-save starts once title and content are filled";
    }
    if (status === "saving") return "Saving…";
    if (status === "pending" || (isDirty && status !== "error")) {
      return "Unsaved changes";
    }
    if (status === "error") return error ?? "Save failed";
    if (status === "saved" && lastSavedAt) {
      return `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
    }
    return "All changes saved";
  }, [status, error, lastSavedAt, isDirty, canAutoSave]);

  const Icon =
    status === "saving" || status === "pending"
      ? Loader2
      : status === "error"
        ? AlertCircle
        : status === "saved" && !isDirty
          ? Check
          : Cloud;

  const iconClass =
    status === "saving" || status === "pending"
      ? "animate-spin text-gewci-dark/50"
      : status === "error"
        ? "text-error"
        : status === "saved" && !isDirty
          ? "text-success"
          : "text-gewci-dark/45";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-gewci-dark/60 select-none",
        className,
      )}
      aria-live="polite"
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} />
      <span className={status === "error" ? "text-error" : undefined}>
        {label}
      </span>
    </div>
  );
}
