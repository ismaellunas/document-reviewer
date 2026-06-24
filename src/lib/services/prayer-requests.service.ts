import { ValidationError } from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import { generateAnonymousPrayerName } from "@/lib/prayer/anonymous-name";
import { collectPrayerRequestClientMetadata } from "@/lib/prayer/client-metadata";
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
  async submitPublic(
    rawInput: SubmitPrayerRequestInput,
    request: Request,
  ): Promise<PrayerRequest> {
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

    const clientMetadata = collectPrayerRequestClientMetadata(
      request,
      input.timezone,
    );

    const supabase = createPublicClient();
    return prayerRequestsRepo.create(supabase, {
      first_name: input.is_anonymous
        ? generateAnonymousPrayerName()
        : input.first_name!,
      last_name: input.is_anonymous ? undefined : input.last_name,
      email: input.email,
      phone: input.phone,
      body: input.body,
      wants_pray_with: input.wants_pray_with,
      contact_via_email: input.contact_via_email,
      is_anonymous: input.is_anonymous,
      client_metadata: clientMetadata,
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
