-- ============================================
-- Migration 007: Prayer requests (public submit, admin manage)
-- ============================================

DO $$ BEGIN
  CREATE TYPE prayer_request_status AS ENUM ('pending', 'prayed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80),
  email VARCHAR(254),
  phone VARCHAR(20),
  body TEXT NOT NULL,
  wants_pray_with BOOLEAN NOT NULL DEFAULT false,
  contact_via_email BOOLEAN NOT NULL DEFAULT false,
  status prayer_request_status NOT NULL DEFAULT 'pending',
  prayed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prayer_requests_body_not_blank CHECK (char_length(trim(body)) > 0),
  CONSTRAINT prayer_requests_first_name_not_blank CHECK (char_length(trim(first_name)) > 0),
  CONSTRAINT prayer_requests_prayed_at_when_prayed CHECK (
    (status = 'prayed' AND prayed_at IS NOT NULL)
    OR (status = 'pending' AND prayed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_list
  ON public.prayer_requests (status, created_at DESC);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a new pending request (no login).
CREATE POLICY "prayer_requests_public_insert"
  ON public.prayer_requests
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND prayed_at IS NULL
  );

-- Admins may read, update, and delete.
CREATE POLICY "prayer_requests_admin_select"
  ON public.prayer_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );

CREATE POLICY "prayer_requests_admin_update"
  ON public.prayer_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );

CREATE POLICY "prayer_requests_admin_delete"
  ON public.prayer_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );
