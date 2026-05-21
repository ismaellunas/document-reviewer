import React from "react";
import Link from "next/link";
import { Plus, ArrowRight, FileCheck } from "lucide-react";

import { getServerContext } from "@/lib/http";
import { documentsService } from "@/lib/services/documents.service";
import { DashboardStats } from "@/components/drr/DashboardStats";
import { DocumentCard } from "@/components/drr/DocumentCard";
import { Button } from "@/components/gewci/Button";
import { EmptyState } from "@/components/gewci/EmptyState";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";

export default async function DashboardPage() {
  const ctx = await getServerContext();
  const { stats, recentDocs, canCreate } =
    await documentsService.getDashboardData(ctx);

  return (
    <div className="space-y-6">
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

      <DashboardStats stats={stats} />

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
