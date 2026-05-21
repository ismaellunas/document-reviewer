"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { Modal } from "@/components/gewci/Modal";

interface DocumentDeleteButtonProps {
  documentId: string;
  documentTitle: string;
}

/**
 * Renders a danger-styled "Delete" trigger plus a confirmation modal.
 * Render it conditionally from the server component when the viewer is the
 * doc owner or an admin so unauthorized users never see the action.
 */
export function DocumentDeleteButton({
  documentId,
  documentTitle,
}: DocumentDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? `Delete failed (${res.status})`);
      }

      setIsOpen(false);
      router.push("/document-review/documents");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete document.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="gap-1.5 border-error/30 text-error hover:bg-error/5 hover:border-error/50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isDeleting) setIsOpen(false);
        }}
        title="Delete document?"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-error/5 border border-error/20 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-error" />
            <div className="text-xs text-error/90 leading-relaxed">
              <p className="font-semibold mb-1 text-error">
                This action cannot be undone.
              </p>
              <p>
                The document and all of its comments will be permanently
                removed.
              </p>
            </div>
          </div>

          <p className="text-sm text-gewci-dark/80 leading-relaxed">
            You&apos;re about to delete{" "}
            <span className="font-semibold text-gewci-dark">
              &ldquo;{documentTitle}&rdquo;
            </span>
            . Continue?
          </p>

          {error && (
            <div className="rounded-lg bg-error/5 border border-error/20 px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
