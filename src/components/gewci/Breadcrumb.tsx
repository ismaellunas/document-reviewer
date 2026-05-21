import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ className, items, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs font-medium text-gewci-dark/60 select-none", className)}
      {...props}
    >
      <ol className="flex items-center space-x-1.5 md:space-x-2">
        <li className="flex items-center">
          <Link
            href="/document-review"
            className="flex items-center hover:text-primary transition-colors gap-1"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GEWCI</span>
          </Link>
        </li>
        <li className="flex items-center space-x-1.5 md:space-x-2">
          <ChevronRight className="h-3 w-3 text-gewci-gray" />
          <Link
            href="/document-review"
            className="hover:text-primary transition-colors"
          >
            Document Review Room
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center space-x-1.5 md:space-x-2">
              <ChevronRight className="h-3 w-3 text-gewci-gray" />
              {isLast || !item.href ? (
                <span
                  className="font-semibold text-gewci-dark font-heading truncate max-w-[150px] sm:max-w-xs"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
