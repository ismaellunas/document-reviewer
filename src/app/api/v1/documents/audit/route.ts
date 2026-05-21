import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

// POST /api/v1/documents/audit
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, resource_type, resource_id, details = {} } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    await logAudit(
      supabase,
      {
        tool_type: "document-review",
        user_id: user.id,
        action,
        resource_type: resource_type || null,
        resource_id: resource_id || null,
        details: details || {},
      },
      request
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST audit API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
