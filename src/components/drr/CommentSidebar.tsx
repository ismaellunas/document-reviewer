"use client";

import React from "react";
import { MessageSquare, MessageCircle, ClipboardList, CheckCircle } from "lucide-react";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { createClient } from "@/lib/supabase/client";
import { DRRComment } from "@/lib/types";

interface CommentSidebarProps {
  documentId: string;
  comments: DRRComment[];
  currentUser: any;
  onRefresh: () => void;
  anchorData?: {
    text: string;
    start: number;
    end: number;
  } | null;
  onClearAnchor?: () => void;
}

export function CommentSidebar({
  documentId,
  comments,
  currentUser,
  onRefresh,
  anchorData = null,
  onClearAnchor,
}: CommentSidebarProps) {
  const supabase = createClient();
  const [filter, setFilter] = React.useState<"all" | "active" | "resolved">("active");

  const handleResolveToggle = async (commentId: string, isResolved: boolean) => {
    try {
      const { error } = await supabase
        .from("drr_comments")
        .update({
          is_resolved: isResolved,
          resolved_by: isResolved ? currentUser?.id : null,
          resolved_at: isResolved ? new Date().toISOString() : null,
        })
        .eq("id", commentId);

      if (error) throw error;
      
      // Post audit event log
      await fetch("/api/v1/documents/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isResolved ? "annotation_resolved" : "annotation_unresolved",
          resource_type: "annotation",
          resource_id: commentId,
          details: { document_id: documentId }
        })
      });

      onRefresh();
    } catch (err) {
      console.error("Failed to update resolution status:", err);
      alert("Failed to update comment resolution status");
    }
  };

  // Group nested comments (replies) into their parents
  const processedComments = React.useMemo(() => {
    const parentComments = comments.filter((c) => !c.parent_id);
    const replies = comments.filter((c) => c.parent_id);

    return parentComments.map((parent) => ({
      ...parent,
      replies: replies
        .filter((r) => r.parent_id === parent.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));
  }, [comments]);

  // Filter threads
  const filteredComments = React.useMemo(() => {
    return processedComments.filter((c) => {
      if (filter === "active") return !c.is_resolved;
      if (filter === "resolved") return c.is_resolved;
      return true;
    });
  }, [processedComments, filter]);

  return (
    <div className="flex flex-col h-full bg-gewci-white border-l border-gewci-gray/20">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-gewci-gray/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-primary flex items-center gap-2 select-none">
            <MessageSquare className="h-4 w-4 text-secondary" />
            <span>Comments & Annotation</span>
          </h3>
          <span className="text-xs font-semibold bg-gewci-gray/10 px-2 py-0.5 rounded-full text-gewci-dark/70 select-none">
            {comments.length}
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-gewci-gray/5 p-1 rounded-xl border border-gewci-gray/10 select-none text-xs font-semibold">
          <button
            onClick={() => setFilter("active")}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
              filter === "active"
                ? "bg-gewci-white text-primary shadow-sm"
                : "text-gewci-dark/50 hover:text-gewci-dark"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Active</span>
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
              filter === "resolved"
                ? "bg-gewci-white text-primary shadow-sm"
                : "text-gewci-dark/50 hover:text-gewci-dark"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Resolved</span>
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
              filter === "all"
                ? "bg-gewci-white text-primary shadow-sm"
                : "text-gewci-dark/50 hover:text-gewci-dark"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>All</span>
          </button>
        </div>
      </div>

      {/* Main Comment Entry Form */}
      <div className="p-4 border-b border-gewci-gray/10 bg-gewci-gray/5">
        <CommentForm
          documentId={documentId}
          anchorText={anchorData?.text}
          anchorStart={anchorData?.start}
          anchorEnd={anchorData?.end}
          onSuccess={() => {
            onRefresh();
            if (onClearAnchor) onClearAnchor();
          }}
          onCancel={onClearAnchor}
        />
      </div>

      {/* List of Comments */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gewci-white">
        {filteredComments.length > 0 ? (
          filteredComments.map((thread) => (
            <CommentThread
              key={thread.id}
              comment={thread}
              currentUser={currentUser}
              onResolveToggle={handleResolveToggle}
              onReplySuccess={onRefresh}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4 select-none">
            <MessageSquare className="h-8 w-8 text-gewci-gray/50 mx-auto mb-3" />
            <p className="text-xs font-semibold text-gewci-dark/60">No comments found</p>
            <p className="text-[10px] text-gewci-dark/40 mt-1">
              {filter === "active"
                ? "Select document text to add an annotation, or write a top-level comment above."
                : "Resolved comments will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
