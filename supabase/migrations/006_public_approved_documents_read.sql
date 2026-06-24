-- ============================================
-- Migration 006: Public read access for approved documents
-- ============================================
--
-- Allows anonymous (unauthenticated) users to read documents that have
-- been approved. Internal review workflows remain behind authentication.

CREATE POLICY "documents_read_approved_public"
  ON public.drr_documents
  FOR SELECT
  USING (status = 'approved');
