"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const textareaId = id || React.useId();
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "flex w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm placeholder:text-gewci-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y",
            error && "border-error focus:ring-error/20 focus:border-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-error select-none">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gewci-dark/50 select-none">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
