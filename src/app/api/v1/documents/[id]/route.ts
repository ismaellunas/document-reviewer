import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// GET /api/v1/documents/[id]
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

    const { data: document, error } = await supabase
      .from("drr_documents")
      .select(`
        *,
        creator:gewci_users!drr_documents_created_by_fkey (
          id,
          email,
          display_name,
          avatar_url,
          roles
        )
      `)
      .eq("id", id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (err: any) {
    console.error("GET document detail API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/v1/documents/[id]
export async function PUT(
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

    const body = await request.json();
    const { title, content, status } = body;

    // Fetch existing document to check owner and roles
    const { data: existingDoc, error: fetchError } = await supabase
      .from("drr_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check permissions
    const { data: gewciUser } = await supabase
      .from("gewci_users")
      .select("roles")
      .eq("id", user.id)
      .single();

    const roles = gewciUser?.roles || [];
    const isAdmin = roles.includes("document-review:admin");
    const isEditor = roles.includes("document-review:editor");
    const isOwner = existingDoc.created_by === user.id;

    if (!isAdmin && !isEditor && !isOwner) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to edit this document" },
        { status: 403 }
      );
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    updates.updated_by = user.id;
    updates.updated_at = new Date().toISOString();

    const { data: updatedDoc, error: updateError } = await supabase
      .from("drr_documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the audit event
    await logAudit(
      supabase,
      {
        tool_type: "document-review",
        user_id: user.id,
        action: "document_updated",
        resource_type: "document",
        resource_id: id,
        details: {
          status_changed: existingDoc.status !== updatedDoc.status,
          old_status: existingDoc.status,
          new_status: updatedDoc.status,
        },
      },
      request
    );

    return NextResponse.json({ document: updatedDoc });
  } catch (err: any) {
    console.error("PUT document API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/v1/documents/[id]
export async function DELETE(
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

    // Fetch existing document to check owner
    const { data: existingDoc, error: fetchError } = await supabase
      .from("drr_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check permissions (Only admin or owner can delete)
    const { data: gewciUser } = await supabase
      .from("gewci_users")
      .select("roles")
      .eq("id", user.id)
      .single();

    const roles = gewciUser?.roles || [];
    const isAdmin = roles.includes("document-review:admin");
    const isOwner = existingDoc.created_by === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Access Denied: Only the creator or an Admin can delete this document" },
        { status: 403 }
      );
    }

    // Use .select() so we can verify rows were actually removed -- RLS may
    // silently filter the delete and still return 200 with zero rows touched.
    const { data: deletedRows, error: deleteError } = await supabase
      .from("drr_documents")
      .delete()
      .eq("id", id)
      .select("id");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.error("DELETE returned zero rows -- check RLS policies for drr_documents", { id });
      return NextResponse.json(
        {
          error:
            "Delete was blocked by a database policy. Ask an admin to verify RLS on drr_documents.",
        },
        { status: 403 },
      );
    }

    // Log the audit event
    await logAudit(
      supabase,
      {
        tool_type: "document-review",
        user_id: user.id,
        action: "document_deleted",
        resource_type: "document",
        resource_id: id,
        details: { title: existingDoc.title },
      },
      request
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE document API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
