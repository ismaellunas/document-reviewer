import { prayerRequestsService } from "@/lib/services/prayer-requests.service";
import { getServerContext } from "@/lib/http";
import { ListPrayerRequestsQuerySchema } from "@/lib/schemas/prayer-requests";
import { PrayerRequestsAdmin } from "@/components/prayer/PrayerRequestsAdmin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminPrayerRequestsPage({
  searchParams,
}: PageProps) {
  const ctx = await getServerContext();
  const params = await searchParams;

  const query = ListPrayerRequestsQuerySchema.parse({
    status: params.status ?? "all",
    from: params.from,
    to: params.to,
  });

  const prayerRequests = await prayerRequestsService.listForAdmin(ctx, query);

  return (
    <div className="space-y-6">
      <div className="space-y-1 select-none">
        <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight">
          Prayer Requests
        </h1>
        <p className="text-xs text-gewci-dark/50">
          Review submissions, mark requests as prayed, print lists, or delete
          selected entries.
        </p>
      </div>

      <PrayerRequestsAdmin
        initialRequests={prayerRequests}
        initialStatus={query.status}
        initialFrom={query.from ?? ""}
        initialTo={query.to ?? ""}
      />
    </div>
  );
}
