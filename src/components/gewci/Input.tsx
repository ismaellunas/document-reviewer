"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm ring-offset-background placeholder:text-gewci-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all",
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

Input.displayName = "Input";
