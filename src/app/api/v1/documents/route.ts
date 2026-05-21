import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// GET /api/v1/documents
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("drr_documents")
      .select(`
        *,
        creator:gewci_users!drr_documents_created_by_fkey (
          id,
          email,
          display_name,
          avatar_url,
          roles
        ),
        comments:drr_comments (
          id
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: documents, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format documents to include comment count
    const formattedDocs = (documents || []).map((doc: any) => ({
      ...doc,
      comment_count: doc.comments ? doc.comments.length : 0,
      comments: undefined, // remove raw array from output
    }));

    return NextResponse.json({ documents: formattedDocs });
  } catch (err: any) {
    console.error("GET documents API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/documents
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status = "draft" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Check permission to create (admin or editor)
    const { data: gewciUser, error: userError } = await supabase
      .from("gewci_users")
      .select("roles")
      .eq("id", user.id)
      .single();

    const roles = gewciUser?.roles || [];
    const canCreate = roles.includes("document-review:admin") || roles.includes("document-review:editor");
    
    if (userError || !canCreate) {
      return NextResponse.json(
        { error: "Access Denied: Only Admins and Editors can create documents" },
        { status: 403 }
      );
    }

    const { data: document, error } = await supabase
      .from("drr_documents")
      .insert({
        title,
        content,
        status,
        created_by: user.id,
        updated_by: user.id,
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
        action: "document_created",
        resource_type: "document",
        resource_id: document.id,
        details: { title, status },
      },
      request
    );

    return NextResponse.json({ document }, { status: 201 });
  } catch (err: any) {
    console.error("POST document API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
