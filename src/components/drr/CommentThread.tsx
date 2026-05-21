"use client";

import React from "react";
import { Check, CheckCircle2, MessageSquare, Reply, User } from "lucide-react";
import { Avatar } from "@/components/gewci/Avatar";
import { CommentForm } from "./CommentForm";
import { DRRComment } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface CommentThreadProps {
  comment: DRRComment;
  currentUser: any;
  onResolveToggle: (commentId: string, isResolved: boolean) => Promise<void>;
  onReplySuccess: () => void;
}

export function CommentThread({
  comment,
  currentUser,
  onResolveToggle,
  onReplySuccess,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [isResolving, setIsResolving] = React.useState(false);

  const authorName = comment.user?.display_name || "Unknown Reviewer";
  const userRoles = currentUser?.app_metadata?.roles || [];
  
  // Admins and editors can resolve, or the comment author themselves.
  const canResolve =
    userRoles.includes("document-review:admin") ||
    userRoles.includes("document-review:editor") ||
    currentUser?.id === comment.user_id;

  const handleResolve = async () => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      await onResolveToggle(comment.id, !comment.is_resolved);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        comment.is_resolved
          ? "bg-gewci-gray/5 border-gewci-gray/10 opacity-70"
          : "bg-gewci-white border-gewci-gray/20 shadow-sm"
      }`}
    >
      {/* Top Header: Author info, time & Resolve trigger */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={comment.user?.avatar_url}
            name={authorName}
            email={comment.user?.email}
            size="sm"
            className="h-8 w-8"
          />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold text-gewci-dark">
              {authorName}
            </span>
            <span className="text-[10px] text-gewci-dark/40 mt-1 select-none font-semibold uppercase tracking-wider">
              {comment.user?.roles?.[0]?.split(":")[1] || "Reviewer"} &bull; {formatRelativeTime(comment.created_at)}
            </span>
          </div>
        </div>

        {canResolve && (
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className={`flex items-center gap-1 px-2 py-1 rounded-[--radius-button] text-[10px] font-bold select-none cursor-pointer border transition-colors ${
              comment.is_resolved
                ? "bg-success/5 border-success/20 text-success hover:bg-success/10"
                : "bg-gewci-gray/5 border-gewci-gray/25 text-gewci-dark/60 hover:bg-gewci-gray/10 hover:text-gewci-dark"
            }`}
          >
            {comment.is_resolved ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolved</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                <span>Resolve</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Anchor Text Quote (if comment is attached to a text snippet) */}
      {comment.anchor_text && (
        <div className="mt-3 bg-primary/5 border border-primary/10 rounded-[--radius-button] p-2.5 text-xs text-primary leading-normal italic pl-3 border-l-2 border-l-primary">
          "{comment.anchor_text}"
        </div>
      )}

      {/* Content */}
      <p className="mt-3 text-xs sm:text-sm text-gewci-dark/85 leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Reply and actions list */}
      {!comment.is_resolved && (
        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-gewci-dark/50 select-none">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
          >
            <Reply className="h-3.5 w-3.5" />
            <span>Reply</span>
          </button>
        </div>
      )}

      {/* Reply input form */}
      {isReplying && (
        <div className="mt-4 pl-4 border-l border-gewci-gray/20 animate-[fade-in_0.15s_ease-out]">
          <CommentForm
            documentId={comment.document_id}
            parentId={comment.id}
            onSuccess={() => {
              setIsReplying(false);
              onReplySuccess();
            }}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Nested Replies list */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 pl-4 border-l border-gewci-gray/20 space-y-4">
          {comment.replies.map((reply) => {
            const replyAuthor = reply.user?.display_name || "Unknown User";
            return (
              <div key={reply.id} className="flex items-start gap-2.5">
                <Avatar
                  src={reply.user?.avatar_url}
                  name={replyAuthor}
                  email={reply.user?.email}
                  size="sm"
                  className="h-6 w-6"
                />
                <div className="flex-1 bg-gewci-gray/5 rounded-xl p-3 border border-gewci-gray/10">
                  <div className="flex items-center justify-between mb-1 select-none">
                    <span className="text-xs font-bold text-gewci-dark">
                      {replyAuthor}
                    </span>
                    <span className="text-[9px] text-gewci-dark/40 font-semibold">
                      {formatRelativeTime(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gewci-dark/85 leading-relaxed whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
