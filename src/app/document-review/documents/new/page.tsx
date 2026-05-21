import React from "react";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { DocumentCreateForm } from "@/components/drr/DocumentCreateForm";

export default function NewDocumentPage() {
  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="space-y-1 select-none">
        <Breadcrumb
          items={[
            { label: "Documents", href: "/document-review/documents" },
            { label: "New Document", href: "/document-review/documents/new" },
          ]}
        />
        <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight mt-1">
          Create Document
        </h1>
        <p className="text-xs text-gewci-dark/50">
          Draft a new ministry guideline, policy, or announcement to initiate comments and feedback.
        </p>
      </div>

      <div className="max-w-4xl">
        <DocumentCreateForm />
      </div>
    </div>
  );
}
