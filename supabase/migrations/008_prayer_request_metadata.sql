-- ============================================
-- Migration 008: Prayer request anonymity + client metadata
-- ============================================

ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
