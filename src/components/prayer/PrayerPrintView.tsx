"use client";

import React from "react";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import type { PrayerRequest } from "@/lib/types";
import { Button } from "@/components/gewci/Button";
import {
  formatPrayerRequestMetadata,
  prayerRequestDisplayName,
} from "@/lib/prayer/display";

interface PrayerPrintViewProps {
  requests: PrayerRequest[];
  statusLabel: string;
  from?: string;
  to?: string;
}

export function PrayerPrintView({
  requests,
  statusLabel,
  from,
  to,
}: PrayerPrintViewProps) {
  const [includeMetadata, setIncludeMetadata] = React.useState(false);

  const periodLabel = React.useMemo(() => {
    if (from && to) return `${from} to ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Through ${to}`;
    return "All dates";
  }, [from, to]);

  return (
    <div className="prayer-print-document bg-white text-black min-h-screen">
      <div className="print:hidden sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
            className="h-4 w-4 rounded border-black/30"
          />
          <span>Include technical details (IP, browser, timezone)</span>
        </label>
        <Button type="button" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>

      <div className="p-8 sm:p-12">
        <header className="border-b border-black/15 pb-4 mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">
            GEWCI Ministry Tools
          </p>
          <h1 className="text-2xl font-bold mt-1">Prayer Requests</h1>
          <p className="text-sm text-black/60 mt-2">
            {statusLabel} · {periodLabel} · Printed{" "}
            {format(new Date(), "PPP")}
          </p>
        </header>

        {requests.length === 0 ? (
          <p className="text-sm text-black/60">
            No prayer requests match these filters.
          </p>
        ) : (
          <div className="space-y-8">
            {requests.map((request, index) => {
              const metadata = includeMetadata
                ? formatPrayerRequestMetadata(request.client_metadata)
                : [];

              return (
                <article key={request.id} className="break-inside-avoid">
                  <h2 className="text-lg font-bold">
                    {index + 1}. {prayerRequestDisplayName(request)}
                    {request.is_anonymous ? " (anonymous)" : ""}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {request.body}
                  </p>
                  {includeMetadata && metadata.length > 0 && (
                    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-black/65">
                      {metadata.map((item) => (
                        <div key={item.label}>
                          <dt className="font-semibold uppercase tracking-wide">
                            {item.label}
                          </dt>
                          <dd className="break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
