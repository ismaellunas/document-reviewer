import { z } from "zod";

export const CreateAuditEntrySchema = z.object({
  action: z.string().trim().min(1, "Action is required").max(100),
  resource_type: z.string().trim().max(50).nullable().optional().default(null),
  resource_id: z.string().trim().max(100).nullable().optional().default(null),
  details: z.record(z.string(), z.unknown()).optional().default({}),
});

export type CreateAuditEntryInput = z.infer<typeof CreateAuditEntrySchema>;
