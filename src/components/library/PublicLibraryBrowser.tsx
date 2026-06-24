"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ChevronRight, FileText, Heart, Search } from "lucide-react";
import { Card, CardContent } from "@/components/gewci/Card";
import { EmptyState } from "@/components/gewci/EmptyState";
import { Input } from "@/components/gewci/Input";
import type { DRRDocument } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PublicLibraryBrowserProps {
  documents: DRRDocument[];
}

export function PublicLibraryBrowser({ documents }: PublicLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredDocs = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  return (
    <div className="space-y-8">
      <section className="space-y-3 select-none">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
          Document Library
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gewci-dark font-heading tracking-tight">
          Approved Ministry Documents
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-gewci-dark/65 leading-relaxed">
          Browse finalized, approved documents published for the congregation and
          ministry teams. Staff and reviewers can sign in to access the full
          review workflow.
        </p>
      </section>

      <Link
        href="/prayer-requests"
        className="flex items-center gap-4 rounded-[--radius-card] border border-gewci-gray/20 bg-gradient-to-r from-primary/5 to-secondary/10 p-5 shadow-xs hover:border-primary/25 hover:shadow-sm transition-all group"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-gewci-white transition-colors">
          <Heart className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gewci-dark group-hover:text-primary transition-colors">
            Submit a Prayer Request
          </p>
          <p className="text-xs text-gewci-dark/60 mt-0.5">
            Confidential — we would be honoured to pray for you.
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gewci-dark/30 group-hover:text-primary ml-auto shrink-0" />
      </Link>

      <div className="bg-gewci-white p-4 rounded-[--radius-card] border border-gewci-gray/20 shadow-xs">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gewci-gray" />
          <Input
            type="text"
            placeholder="Search approved documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<FileText className="h-10 w-10 text-gewci-gray/60" />}
            title={searchQuery ? "No matching documents" : "No approved documents yet"}
            description={
              searchQuery
                ? "Try a different search term."
                : "Approved documents will appear here once they are published from the review room."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <PublicDocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicDocumentCard({ document }: { document: DRRDocument }) {
  return (
    <Link
      href={`/documents/${document.id}`}
      aria-label={`Open ${document.title}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-[--radius-card]"
    >
      <Card className="relative h-full border border-gewci-gray/20 group-hover:border-primary/30 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-4 flex items-center justify-center h-7 w-7 rounded-full bg-primary text-gewci-white shadow-sm opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200"
        >
          <ChevronRight className="h-4 w-4" />
        </span>

        <CardContent className="flex flex-col h-full justify-between p-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 select-none pr-9">
              <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                Approved
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gewci-dark/40 font-semibold tracking-wider uppercase">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(document.updated_at || document.created_at)}</span>
              </div>
            </div>

            <h2 className="text-base font-bold text-gewci-dark leading-snug font-heading group-hover:text-primary transition-colors line-clamp-3">
              {document.title}
            </h2>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
