# GEWCI Document Review Room — Phase 1 MVP

Build the core Document Review Room as the first tool in the GEWCI Ministry Tools suite. The MVP delivers: create/upload documents, read documents, add text comments, and a mobile-responsive UI — all wrapped in the GEWCI branding framework.

---

## User Review Required

> [!IMPORTANT]
> **Supabase project required.** You'll need a Supabase project with URL and anon key ready before the app can connect to auth/database. I'll set up the code to read from `.env.local` — you provide the credentials.

> [!IMPORTANT]
> **Tailwind CSS v4 confirmed.** The `create-next-app` will install Tailwind v4 by default. All design tokens will be configured via CSS `@theme` blocks (no `tailwind.config.js`). Confirm you're comfortable with this approach.

> [!WARNING]
> **Scope boundary.** This plan covers Phase 1 only: document CRUD, text comments, and responsive UI. Features like drawing annotations, version history, export, review sessions, and offline support are deferred to later phases but the architecture accommodates them.

## Open Questions

1. **Do you have a Supabase project set up already?** If not, should I include steps to create one via the CLI?
2. **GEWCI color palette** — Do you have specific brand colors (primary, secondary, accents), or should I propose a palette?
3. **Authentication method** — Email/password? Google OAuth? Magic links? Which sign-in methods should the MVP support?
4. **Document format** — Should documents be plain text, rich text (HTML/Markdown), or file uploads (PDF/DOCX)? This affects the reader component significantly.

---

## Proposed Changes

### A. Project Scaffolding

