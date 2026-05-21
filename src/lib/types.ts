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
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at?: string;
}
