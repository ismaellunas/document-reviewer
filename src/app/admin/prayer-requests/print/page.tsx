import { prayerRequestsService } from "@/lib/services/prayer-requests.service";
import { getServerContext } from "@/lib/http";
import { ListPrayerRequestsQuerySchema } from "@/lib/schemas/prayer-requests";
import { PrayerPrintView } from "@/components/prayer/PrayerPrintView";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function PrayerPrintPage({ searchParams }: PageProps) {
  const ctx = await getServerContext();
  const params = await searchParams;

  const query = ListPrayerRequestsQuerySchema.parse({
    status: params.status ?? "all",
    from: params.from,
    to: params.to,
  });

  const prayerRequests = await prayerRequestsService.listForAdmin(ctx, query);

  const statusLabel =
    query.status === "all"
      ? "All statuses"
      : query.status === "pending"
        ? "Pending only"
        : "Prayed only";

  return (
    <PrayerPrintView
      requests={prayerRequests}
      statusLabel={statusLabel}
      from={query.from}
      to={query.to}
    />
  );
}