#### [NEW] Project initialization

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"
```

This creates a Next.js 15 project with:
- TypeScript, App Router, ESLint
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- `src/` directory structure
- `@/*` import alias
- Turbopack for fast dev builds

#### [NEW] Additional dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react          # Icons (lightweight, tree-shakeable)
npm install clsx                  # Conditional classnames
npm install date-fns              # Date formatting
```

#### [NEW] `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TOOL_NAME=document-review
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### B. Project File Structure

```
src/
├── app/
│   ├── globals.css                         # Tailwind v4 + GEWCI design system
│   ├── layout.tsx                          # Root layout (html, body, fonts)
│   ├── page.tsx                            # Redirect to /document-review
│   ├── loading.tsx                         # Global loading skeleton
│   ├── not-found.tsx                       # 404 page
│   │
│   ├── login/
│   │   └── page.tsx                        # Login page
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                    # Supabase auth callback
│   │
│   ├── document-review/
│   │   ├── layout.tsx                      # DRR layout (GEWCI nav + sidebar)
│   │   ├── page.tsx                        # /document-review (dashboard)
│   │   ├── documents/
│   │   │   ├── page.tsx                    # /document-review/documents (list)
│   │   │   ├── new/
│   │   │   │   └── page.tsx               # /document-review/documents/new (create)
│   │   │   └── [id]/
│   │   │       └── page.tsx               # /document-review/documents/:id (read + comment)
│   │   └── dashboard/
│   │       └── page.tsx                    # /document-review/dashboard (stats)
│   │
│   └── api/
│       └── v1/
│           └── documents/
│               ├── route.ts               # GET (list) / POST (create)
│               └── [id]/
│                   ├── route.ts           # GET / PUT / DELETE
│                   └── comments/
│                       └── route.ts       # GET / POST comments
│
├── components/
│   ├── gewci/                              # Shared GEWCI components
│   │   ├── Header.tsx                      # GEWCI top bar (logo, tool picker, user menu)
│   │   ├── Nav.tsx                         # App switcher / navigation
│   │   ├── Footer.tsx                      # GEWCI footer
│   │   ├── Button.tsx                      # Styled button
│   │   ├── Card.tsx                        # Content card
│   │   ├── Badge.tsx                       # Status badge
│   │   ├── Modal.tsx                       # Dialog modal
│   │   ├── Input.tsx                       # Form input
│   │   ├── Textarea.tsx                    # Form textarea
│   │   ├── Avatar.tsx                      # User avatar
│   │   ├── EmptyState.tsx                  # Empty state placeholder
│   │   └── Breadcrumb.tsx                  # Breadcrumb navigation
│   │
│   └── drr/                                # Document Review Room-specific
│       ├── DocumentCard.tsx                # Document list item card
│       ├── DocumentReader.tsx              # Full document reader view
│       ├── CommentThread.tsx               # Comment display + reply
│       ├── CommentForm.tsx                 # Add new comment form
│       ├── CommentSidebar.tsx              # Comments panel (desktop sidebar / mobile drawer)
│       ├── DocumentCreateForm.tsx          # Create/upload document form
│       ├── DashboardStats.tsx              # Dashboard statistics cards
│       └── DocumentStatusBadge.tsx         # Status badge (draft/review/approved/rejected)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser Supabase client
│   │   └── server.ts                       # Server Supabase client
│   ├── audit.ts                            # Audit logging utility
│   ├── utils.ts                            # General utilities (cn, formatDate, etc.)
│   └── types.ts                            # TypeScript types/interfaces
│
└── middleware.ts                            # Auth middleware
```

---

### C. GEWCI Design System (Tailwind v4)

#### [NEW] [globals.css](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/globals.css)

The entire GEWCI design system defined in CSS using Tailwind v4's `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* === GEWCI Brand Colors === */
  --color-primary: oklch(0.55 0.18 260);        /* Deep royal blue */
  --color-primary-light: oklch(0.70 0.14 260);
  --color-primary-dark: oklch(0.40 0.20 260);
  
  --color-secondary: oklch(0.65 0.15 160);      /* Teal/emerald */
  --color-secondary-light: oklch(0.78 0.12 160);
  --color-secondary-dark: oklch(0.50 0.17 160);
  
  --color-accent: oklch(0.75 0.15 80);          /* Warm gold */
  
  /* Neutrals */
  --color-surface: oklch(0.99 0.005 260);       /* Near-white with slight blue tint */
  --color-surface-alt: oklch(0.96 0.008 260);
  --color-surface-raised: oklch(1.0 0 0);       /* Pure white for cards */
  --color-border: oklch(0.90 0.01 260);
  --color-border-subtle: oklch(0.94 0.005 260);
  --color-text: oklch(0.20 0.02 260);
  --color-text-secondary: oklch(0.45 0.02 260);
  --color-text-tertiary: oklch(0.60 0.01 260);
  
  /* Semantic */
  --color-success: oklch(0.60 0.18 145);
  --color-warning: oklch(0.75 0.15 65);
  --color-error: oklch(0.55 0.22 25);
  --color-info: oklch(0.60 0.15 240);
  
  /* Annotation colors */
  --color-comment: oklch(0.60 0.15 240);        /* Blue */
  --color-highlight: oklch(0.85 0.15 90);       /* Yellow */
  --color-suggestion: oklch(0.65 0.15 160);     /* Green */
  
  /* Dark mode overrides (used with .dark class) */
  --color-dark-surface: oklch(0.15 0.02 260);
  --color-dark-surface-alt: oklch(0.18 0.02 260);
  --color-dark-surface-raised: oklch(0.22 0.025 260);
  --color-dark-border: oklch(0.28 0.02 260);
  --color-dark-text: oklch(0.92 0.01 260);
  --color-dark-text-secondary: oklch(0.70 0.01 260);
  
  /* === Typography === */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  
  /* === Border Radius === */
  --radius-xs: 0.25rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-full: 9999px;
  
  /* === Shadows === */
  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.07), 0 2px 4px -2px oklch(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.08), 0 4px 6px -4px oklch(0 0 0 / 0.04);
  --shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.04);
  --shadow-glow: 0 0 20px oklch(0.55 0.18 260 / 0.15);
  
  /* === Animations === */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;
  --animate-pulse-soft: pulse-soft 2s ease-in-out infinite;
}

/* Dark mode variant */
@variant dark (&:where(.dark, .dark *));

