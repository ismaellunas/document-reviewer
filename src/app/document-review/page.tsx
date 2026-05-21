import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, ArrowRight, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/drr/DashboardStats";
import { DocumentCard } from "@/components/drr/DocumentCard";
import { Button } from "@/components/gewci/Button";
import { EmptyState } from "@/components/gewci/EmptyState";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { DRRDocument } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile to check roles
  const { data: profile } = await supabase
    .from("gewci_users")
    .select("roles")
    .eq("id", user.id)
    .single();

  const userRoles = profile?.roles || [];
  const canCreate = userRoles.includes("document-review:admin") || userRoles.includes("document-review:editor");

  // Fetch counts and recent documents in parallel
  const [
    totalDocsRes,
    inReviewDocsRes,
    approvedDocsRes,
    totalCommentsRes,
    recentDocsRes
  ] = await Promise.all([
    supabase.from("drr_documents").select("*", { count: "exact", head: true }),
    supabase.from("drr_documents").select("*", { count: "exact", head: true }).eq("status", "in_review"),
    supabase.from("drr_documents").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("drr_comments").select("*", { count: "exact", head: true }),
    supabase
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
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  if (recentDocsRes.error) {
    console.error("Failed to load recent documents:", recentDocsRes.error);
  }

  const stats = {
    totalDocs: totalDocsRes.count || 0,
    inReviewDocs: inReviewDocsRes.count || 0,
    approvedDocs: approvedDocsRes.count || 0,
    totalComments: totalCommentsRes.count || 0,
  };

  const recentDocsRaw = recentDocsRes.data || [];
  const recentDocs: DRRDocument[] = recentDocsRaw.map((doc: any) => ({
    ...doc,
    comment_count: doc.comments ? doc.comments.length : 0,
    comments: undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div className="space-y-1">
          <Breadcrumb items={[]} />
          <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight mt-1">
            Dashboard
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

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Main Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between select-none">
          <h2 className="text-lg font-bold text-gewci-dark font-heading">
            Recent Documents
          </h2>
          {recentDocs.length > 0 && (
            <Link
              href="/document-review/documents"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
            >
              <span>View All Documents</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentDocs.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FileCheck className="h-10 w-10 text-gewci-gray/60" />}
              title="No documents found"
              description={
                canCreate
                  ? "Get started by creating the first document or policy for review."
                  : "There are no documents available for review at this time."
              }
            />
            {canCreate && (
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
            {recentDocs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
