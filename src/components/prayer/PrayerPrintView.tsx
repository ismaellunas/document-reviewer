"use client";

import React from "react";
import { format } from "date-fns";
import type { PrayerRequest } from "@/lib/types";

interface PrayerPrintViewProps {
  requests: PrayerRequest[];
  statusLabel: string;
  from?: string;
  to?: string;
}

function displayName(request: PrayerRequest) {
  return [request.first_name, request.last_name].filter(Boolean).join(" ");
}

export function PrayerPrintView({
  requests,
  statusLabel,
  from,
  to,
}: PrayerPrintViewProps) {
  React.useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const periodLabel = React.useMemo(() => {
    if (from && to) return `${from} to ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Through ${to}`;
    return "All dates";
  }, [from, to]);

  return (
    <div className="prayer-print-document bg-white text-black min-h-screen p-8 sm:p-12">
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
        <p className="text-sm text-black/60">No prayer requests match these filters.</p>
      ) : (
        <div className="space-y-8">
          {requests.map((request, index) => (
            <article key={request.id} className="break-inside-avoid">
              <h2 className="text-lg font-bold">
                {index + 1}. {displayName(request)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {request.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
