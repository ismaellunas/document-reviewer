/**
 * Repository for `drr_comments`. All Supabase queries against the comments
 * table funnel through here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DRRComment } from "@/lib/types";
import { COMMENT_WITH_AUTHOR } from "@/lib/db/select-fragments";

export interface CommentCreateInput {
  document_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  anchor_text: string | null;
  anchor_start: number | null;
  anchor_end: number | null;
}

export interface CommentResolutionInput {
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
}

export const commentsRepo = {
  async listForDocument(
    supabase: SupabaseClient,
    documentId: string,
  ): Promise<DRRComment[]> {
    const { data, error } = await supabase
      .from("drr_comments")
      .select(COMMENT_WITH_AUTHOR)
      .eq("document_id", documentId)
      .order("created_at", { ascending: true })
      .returns<DRRComment[]>();

    if (error) {
      throw new Error(`commentsRepo.listForDocument: ${error.message}`);
    }
    return data ?? [];
  },

  async findById(
    supabase: SupabaseClient,
    id: string,
  ): Promise<DRRComment | null> {
    const { data, error } = await supabase
      .from("drr_comments")
      .select("*")
      .eq("id", id)
      .maybeSingle<DRRComment>();

    if (error) {
      console.error("commentsRepo.findById error:", { id, error });
      return null;
    }
    return data;
  },

  async create(
    supabase: SupabaseClient,
    input: CommentCreateInput,
  ): Promise<DRRComment> {
    const { data, error } = await supabase
      .from("drr_comments")
      .insert({
        document_id: input.document_id,
        parent_id: input.parent_id,
        user_id: input.user_id,
        content: input.content,
        anchor_text: input.anchor_text,
        anchor_start: input.anchor_start,
        anchor_end: input.anchor_end,
      })
      .select()
      .single<DRRComment>();

    if (error || !data) {
      throw new Error(
        `commentsRepo.create: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  async updateResolution(
    supabase: SupabaseClient,
    id: string,
    input: CommentResolutionInput,
  ): Promise<{ affected: number; comment: DRRComment | null }> {
    const { data, error } = await supabase
      .from("drr_comments")
      .update({
        is_resolved: input.is_resolved,
        resolved_by: input.resolved_by,
        resolved_at: input.resolved_at,
      })
      .eq("id", id)
      .select()
      .maybeSingle<DRRComment>();

    if (error) {
      throw new Error(`commentsRepo.updateResolution: ${error.message}`);
    }

    return { affected: data ? 1 : 0, comment: data };
  },

  async delete(supabase: SupabaseClient, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("drr_comments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`commentsRepo.delete: ${error.message}`);
    }
    return true;
  },

  async countAll(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from("drr_comments")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("commentsRepo.countAll error:", error);
      return 0;
    }
    return count ?? 0;
  },
};
