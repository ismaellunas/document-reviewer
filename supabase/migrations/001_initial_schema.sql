-- ============================================
-- GEWCI Shared Tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.gewci_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  roles TEXT[] DEFAULT '{"document-review:viewer"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gewci_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tool_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.gewci_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tool_type ON public.gewci_audit_logs(tool_type);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.gewci_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.gewci_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.gewci_audit_logs(created_at);

-- ============================================
-- Document Review Room (DRR) Tables
-- ============================================

-- Check if enum exists first, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drr_document_status') THEN
    CREATE TYPE drr_document_status AS ENUM (
      'draft', 'in_review', 'approved', 'needs_revision', 'rejected'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.drr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT,                    -- Document body (Markdown)
  status drr_document_status DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.gewci_users(id),
  updated_by UUID REFERENCES public.gewci_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drr_documents_status ON public.drr_documents(status);
CREATE INDEX IF NOT EXISTS idx_drr_documents_created_by ON public.drr_documents(created_by);

CREATE TABLE IF NOT EXISTS public.drr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.drr_documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.drr_comments(id) ON DELETE CASCADE,  -- For threaded replies
  user_id UUID NOT NULL REFERENCES public.gewci_users(id),
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.gewci_users(id),
  resolved_at TIMESTAMPTZ,
  -- Text selection anchoring (for inline comments)
  anchor_start INT,               -- Character offset start
  anchor_end INT,                  -- Character offset end
  anchor_text TEXT,                -- Snapshot of selected text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drr_comments_document ON public.drr_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_drr_comments_parent ON public.drr_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_drr_comments_user ON public.drr_comments(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.gewci_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gewci_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drr_comments ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own" ON public.gewci_users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.gewci_users
  FOR UPDATE USING (auth.uid() = id);

-- Audit logs: insert-only (no read from client; admin queries via service role)
CREATE POLICY "audit_insert" ON public.gewci_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents: all authenticated users can read
CREATE POLICY "documents_read" ON public.drr_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Documents: admins and editors can create
CREATE POLICY "documents_insert" ON public.drr_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND (
        'document-review:admin' = ANY(roles)
        OR 'document-review:editor' = ANY(roles)
      )
    )
  );

-- Documents: owner, admins, and editors can update
CREATE POLICY "documents_update" ON public.drr_documents
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );

-- Comments: all authenticated users can read
CREATE POLICY "comments_read" ON public.drr_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Comments: authenticated users with reviewer+ role can create
CREATE POLICY "comments_insert" ON public.drr_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gewci_users
      WHERE id = auth.uid()
      AND (
        'document-review:admin' = ANY(roles)
        OR 'document-review:editor' = ANY(roles)
        OR 'document-review:reviewer' = ANY(roles)
      )
    )
  );

-- Comments: own comments can be updated
CREATE POLICY "comments_update" ON public.drr_comments
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- Auto-create gewci_users on auth.users insert
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.gewci_users (id, email, display_name, roles)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    ARRAY['document-review:admin', 'document-review:editor', 'document-review:reviewer'] -- Default permissions for easier local setup
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
