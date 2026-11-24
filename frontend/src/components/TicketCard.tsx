'use client';

import { useState } from 'react';
import { CalendarDays, Check, Copy, MapPin, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, formatShortDate } from '@/lib/format';
import type { TicketItem } from '@/types/api';

export function TicketCard({ ticket }: { ticket: TicketItem }) {
  const [copied, setCopied] = useState(false);

  const eventTitle = ticket.tier?.event?.title || 'Event Kampus';
  const eventDate = ticket.tier?.event?.eventDate;
  const eventLocation = ticket.tier?.event?.location || 'Lokasi belum tersedia';
  const tierName = ticket.tier?.name || 'Tiket';
  const tierPrice = ticket.tier?.price ?? 0;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        {/* Ticket Metadata */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <TicketStatusBadge status={ticket.status} />
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {tierName} • {formatCurrency(tierPrice)}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{eventTitle}</h2>

            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              {eventDate && (
                <div className="flex items-start gap-2">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="sr-only">Tanggal Event</dt>
                    <dd>{formatDateTime(eventDate)}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                  aria-hidden="true"
                />
                <div>
                  <dt className="sr-only">Lokasi</dt>
                  <dd>{eventLocation}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p>Dipesan: {formatShortDate(ticket.createdAt)}</p>
            {ticket.checkedInAt && (
              <p className="mt-0.5 font-medium text-slate-700">
                Check-in pada: {formatShortDate(ticket.checkedInAt)}
              </p>
            )}
          </div>
        </div>

        {/* Perforation Divider + QR Section */}
        <div className="flex flex-col items-center justify-center border-t border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6 md:w-64 md:border-l md:border-t-0">
          <div
            role="img"
            aria-label={`QR Code tiket untuk ${eventTitle} dengan kode ${ticket.ticketCode}`}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <QRCodeSVG
              value={ticket.ticketCode}
              size={156}
              level="M"
              includeMargin
            />
          </div>

          <p className="mt-3 max-w-full break-all text-center font-mono text-[11px] font-medium text-slate-600">
            {ticket.ticketCode}
          </p>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-live="polite"
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                Kode Disalin
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Salin Kode Tiket
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
