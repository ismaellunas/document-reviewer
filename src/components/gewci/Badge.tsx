import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          "bg-primary text-gewci-white": variant === "default",
          "bg-secondary text-gewci-dark": variant === "secondary",
          "border border-gewci-gray text-gewci-dark": variant === "outline",
          "bg-success/10 text-success border border-success/20": variant === "success",
          "bg-warning/10 text-warning border border-warning/20": variant === "warning",
          "bg-error/10 text-error border border-error/20": variant === "error",
          "bg-info/10 text-info border border-info/20": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
