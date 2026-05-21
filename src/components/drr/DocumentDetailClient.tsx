"use client";

import React from "react";
import type { User } from "@supabase/supabase-js";
import { DocumentReader } from "./DocumentReader";
import { CommentSidebar } from "./CommentSidebar";
import type { DRRComment, DRRDocument } from "@/lib/types";

interface DocumentDetailClientProps {
  document: DRRDocument;
  initialComments: DRRComment[];
  currentUser: User | null;
}

interface AnchorData {
  text: string;
  start: number;
  end: number;
}

/**
 * Client wrapper for the document detail view. Handles comment refetching,
 * inline-anchor selection state, and the responsive desktop/mobile layout.
 * The server component owns the initial server-side fetch.
 */
export function DocumentDetailClient({
  document,
  initialComments,
  currentUser,
}: DocumentDetailClientProps) {
  const [comments, setComments] = React.useState<DRRComment[]>(initialComments);
  const [anchorData, setAnchorData] = React.useState<AnchorData | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/documents/${document.id}/comments`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { comments: DRRComment[] };
      setComments(data.comments ?? []);
    } catch (err) {
      console.error("Failed to refresh comments:", err);
    }
  }, [document.id]);

  const handleTextSelect = React.useCallback(
    (text: string, start: number, end: number) => {
      setAnchorData({ text, start, end });
      setIsMobileSidebarOpen(true);
    },
    [],
  );

  const clearAnchor = React.useCallback(() => setAnchorData(null), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
      {/* Reader column */}
      <article className="bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-xs p-6 sm:p-8 min-w-0">
        <DocumentReader doc={document} onTextSelect={handleTextSelect} />
      </article>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-24 h-[calc(100vh-7rem)] rounded-[--radius-card] overflow-hidden border border-gewci-gray/20 shadow-xs">
        <CommentSidebar
          documentId={document.id}
          comments={comments}
          currentUser={currentUser}
          onRefresh={refresh}
          anchorData={anchorData}
          onClearAnchor={clearAnchor}
        />
      </aside>

      {/* Mobile floating button */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen((v) => !v)}
        className="lg:hidden fixed bottom-5 right-5 z-30 bg-primary text-gewci-white rounded-full shadow-lg px-4 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-primary-dark transition-colors"
      >
        {isMobileSidebarOpen ? "Close" : `Comments (${comments.length})`}
      </button>

      {/* Mobile drawer */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-gewci-dark/40 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-gewci-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-[slide-up_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <CommentSidebar
              documentId={document.id}
              comments={comments}
              currentUser={currentUser}
              onRefresh={refresh}
              anchorData={anchorData}
              onClearAnchor={clearAnchor}
            />
          </div>
        </div>
      )}
    </div>
  );
}
