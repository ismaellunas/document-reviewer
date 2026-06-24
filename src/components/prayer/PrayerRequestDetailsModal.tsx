"use client";

import type { PrayerRequest } from "@/lib/types";
import { Modal } from "@/components/gewci/Modal";
import { Button } from "@/components/gewci/Button";
import {
  formatPrayerRequestMetadata,
  hasPrayerRequestMetadata,
  prayerRequestDisplayName,
} from "@/lib/prayer/display";
import { formatDate } from "@/lib/utils";

interface PrayerRequestDetailsModalProps {
  request: PrayerRequest | null;
  onClose: () => void;
}

export function PrayerRequestDetailsModal({
  request,
  onClose,
}: PrayerRequestDetailsModalProps) {
  if (!request) return null;

  const metadata = formatPrayerRequestMetadata(request.client_metadata);

  return (
    <Modal
      isOpen={!!request}
      onClose={onClose}
      title="Request details"
      className="max-w-2xl"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gewci-dark/50">
            Submitter
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailItem label="Name" value={prayerRequestDisplayName(request)} />
            <DetailItem
              label="Anonymous"
              value={request.is_anonymous ? "Yes" : "No"}
            />
            <DetailItem label="Email" value={request.email ?? "—"} />
            <DetailItem label="Phone" value={request.phone ?? "—"} />
            <DetailItem label="Status" value={request.status} />
            <DetailItem label="Submitted" value={formatDate(request.created_at)} />
          </dl>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gewci-dark/50">
            Preferences
          </h4>
          <ul className="text-sm space-y-1 text-gewci-dark/80">
            <li>
              Pray together: {request.wants_pray_with ? "Yes" : "No"}
            </li>
            <li>
              Contact via email: {request.contact_via_email ? "Yes" : "No"}
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gewci-dark/50">
            Prayer request
          </h4>
          <p className="text-sm whitespace-pre-wrap text-gewci-dark/80">
            {request.body}
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gewci-dark/50">
            Technical details
          </h4>
          {hasPrayerRequestMetadata(request.client_metadata) ? (
            <dl className="grid grid-cols-1 gap-3 text-sm">
              {metadata.map((item) => (
                <DetailItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  mono={item.label === "User agent" || item.label === "IP address"}
                />
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gewci-dark/50">
              No technical details were recorded for this request.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-gewci-dark/45">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-gewci-dark break-words ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
