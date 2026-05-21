"use client";

import React from "react";
import Link from "next/link";
import { Search, Plus, FileText } from "lucide-react";

import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { Button } from "@/components/gewci/Button";
import { Input } from "@/components/gewci/Input";
import { DocumentCard } from "@/components/drr/DocumentCard";
import { EmptyState } from "@/components/gewci/EmptyState";
import type { DRRDocument } from "@/lib/types";

interface DocumentsBrowserProps {
  documents: DRRDocument[];
  canCreate: boolean;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Documents", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Needs Revision", value: "needs_revision" },
  { label: "Rejected", value: "rejected" },
];

/**
 * Client wrapper around the documents list. The server component owns
 * data fetching (via documentsService) and permission gating; this
 * component just handles search + status-tab filtering on the already-
 * fetched array.
 */
export function DocumentsBrowser({ documents, canCreate }: DocumentsBrowserProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  const filteredDocs = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesSearch = q === "" || doc.title.toLowerCase().includes(q);
      const matchesStatus =
        selectedStatus === "all" || doc.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div className="space-y-1">
          <Breadcrumb items={[{ label: "Documents", href: "/document-review/documents" }]} />
          <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight mt-1">
            Documents Browser
          </h1>
        </div>

        {canCreate && (
          <Link href="/document-review/documents/new" className="inline-block">
            <Button className="h-10 gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>New Document</span>
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-gewci-white p-4 rounded-[--radius-card] border border-gewci-gray/20 shadow-xs select-none">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gewci-gray" />
          <Input
            type="text"
            placeholder="Search documents by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedStatus === filter.value
                  ? "bg-primary border-primary text-gewci-white shadow-xs"
                  : "bg-gewci-white border-gewci-gray/25 text-gewci-dark/70 hover:bg-gewci-gray/5"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<FileText className="h-10 w-10 text-gewci-gray/60" />}
            title={searchQuery ? "No matching documents" : "No documents in this list"}
            description={
              searchQuery
                ? "Try adjusting your search keywords or clearing the filters."
                : canCreate
                ? "Click the button below to draft your first document."
                : "No documents have been created under this status yet."
            }
          />
          {canCreate && !searchQuery && (
            <div className="flex justify-center mt-4">
              <Link href="/document-review/documents/new">
                <Button variant="outline" size="sm">
                  Create Document
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
