export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'needs_revision' | 'rejected';

export interface GEWCIUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface DRRDocument {
  id: string;
  title: string;
  content: string;
  status: DocumentStatus;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: GEWCIUser; // Populated from relation join
  comment_count?: number;
}

export interface DRRComment {
  id: string;
  document_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  anchor_start: number | null;
  anchor_end: number | null;
  anchor_text: string | null;
  created_at: string;
  updated_at: string;
  user?: GEWCIUser; // Populated from relation join
  replies?: DRRComment[]; // Built client-side or server-side for nested structure
}

export interface AuditLogEntry {
  id?: string;
  tool_type: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at?: string;
}

/**
 * Capability flags for a viewer with respect to a specific document.
 * Computed by the permissions service so server components stop having
 * to redo role lookups. Mirrors the policy predicates in lib/auth/policies.
 */
export interface DocumentViewerCapabilities {
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
}

export interface DashboardStats {
  totalDocs: number;
  inReviewDocs: number;
  approvedDocs: number;
  totalComments: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentDocs: DRRDocument[];
  canCreate: boolean;
}

/**
 * Combined view of a user's profile (`gewci_users`) plus the auth-side
 * facts (`auth.users`) the admin UI needs to render: last sign-in time,
 * email-confirmed status. Returned by `usersService.list` for the admin
 * dashboard. Plain `GEWCIUser` is unchanged.
 */
export interface AdminUserView extends GEWCIUser {
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  auth_created_at: string;
}
