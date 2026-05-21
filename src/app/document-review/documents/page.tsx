import React from "react";

import { getServerContext } from "@/lib/http";
import { documentsService } from "@/lib/services/documents.service";
import { permissionsService } from "@/lib/services/permissions.service";
import { DocumentsBrowser } from "@/components/drr/DocumentsBrowser";

export default async function DocumentsPage() {
  const ctx = await getServerContext();
  const [documents, canCreate] = await Promise.all([
    documentsService.list(ctx),
    permissionsService.canCreateDocuments(ctx),
  ]);

  return <DocumentsBrowser documents={documents} canCreate={canCreate} />;
}
