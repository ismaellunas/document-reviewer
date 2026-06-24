"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { Input } from "@/components/gewci/Input";
import { EmptyState } from "@/components/gewci/EmptyState";
import type { PrayerRequest, PrayerRequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PrayerRequestsAdminProps {
  initialRequests: PrayerRequest[];
  initialStatus: "pending" | "prayed" | "all";
  initialFrom?: string;
  initialTo?: string;
}

function displayName(request: PrayerRequest) {
  return [request.first_name, request.last_name].filter(Boolean).join(" ");
}

export function PrayerRequestsAdmin({
  initialRequests,
  initialStatus,
  initialFrom = "",
  initialTo = "",
}: PrayerRequestsAdminProps) {
  const router = useRouter();

  const [requests, setRequests] = React.useState(initialRequests);
  const [status, setStatus] = React.useState(initialStatus);
  const [from, setFrom] = React.useState(initialFrom);
  const [to, setTo] = React.useState(initialTo);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRequests(initialRequests);
    setSelected(new Set());
  }, [initialRequests]);

  const allSelected =
    requests.length > 0 && selected.size === requests.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(requests.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.push(qs ? `/admin/prayer-requests?${qs}` : "/admin/prayer-requests");
  };

  const openPrint = () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    window.open(
      `/admin/prayer-requests/print${qs ? `?${qs}` : ""}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const runBulkAction = async (action: "mark_prayed" | "delete") => {
    if (selected.size === 0) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Delete ${selected.size} prayer request${selected.size === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    setActionError(null);

    try {
      const res = await fetch("/api/v1/admin/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Action failed");
      }

      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-gewci-dark/80 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "pending" | "prayed" | "all")
              }
              className="flex h-10 w-full rounded-[--radius-button] border border-gewci-gray/40 bg-gewci-white px-3 py-2 text-sm text-gewci-dark"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="prayed">Prayed</option>
            </select>
          </div>
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="button" onClick={applyFilters} className="w-full">
              Apply filters
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gewci-gray/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runBulkAction("mark_prayed")}
            disabled={!someSelected || isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Mark prayed</span>
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => runBulkAction("delete")}
            disabled={!someSelected || isLoading}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete selected</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPrint}
            className="gap-1.5 ml-auto"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="text-sm font-medium text-error">{actionError}</p>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="No prayer requests"
          description="Try adjusting your filters or check back later."
        />
      ) : (
        <div className="overflow-x-auto rounded-[--radius-card] border border-gewci-gray/20 bg-gewci-white shadow-xs">
          <table className="min-w-full text-sm">
            <thead className="bg-gewci-gray/5 border-b border-gewci-gray/15">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all prayer requests"
                    className="h-4 w-4 rounded border-gewci-gray/50 text-primary focus:ring-primary/20"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gewci-dark/60">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gewci-dark/60">
                  Request
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gewci-dark/60">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gewci-dark/60">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gewci-gray/10">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gewci-gray/5">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(request.id)}
                      onChange={() => toggleOne(request.id)}
                      aria-label={`Select prayer request from ${displayName(request)}`}
                      className="h-4 w-4 rounded border-gewci-gray/50 text-primary focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-gewci-dark whitespace-nowrap">
                    {displayName(request)}
                    {(request.wants_pray_with || request.contact_via_email) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {request.wants_pray_with && (
                          <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-primary/10 text-primary px-1.5 py-0.5">
                            Pray together
                          </span>
                        )}
                        {request.contact_via_email && (
                          <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-secondary/15 text-gewci-dark/70 px-1.5 py-0.5">
                            Email contact
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-gewci-dark/80 max-w-md">
                    <p className="line-clamp-3 whitespace-pre-wrap">{request.body}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-gewci-dark/60 whitespace-nowrap">
                    {formatDate(request.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PrayerRequestStatus }) {
  const isPending = status === "pending";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isPending
          ? "bg-warning/15 text-warning"
          : "bg-success/10 text-success"
      }`}
    >
      {isPending ? "Pending" : "Prayed"}
    </span>
  );
}
