-- ============================================
-- Migration 003: Add missing DELETE policies
-- ============================================
--
-- Migration 001 enabled RLS on drr_documents and drr_comments but only
-- defined SELECT / INSERT / UPDATE policies. With RLS on, the lack of a
-- DELETE policy makes *every* DELETE silently filter to zero rows --
-- PostgREST returns 200 OK and clients think the delete succeeded.
--
-- This migration adds:
--   * drr_documents: owner or admin can delete (matches the API route).
--   * drr_comments:  author can delete their own comment.
--
-- Existing FK on drr_comments.document_id ON DELETE CASCADE handles
-- removing child comment rows when a document is deleted.

-- Documents: owner or admin can delete
CREATE POLICY "documents_delete"
  ON public.drr_documents
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );

-- Comments: author can delete their own comment
CREATE POLICY "comments_delete"
  ON public.drr_comments
  FOR DELETE
  USING (user_id = auth.uid());
