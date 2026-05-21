-- ============================================
-- Migration 004 — Default new users to viewer
-- ============================================
--
-- The original handle_new_user trigger granted every new auth signup
-- admin + editor + reviewer roles, which made bootstrapping a single
-- developer easy but is wrong once the org has admin-managed enrollment.
--
-- This migration replaces the trigger function so newly-created users
-- default to ['document-review:viewer']. The admin UI's invite flow
-- immediately overrides these defaults via gewci_users.update, so users
-- created through the admin UI keep the roles the admin selected.
--
-- IMPORTANT: This migration only changes behavior for NEW users created
-- after it runs. Existing user roles in `public.gewci_users` are not
-- touched. Before deploying, verify your own admin role still exists:
--
--   SELECT email, roles FROM public.gewci_users
--   WHERE 'document-review:admin' = ANY(roles);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.gewci_users (id, email, display_name, roles)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    ARRAY['document-review:viewer']
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
