import { z } from "zod";

export const CreateCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required"),
  parent_id: z.uuid().nullable().optional().default(null),
  anchor_text: z.string().nullable().optional().default(null),
  anchor_start: z.number().int().nonnegative().nullable().optional().default(null),
  anchor_end: z.number().int().nonnegative().nullable().optional().default(null),
});

export const UpdateCommentResolutionSchema = z.object({
  is_resolved: z.boolean(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentResolutionInput = z.infer<
  typeof UpdateCommentResolutionSchema
>;
