import { z } from "zod";

const DocumentStatusEnum = z.enum([
  "draft",
  "in_review",
  "approved",
  "needs_revision",
  "rejected",
]);

const trimmedNonEmpty = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const CreateDocumentSchema = z.object({
  title: trimmedNonEmpty(500, "Title"),
  content: z.string().trim().min(1, "Content is required"),
  status: DocumentStatusEnum.default("draft"),
});

export const UpdateDocumentSchema = z
  .object({
    title: trimmedNonEmpty(500, "Title").optional(),
    content: z.string().trim().min(1, "Content is required").optional(),
    status: DocumentStatusEnum.optional(),
  })
  .refine(
    (v) => v.title !== undefined || v.content !== undefined || v.status !== undefined,
    { message: "No fields to update" },
  );

export const ListDocumentsQuerySchema = z.object({
  status: DocumentStatusEnum.optional(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof ListDocumentsQuerySchema>;
