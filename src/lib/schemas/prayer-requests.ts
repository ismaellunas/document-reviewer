import { z } from "zod";

const optionalShortText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .optional()
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Enter a valid email address",
  )
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const SubmitPrayerRequestSchema = z
  .object({
    is_anonymous: z.boolean().optional().default(false),
    first_name: optionalShortText(80),
    last_name: optionalShortText(80),
    email: optionalEmail,
    phone: optionalShortText(20),
    body: z.string().trim().min(1, "Prayer request is required").max(8000),
    wants_pray_with: z.boolean().optional().default(false),
    contact_via_email: z.boolean().optional().default(false),
    timezone: optionalShortText(80),
    /** Honeypot — must be empty for real submissions. */
    website: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_anonymous && !data.first_name) {
      ctx.addIssue({
        code: "custom",
        message: "First name is required",
        path: ["first_name"],
      });
    }
  });

export const ListPrayerRequestsQuerySchema = z.object({
  status: z.enum(["pending", "prayed", "all"]).optional().default("all"),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export const BulkPrayerRequestActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one request"),
  action: z.enum(["mark_prayed", "delete"]),
});

export type SubmitPrayerRequestInput = z.infer<typeof SubmitPrayerRequestSchema>;
export type ListPrayerRequestsQuery = z.infer<typeof ListPrayerRequestsQuerySchema>;
export type BulkPrayerRequestAction = z.infer<typeof BulkPrayerRequestActionSchema>;