/* Keyframes */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slide-in-right { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
```

Google Fonts loaded in the root layout:
- **Inter** (body text) — clean, readable
- **Outfit** (headings) — modern, friendly
- **JetBrains Mono** (code/monospace) — sharp, readable

---

### D. Supabase Auth Integration

#### [NEW] [lib/supabase/client.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/lib/supabase/client.ts)

Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`.

#### [NEW] [lib/supabase/server.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/lib/supabase/server.ts)

Server-side Supabase client using `createServerClient` with cookie management via `next/headers`.

#### [NEW] [middleware.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/middleware.ts)

Auth middleware that:
1. Refreshes expired Supabase sessions on every request
2. Redirects unauthenticated users to `/login`
3. Checks `tool_access` claims for `document-review` access
4. Skips auth for `/login`, `/auth/callback`, and static assets

#### [NEW] [app/auth/callback/route.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/auth/callback/route.ts)

OAuth/magic-link callback handler that exchanges the auth code for a session.

#### [NEW] [app/login/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/login/page.tsx)

Login page with GEWCI branding. Supports email/password sign-in (expandable to OAuth/magic links).

---

### E. Database Schema

#### [NEW] [supabase/migrations/001_initial_schema.sql](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/supabase/migrations/001_initial_schema.sql)

```sql
-- ============================================
-- GEWCI Shared Tables
-- ============================================

CREATE TABLE IF NOT EXISTS gewci_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  roles TEXT[] DEFAULT '{"document-review:viewer"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gewci_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tool_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES gewci_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tool_type ON gewci_audit_logs(tool_type);
CREATE INDEX idx_audit_action ON gewci_audit_logs(action);
CREATE INDEX idx_audit_user_id ON gewci_audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON gewci_audit_logs(created_at);

-- ============================================
-- Document Review Room (DRR) Tables
-- ============================================

-- Document statuses: draft, in_review, approved, needs_revision, rejected
CREATE TYPE drr_document_status AS ENUM (
  'draft', 'in_review', 'approved', 'needs_revision', 'rejected'
);

CREATE TABLE IF NOT EXISTS drr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT,                    -- Document body (Markdown or plain text)
  status drr_document_status DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES gewci_users(id),
  updated_by UUID REFERENCES gewci_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drr_documents_status ON drr_documents(status);
CREATE INDEX idx_drr_documents_created_by ON drr_documents(created_by);

CREATE TABLE IF NOT EXISTS drr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES drr_documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES drr_comments(id) ON DELETE CASCADE,  -- For threaded replies
  user_id UUID NOT NULL REFERENCES gewci_users(id),
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES gewci_users(id),
  resolved_at TIMESTAMPTZ,
  -- Text selection anchoring (for inline comments)
  anchor_start INT,               -- Character offset start
  anchor_end INT,                  -- Character offset end
  anchor_text TEXT,                -- Snapshot of selected text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drr_comments_document ON drr_comments(document_id);
CREATE INDEX idx_drr_comments_parent ON drr_comments(parent_id);
CREATE INDEX idx_drr_comments_user ON drr_comments(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE gewci_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gewci_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drr_comments ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own" ON gewci_users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON gewci_users
  FOR UPDATE USING (auth.uid() = id);

-- Audit logs: insert-only (no read from client; admin queries via service role)
CREATE POLICY "audit_insert" ON gewci_audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents: all authenticated users can read
CREATE POLICY "documents_read" ON drr_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Documents: admins and editors can create
CREATE POLICY "documents_insert" ON drr_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gewci_users
      WHERE id = auth.uid()
      AND (
        'document-review:admin' = ANY(roles)
        OR 'document-review:editor' = ANY(roles)
      )
    )
  );

-- Documents: owner, admins, and editors can update
CREATE POLICY "documents_update" ON drr_documents
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM gewci_users
      WHERE id = auth.uid()
      AND 'document-review:admin' = ANY(roles)
    )
  );

-- Comments: all authenticated users can read
CREATE POLICY "comments_read" ON drr_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Comments: authenticated users with reviewer+ role can create
CREATE POLICY "comments_insert" ON drr_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gewci_users
      WHERE id = auth.uid()
      AND (
        'document-review:admin' = ANY(roles)
        OR 'document-review:editor' = ANY(roles)
        OR 'document-review:reviewer' = ANY(roles)
      )
    )
  );

-- Comments: own comments can be updated
CREATE POLICY "comments_update" ON drr_comments
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
    ARRAY['document-review:viewer']
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### F. Shared Utilities

#### [NEW] [lib/audit.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/lib/audit.ts)

Audit logging utility function:

```typescript
interface AuditLogEntry {
  tool_type: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function logAudit(supabase: SupabaseClient, entry: AuditLogEntry) {
  await supabase.from('gewci_audit_logs').insert(entry);
}
```

#### [NEW] [lib/utils.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/lib/utils.ts)

- `cn()` — merge Tailwind classes with clsx
- `formatDate()` — human-readable date formatting
- `getInitials()` — extract user initials for avatars

#### [NEW] [lib/types.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/lib/types.ts)

TypeScript interfaces for `GEWCIUser`, `DRRDocument`, `DRRComment`, `AuditLogEntry`, `DocumentStatus`.

---

### G. GEWCI Shared Components

#### [NEW] [components/gewci/Header.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Header.tsx)

Top bar with:
- GEWCI logo (left)
- Tool name "Document Review Room" (center-left)
- App switcher dropdown with future tool placeholders (center)
- User avatar + dropdown menu (right)
- Mobile hamburger menu

#### [NEW] [components/gewci/Breadcrumb.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Breadcrumb.tsx)

`GEWCI > Document Review Room > [current page]` breadcrumb trail.

#### [NEW] [components/gewci/Footer.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Footer.tsx)

Simple footer with GEWCI branding, links to other tools (placeholder), and copyright.

#### [NEW] [components/gewci/Button.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Button.tsx)

Styled button with variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Loading state with spinner.

#### [NEW] [components/gewci/Card.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Card.tsx)

Content card with optional header, body, footer sections. Hover elevation effect.

#### [NEW] [components/gewci/Badge.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Badge.tsx)

Status badge with semantic color variants.

#### [NEW] [components/gewci/Modal.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Modal.tsx)

Accessible dialog modal using `<dialog>` element with backdrop blur.

#### [NEW] [components/gewci/Input.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Input.tsx) & [Textarea.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Textarea.tsx)

Form inputs with consistent GEWCI styling, labels, error states.

#### [NEW] [components/gewci/Avatar.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/Avatar.tsx)

User avatar with fallback to initials, size variants.

#### [NEW] [components/gewci/EmptyState.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/gewci/EmptyState.tsx)

Placeholder for empty lists with icon, title, description, and action button.

---

### H. Document Review Room Components

#### [NEW] [components/drr/DocumentCard.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/DocumentCard.tsx)

Card displaying document summary: title, status badge, author avatar, comment count, last updated date. Click navigates to document detail.

#### [NEW] [components/drr/DocumentReader.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/DocumentReader.tsx)

Full document reader:
- Renders document content (Markdown → HTML)
- Text selection to anchor comments (future enhancement hook)
- Mode indicator badge (Read-only / Editing / Review)
- Mobile-optimized typography and spacing

#### [NEW] [components/drr/CommentThread.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/CommentThread.tsx)

Displays a comment with:
- Author avatar and name
- Timestamp
- Comment body
- Reply thread (nested comments)
- Resolve/unresolve toggle

#### [NEW] [components/drr/CommentForm.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/CommentForm.tsx)

Textarea + submit button for adding comments. Supports both top-level comments and replies.

#### [NEW] [components/drr/CommentSidebar.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/CommentSidebar.tsx)

- **Desktop:** Right sidebar panel showing all comments for the document
- **Mobile:** Slide-up drawer / bottom sheet with comment list
- Filter: All / Resolved / Unresolved

#### [NEW] [components/drr/DocumentCreateForm.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/DocumentCreateForm.tsx)

Form for creating a new document:
- Title input
- Content textarea (plain text / Markdown)
- Status selector (draft by default)
- Submit button

#### [NEW] [components/drr/DashboardStats.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/DashboardStats.tsx)

Stats cards showing:
- Total documents
- Documents by status (draft/review/approved)
- Recent comments count
- Recent activity feed

#### [NEW] [components/drr/DocumentStatusBadge.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/components/drr/DocumentStatusBadge.tsx)

Color-coded status badge: draft (gray), in_review (blue), approved (green), needs_revision (orange), rejected (red).

---

### I. Pages

#### [NEW] [app/layout.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/layout.tsx)

Root layout: `<html>`, `<body>`, Google Fonts (Inter, Outfit, JetBrains Mono), globals.css import, metadata (title, description).

#### [NEW] [app/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/page.tsx)

Redirects to `/document-review`.

#### [NEW] [app/document-review/layout.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/document-review/layout.tsx)

Wraps all DRR pages in:
- `<GEWCIHeader />`
- `<Breadcrumb />`
- `<main>{children}</main>`
- `<GEWCIFooter />`

#### [NEW] [app/document-review/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/document-review/page.tsx)

Dashboard page: stats overview, recent documents, quick actions (create document, view all). Server component that fetches data via Supabase server client.

#### [NEW] [app/document-review/documents/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/document-review/documents/page.tsx)

Document list page: grid/list view of all documents with search, status filter, sort. Responsive grid (1 col mobile, 2 col tablet, 3 col desktop).

#### [NEW] [app/document-review/documents/new/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/document-review/documents/new/page.tsx)

Create document page with `<DocumentCreateForm />`.

#### [NEW] [app/document-review/documents/[id]/page.tsx](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/document-review/documents/%5Bid%5D/page.tsx)

Document detail page:
- `<DocumentReader />` (main content area)
- `<CommentSidebar />` (right panel desktop, drawer mobile)
- `<CommentForm />` (at bottom of sidebar)
- Status badge and document metadata
- Responsive: stacked on mobile, side-by-side on desktop

---

### J. API Routes

#### [NEW] [app/api/v1/documents/route.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/api/v1/documents/route.ts)

- `GET` — List documents (with optional status filter, search, pagination)
- `POST` — Create document (title, content, status)
- Both log to `gewci_audit_logs`

#### [NEW] [app/api/v1/documents/[id]/route.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/api/v1/documents/%5Bid%5D/route.ts)

- `GET` — Fetch single document with comment count
- `PUT` — Update document (title, content, status)
- `DELETE` — Soft delete (set status to archived / or hard delete)
- All log to `gewci_audit_logs`

#### [NEW] [app/api/v1/documents/[id]/comments/route.ts](file:///Users/ismaelwc/Development/personal/gewci-document-reviewer/src/app/api/v1/documents/%5Bid%5D/comments/route.ts)

- `GET` — List comments for document (with nested replies)
- `POST` — Create comment (content, optional parent_id for replies)
- Both log to `gewci_audit_logs`

---

## Build Order

The implementation follows this dependency-first sequence:

| Step | Component | Depends On |
|------|-----------|------------|
| 1 | Project scaffold (`create-next-app`, dependencies) | Nothing |
| 2 | Design system (`globals.css`, fonts) | Step 1 |
| 3 | Supabase clients (`lib/supabase/`) | Step 1 |
| 4 | Database schema (migration SQL) | Supabase project |
| 5 | Auth middleware + login page | Steps 3, 4 |
| 6 | Shared utilities (`lib/audit.ts`, `lib/utils.ts`, `lib/types.ts`) | Step 3 |
| 7 | GEWCI shared components (`components/gewci/`) | Step 2 |
| 8 | DRR components (`components/drr/`) | Steps 6, 7 |
| 9 | API routes (`app/api/v1/`) | Steps 3, 6 |
| 10 | Pages (layout, dashboard, documents, detail) | Steps 7, 8, 9 |
| 11 | Polish (animations, responsive testing, loading states) | Step 10 |

---

## Verification Plan

### Automated Tests

```bash
# Build succeeds
npm run build

# Dev server starts without errors
npm run dev

# TypeScript type checking
npx tsc --noEmit

# ESLint passes
npm run lint
```

### Manual Verification

1. **Auth flow:** Sign up → login → middleware redirects → protected pages accessible
2. **Document CRUD:** Create document → appears in list → view detail → edit → delete
3. **Comments:** Add comment → appears in sidebar → add reply → resolve comment
4. **Audit logs:** Check `gewci_audit_logs` table for entries after each action
5. **Responsive UI:** Test on mobile viewport (375px), tablet (768px), desktop (1280px)
6. **GEWCI branding:** Header, footer, breadcrumb, app switcher visible on all pages
7. **Empty states:** Verify graceful empty states when no documents or comments exist

### Browser Testing

Test in Chrome DevTools responsive mode at breakpoints:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (iPad Pro)
- 1280px+ (Desktop)

---

## What's Deferred (Not in This Plan)

| Feature | Phase |
|---------|-------|
| Drawing/highlight annotations | Phase 2 |
| Document version history | Phase 3 |
| Markdown/PDF export | Phase 3 |
| Google Drive import/export | Phase 4 |
| Real-time collaboration | Phase 5 |
| Offline support (Service Worker, IndexedDB) | Phase 6 |
| i18n infrastructure | Phase 1 prep only (no translations) |
| Review sessions | Phase 2 |

---

End of implementation plan.
