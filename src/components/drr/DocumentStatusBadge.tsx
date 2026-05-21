import React from "react";
import { Badge } from "@/components/gewci/Badge";
import { DocumentStatus } from "@/lib/types";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const statusConfig: Record<DocumentStatus, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info" }> = {
    draft: { label: "Draft", variant: "outline" },
    in_review: { label: "In Review", variant: "info" },
    approved: { label: "Approved", variant: "success" },
    needs_revision: { label: "Needs Revision", variant: "warning" },
    rejected: { label: "Rejected", variant: "error" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
