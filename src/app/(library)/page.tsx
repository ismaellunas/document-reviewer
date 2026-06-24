import { documentsService } from "@/lib/services/documents.service";
import { PublicLibraryBrowser } from "@/components/library/PublicLibraryBrowser";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const documents = await documentsService.listPublicLibrary();

  return <PublicLibraryBrowser documents={documents} />;
}
