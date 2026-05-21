-- ============================================
-- Migration 002: Relax read access on gewci_users
-- ============================================
--
-- The initial schema restricted SELECT on gewci_users to the row's own owner
-- (auth.uid() = id). That made authored-by and commented-by embeds invisible
-- from PostgREST joins, which in turn caused documents to disappear from list
-- and detail pages because the embedded creator row was filtered by RLS.
--
-- This migration replaces the per-row read policy with a broader one that
-- lets any authenticated user read profile rows. Writes remain restricted to
-- the row owner via the existing "users_update_own" policy.

DROP POLICY IF EXISTS "users_read_own" ON public.gewci_users;

CREATE POLICY "users_read_authenticated"
  ON public.gewci_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
