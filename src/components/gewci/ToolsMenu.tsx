"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { MinistryTool } from "@/lib/config/tools";
import { cn } from "@/lib/utils";

interface ToolsMenuProps {
  tools: MinistryTool[];
  activeToolName?: string;
  sectionLabel?: string;
  className?: string;
  onNavigate?: () => void;
  variant?: "dropdown" | "list";
}

export function ToolsMenu({
  tools,
  activeToolName,
  sectionLabel = "Ministry Suite Tools",
  className,
  onNavigate,
  variant = "dropdown",
}: ToolsMenuProps) {
  if (variant === "list") {
    return (
      <div className={cn("space-y-1", className)}>
        {tools.map((tool) => (
          <ToolMenuItem
            key={tool.id}
            tool={tool}
            active={tool.name === activeToolName}
            onNavigate={onNavigate}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("py-2", className)}>
      <div className="px-4 py-2 border-b border-gewci-gray/10">
        <span className="text-xs font-bold text-gewci-dark/40 uppercase tracking-wider">
          {sectionLabel}
        </span>
      </div>
      <div className="divide-y divide-gewci-gray/10">
        {tools.map((tool) => (
          <ToolMenuItem
            key={tool.id}
            tool={tool}
            active={tool.name === activeToolName}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function ToolMenuItem({
  tool,
  active,
  onNavigate,
  compact = false,
}: {
  tool: MinistryTool;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const Icon = tool.icon;
  const className = cn(
    "flex items-start gap-3 transition-colors",
    compact ? "p-2 rounded-md" : "p-3",
    active
      ? "bg-primary/5 text-primary"
      : tool.enabled
        ? "hover:bg-gewci-gray/5 text-gewci-dark"
        : "opacity-50 cursor-not-allowed text-gewci-dark/60",
  );

  const body = compact ? (
    <>
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-gewci-gray")} />
      <span className="text-sm flex-1 truncate">{tool.name}</span>
      {tool.external && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gewci-dark/40" aria-hidden="true" />
      )}
    </>
  ) : (
    <>
      <Icon
        className={cn(
          "h-5 w-5 mt-0.5 shrink-0",
          active ? "text-primary" : "text-gewci-gray",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold flex items-center gap-1.5">
          <span className="truncate">{tool.name}</span>
          {tool.external && (
            <ExternalLink
              className="h-3 w-3 shrink-0 text-gewci-dark/40"
              aria-hidden="true"
            />
          )}
        </p>
        <p className="text-xs text-gewci-dark/60 mt-0.5">{tool.desc}</p>
      </div>
    </>
  );

  if (tool.external) {
    return (
      <a
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={className}
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      href={tool.href}
      onClick={onNavigate}
      className={className}
      style={{ pointerEvents: tool.enabled ? "auto" : "none" }}
    >
      {body}
    </Link>
  );
}
