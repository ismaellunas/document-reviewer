-- Drop old comments UPDATE and DELETE policies
DROP POLICY IF EXISTS "comments_update" ON public.drr_comments;
DROP POLICY IF EXISTS "comments_delete" ON public.drr_comments;

-- Comments: author, admin, or editor can update (resolve, edit content, etc.)
CREATE POLICY "comments_update" ON public.drr_comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND (
        'document-review:admin' = ANY(roles)
        OR 'document-review:editor' = ANY(roles)
      )
    )
  );

-- Comments: author or admin can delete
CREATE POLICY "comments_delete" ON public.drr_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );
