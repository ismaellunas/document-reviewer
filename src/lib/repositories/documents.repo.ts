/**
 * Repository for `drr_documents`. All Supabase queries against the
 * documents table funnel through here. Callers receive normalized
 * domain types (with `comment_count` already collapsed where relevant).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentStatus, DRRDocument } from "@/lib/types";
import {
  DOCUMENT_WITH_CREATOR,
  DOCUMENT_WITH_CREATOR_AND_COMMENT_COUNT,
} from "@/lib/db/select-fragments";

export interface DocumentCreateInput {
  title: string;
  content: string;
  status: DocumentStatus;
  created_by: string;
}

export interface DocumentUpdateInput {
  title?: string;
  content?: string;
  status?: DocumentStatus;
  updated_by: string;
}

interface RawDocumentWithComments extends DRRDocument {
  comments?: Array<{ id: string }>;
}

function collapseCommentCount(row: RawDocumentWithComments): DRRDocument {
  const { comments, ...rest } = row;
  return {
    ...rest,
    comment_count: comments ? comments.length : 0,
  };
}

export const documentsRepo = {
  /**
   * List all documents (newest first) with the creator profile and a
   * `comment_count` summary. Optionally filter by status.
   */
  async listWithCreator(
    supabase: SupabaseClient,
    options: { status?: DocumentStatus; limit?: number } = {},
  ): Promise<DRRDocument[]> {
    let query = supabase
      .from("drr_documents")
      .select(DOCUMENT_WITH_CREATOR_AND_COMMENT_COUNT)
      .order("created_at", { ascending: false });

    if (options.status) {
      query = query.eq("status", options.status);
    }

    if (typeof options.limit === "number") {
      query = query.limit(options.limit);
    }

    const { data, error } = await query.returns<RawDocumentWithComments[]>();
    if (error) {
      throw new Error(`documentsRepo.listWithCreator: ${error.message}`);
    }
    return (data ?? []).map(collapseCommentCount);
  },

  async findById(
    supabase: SupabaseClient,
    id: string,
  ): Promise<DRRDocument | null> {
    const { data, error } = await supabase
      .from("drr_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle<DRRDocument>();

    if (error) {
      console.error("documentsRepo.findById error:", { id, error });
      return null;
    }
    return data;
  },

  async findByIdWithCreator(
    supabase: SupabaseClient,
    id: string,
  ): Promise<DRRDocument | null> {
    const { data, error } = await supabase
      .from("drr_documents")
      .select(DOCUMENT_WITH_CREATOR)
      .eq("id", id)
      .maybeSingle<DRRDocument>();

    if (error) {
      console.error("documentsRepo.findByIdWithCreator error:", { id, error });
      return null;
    }
    return data;
  },

  async create(
    supabase: SupabaseClient,
    input: DocumentCreateInput,
  ): Promise<DRRDocument> {
    const { data, error } = await supabase
      .from("drr_documents")
      .insert({
        title: input.title,
        content: input.content,
        status: input.status,
        created_by: input.created_by,
        updated_by: input.created_by,
      })
      .select()
      .single<DRRDocument>();

    if (error || !data) {
      throw new Error(
        `documentsRepo.create: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    input: DocumentUpdateInput,
  ): Promise<DRRDocument> {
    const updates: Record<string, unknown> = {
      updated_by: input.updated_by,
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updates.title = input.title;
    if (input.content !== undefined) updates.content = input.content;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await supabase
      .from("drr_documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single<DRRDocument>();

    if (error || !data) {
      throw new Error(
        `documentsRepo.update: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  /**
   * Delete a document and confirm at least one row was actually removed.
   * RLS will silently filter the delete and still return 200 with zero
   * rows if a policy is missing, so we ask Supabase to echo back the ids
   * it touched and surface that as `affected`.
   */
  async deleteAndConfirm(
    supabase: SupabaseClient,
    id: string,
  ): Promise<{ affected: number }> {
    const { data, error } = await supabase
      .from("drr_documents")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      throw new Error(`documentsRepo.deleteAndConfirm: ${error.message}`);
    }

    return { affected: data?.length ?? 0 };
  },

  async countByStatus(
    supabase: SupabaseClient,
    status?: DocumentStatus,
  ): Promise<number> {
    let query = supabase
      .from("drr_documents")
      .select("*", { count: "exact", head: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { count, error } = await query;
    if (error) {
      console.error("documentsRepo.countByStatus error:", { status, error });
      return 0;
    }
    return count ?? 0;
  },
};
