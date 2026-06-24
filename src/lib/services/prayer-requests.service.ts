import { ValidationError } from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import {
  BulkPrayerRequestActionSchema,
  ListPrayerRequestsQuerySchema,
  SubmitPrayerRequestSchema,
  type BulkPrayerRequestAction,
  type ListPrayerRequestsQuery,
  type SubmitPrayerRequestInput,
} from "@/lib/schemas/prayer-requests";
import { prayerRequestsRepo } from "@/lib/repositories/prayer-requests.repo";
import { permissionsService } from "@/lib/services/permissions.service";
import { createPublicClient } from "@/lib/supabase/public";
import type { PrayerRequest } from "@/lib/types";

export const prayerRequestsService = {
  async submitPublic(rawInput: SubmitPrayerRequestInput): Promise<PrayerRequest> {
    const input = SubmitPrayerRequestSchema.parse(rawInput);

    if (input.website) {
      throw new ValidationError("Submission rejected");
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new ValidationError("Prayer requests are not configured");
    }

    const supabase = createPublicClient();
    return prayerRequestsRepo.create(supabase, {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      body: input.body,
      wants_pray_with: input.wants_pray_with,
      contact_via_email: input.contact_via_email,
    });
  },

  async listForAdmin(
    ctx: RequestContext,
    rawQuery: ListPrayerRequestsQuery,
  ): Promise<PrayerRequest[]> {
    await permissionsService.requireAdmin(ctx);
    const query = ListPrayerRequestsQuerySchema.parse(rawQuery);
    return prayerRequestsRepo.list(ctx.supabase, query);
  },

  async bulkAction(
    ctx: RequestContext,
    rawInput: BulkPrayerRequestAction,
  ): Promise<{ affected: number }> {
    await permissionsService.requireAdmin(ctx);
    const input = BulkPrayerRequestActionSchema.parse(rawInput);

    if (input.action === "mark_prayed") {
      const affected = await prayerRequestsRepo.markPrayed(
        ctx.supabase,
        input.ids,
      );
      return { affected };
    }

    const affected = await prayerRequestsRepo.deleteByIds(
      ctx.supabase,
      input.ids,
    );
    return { affected };
  },
};
