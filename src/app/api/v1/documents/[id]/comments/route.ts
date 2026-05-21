import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// GET /api/v1/documents/[id]/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: comments, error } = await supabase
      .from("drr_comments")
      .select(`
        *,
        user:gewci_users!drr_comments_user_id_fkey (
          id,
          email,
          display_name,
          avatar_url,
          roles
        )
      `)
      .eq("document_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments });
  } catch (err: any) {
    console.error("GET comments API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/documents/[id]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, parent_id = null, anchor_text = null, anchor_start = null, anchor_end = null } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Check if user has reviewer+ role
    const { data: gewciUser } = await supabase
      .from("gewci_users")
      .select("roles")
      .eq("id", user.id)
      .single();

    const roles = gewciUser?.roles || [];
    const canComment =
      roles.includes("document-review:admin") ||
      roles.includes("document-review:editor") ||
      roles.includes("document-review:reviewer");

    if (!canComment) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to comment on documents" },
        { status: 403 }
      );
    }

    const { data: comment, error } = await supabase
      .from("drr_comments")
      .insert({
        document_id: documentId,
        parent_id,
        user_id: user.id,
        content,
        anchor_text,
        anchor_start,
        anchor_end,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the audit event
    await logAudit(
      supabase,
      {
        tool_type: "document-review",
        user_id: user.id,
        action: "annotation_added",
        resource_type: "annotation",
        resource_id: comment.id,
        details: {
          document_id: documentId,
          is_reply: !!parent_id,
          parent_comment_id: parent_id,
          has_anchor: !!anchor_text,
        },
      },
      request
    );

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    console.error("POST comment API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
