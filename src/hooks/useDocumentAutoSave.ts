"use client";

import React from "react";
import type { DocumentStatus } from "@/lib/types";

export interface DocumentSaveSnapshot {
  title: string;
  content: string;
  status: DocumentStatus;
}

export type AutoSaveStatus =
  | "idle"
  | "pending"
  | "saving"
  | "saved"
  | "error";

interface UseDocumentAutoSaveOptions {
  documentId?: string | null;
  title: string;
  content: string;
  status: DocumentStatus;
  savedSnapshot: DocumentSaveSnapshot;
  onSaved: (snapshot: DocumentSaveSnapshot) => void;
  onDocumentCreated?: (id: string) => void;
  debounceMs?: number;
  enabled?: boolean;
}

function canAutoSave(title: string, content: string) {
  const trimmedTitle = title.trim();
  return (
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= 500 &&
    content.trim().length > 0
  );
}

function snapshotsEqual(
  a: DocumentSaveSnapshot,
  b: DocumentSaveSnapshot,
): boolean {
  return (
    a.title.trim() === b.title.trim() &&
    a.content === b.content &&
    a.status === b.status
  );
}

export function useDocumentAutoSave({
  documentId,
  title,
  content,
  status,
  savedSnapshot,
  onSaved,
  onDocumentCreated,
  debounceMs = 1500,
  enabled = true,
}: UseDocumentAutoSaveOptions) {
  const [autoSaveStatus, setAutoSaveStatus] =
    React.useState<AutoSaveStatus>("idle");
  const [autoSaveError, setAutoSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const savingRef = React.useRef(false);
  const onSavedRef = React.useRef(onSaved);
  const onDocumentCreatedRef = React.useRef(onDocumentCreated);

  React.useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  React.useEffect(() => {
    onDocumentCreatedRef.current = onDocumentCreated;
  }, [onDocumentCreated]);

  const currentSnapshot = React.useMemo(
    (): DocumentSaveSnapshot => ({
      title: title.trim(),
      content,
      status,
    }),
    [title, content, status],
  );

  const isDirty = !snapshotsEqual(currentSnapshot, savedSnapshot);

  React.useEffect(() => {
    if (!enabled || !isDirty || !canAutoSave(title, content)) {
      return;
    }

    setAutoSaveStatus("pending");
    setAutoSaveError(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        if (savingRef.current) return;
        savingRef.current = true;
        setAutoSaveStatus("saving");

        const payload = {
          title: title.trim(),
          content,
          status,
        };

        try {
          let res: Response;

          if (documentId) {
            res = await fetch(`/api/v1/documents/${documentId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } else {
            res = await fetch("/api/v1/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          }

          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(body?.error ?? `Save failed (${res.status})`);
          }

          const data = (await res.json()) as { document: { id: string } };

          if (!documentId) {
            onDocumentCreatedRef.current?.(data.document.id);
          }

          onSavedRef.current(payload);
          setLastSavedAt(new Date());
          setAutoSaveStatus("saved");
          setAutoSaveError(null);
        } catch (err) {
          setAutoSaveStatus("error");
          setAutoSaveError(
            err instanceof Error ? err.message : "Auto-save failed",
          );
        } finally {
          savingRef.current = false;
        }
      })();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    isDirty,
    title,
    content,
    status,
    documentId,
    debounceMs,
    savedSnapshot,
  ]);

  return {
    autoSaveStatus,
    autoSaveError,
    lastSavedAt,
    isDirty,
    canAutoSave: canAutoSave(title, content),
  };
}
