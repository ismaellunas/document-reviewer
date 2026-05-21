import React from "react";
import Link from "next/link";
import { MessageSquare, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/gewci/Card";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { Avatar } from "@/components/gewci/Avatar";
import { DRRDocument } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface DocumentCardProps {
  document: DRRDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const creatorName = document.creator?.display_name || "Unknown Author";
  const commentCount = document.comment_count || 0;

  return (
    <Link
      href={`/document-review/documents/${document.id}`}
      aria-label={`Open ${document.title}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-[--radius-card]"
    >
      <Card className="relative h-full border border-gewci-gray/20 group-hover:border-primary/30 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300">
        {/* Hover-revealed chevron affordance */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-4 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-gewci-white shadow-sm opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200"
        >
          <ChevronRight className="h-4 w-4" />
        </span>

        <CardContent className="flex flex-col h-full justify-between p-5">
          <div>
            {/* Header: Status */}
            <div className="flex items-center justify-between gap-2 mb-3 select-none pr-9">
              <DocumentStatusBadge status={document.status} />
              <div className="flex items-center gap-1 text-[10px] text-gewci-dark/40 font-semibold tracking-wider uppercase">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(document.updated_at || document.created_at)}</span>
              </div>
            </div>

            {/* Title */}
            <h4 className="text-base font-bold text-gewci-dark leading-snug font-heading group-hover:text-primary transition-colors line-clamp-2 mb-4">
              {document.title}
            </h4>
          </div>

          {/* Footer: Author & Comment count */}
          <div className="flex items-center justify-between border-t border-gewci-gray/10 pt-4 mt-auto">
            {/* Creator info */}
            <div className="flex items-center gap-2">
              <Avatar
                src={document.creator?.avatar_url}
                name={creatorName}
                email={document.creator?.email}
                size="sm"
                className="h-6 w-6"
              />
              <span className="text-xs font-semibold text-gewci-dark/70 truncate max-w-[120px]">
                {creatorName}
              </span>
            </div>

            {/* Comments count */}
            <div className="flex items-center gap-1 text-gewci-dark/50 text-xs select-none">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-semibold">{commentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
