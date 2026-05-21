"use client";

import React from "react";
import Link from "next/link";
import { Search, Plus, FileText, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { Button } from "@/components/gewci/Button";
import { Input } from "@/components/gewci/Input";
import { DocumentCard } from "@/components/drr/DocumentCard";
import { EmptyState } from "@/components/gewci/EmptyState";
import { DRRDocument, DocumentStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Documents", value: "all" },
  { label: "Drafts", value: "draft" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Needs Revision", value: "needs_revision" },
  { label: "Rejected", value: "rejected" },
];

export default function DocumentsPage() {
  const supabase = createClient();
  
  const [documents, setDocuments] = React.useState<DRRDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [canCreate, setCanCreate] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Get user profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("gewci_users")
            .select("roles")
            .eq("id", session.user.id)
            .single();
          
          const roles = profile?.roles || [];
          setCanCreate(roles.includes("document-review:admin") || roles.includes("document-review:editor"));
        }

        // Fetch documents
        const { data: docs, error: docsError } = await supabase
          .from("drr_documents")
          .select(`
            *,
            creator:gewci_users!drr_documents_created_by_fkey (
              id,
              email,
              display_name,
              avatar_url,
              roles
            ),
            comments:drr_comments (
              id
            )
          `)
          .order("created_at", { ascending: false });

        if (docsError) throw docsError;

        const formattedDocs: DRRDocument[] = (docs || []).map((doc: any) => ({
          ...doc,
          comment_count: doc.comments ? doc.comments.length : 0,
          comments: undefined,
        }));

        setDocuments(formattedDocs);
      } catch (err: any) {
        console.error("Error loading documents:", err);
        setError(err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Filter documents based on query and tab status
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Heading */}
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

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-gewci-white p-4 rounded-[--radius-card] border border-gewci-gray/20 shadow-xs select-none">
        {/* Search */}
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

        {/* Status filters scrollable on mobile */}
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

      {/* Main Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-xs font-bold text-gewci-dark/40 uppercase tracking-widest">
            Loading Documents...
          </span>
        </div>
      ) : error ? (
        <div className="bg-error/5 border border-error/20 text-error rounded-xl p-4 flex items-start gap-3 max-w-lg mx-auto select-none">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold font-heading">Failed to fetch documents</h4>
            <p className="text-xs mt-1 text-error/80 leading-normal">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-error/30 text-error hover:bg-error/5"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
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
