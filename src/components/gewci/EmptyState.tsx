import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  actionText,
  onAction,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 border border-dashed border-gewci-gray/30 rounded-[--radius-card] bg-gewci-gray/5",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-gewci-gray flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gewci-dark font-heading mb-1">{title}</h3>
      <p className="text-sm text-gewci-dark/60 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
