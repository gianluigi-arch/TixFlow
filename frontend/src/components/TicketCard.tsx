'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  MapPin,
  Maximize2,
  Tag,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TicketStatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, formatShortDate } from '@/lib/format';
import type { TicketItem } from '@/types/api';

export function TicketCard({ ticket }: { ticket: TicketItem }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);

  const eventTitle = ticket.tier?.event?.title || 'Event Kampus';
  const eventDate = ticket.tier?.event?.eventDate;
  const eventLocation = ticket.tier?.event?.location || 'Lokasi belum tersedia';
  const tierName = ticket.tier?.name || 'Tiket';
  const tierPrice = ticket.tier?.price ?? 0;

  useEffect(() => {
    if (!isQrModalOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQrModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQrModalOpen]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadPng = () => {
    const svgEl = qrWrapperRef.current?.querySelector('svg');
    if (!svgEl) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const size = 512;
      const padding = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `tixflow-qr-${ticket.ticketCode.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloaded(true);
        window.setTimeout(() => setDownloaded(false), 2000);
      }
      URL.revokeObjectURL(svgUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  return (
    <>
      <article className="overflow-hidden rounded-lg border border-slate-200 border-l-4 border-l-blue-600 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row">
          {/* Left Structured E-Ticket Details */}
          <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  E-Ticket
                </span>
                <TicketStatusBadge status={ticket.status} />
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                {eventTitle}
              </h2>

              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Tag className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Kategori &amp; Harga
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                      {tierName} • {formatCurrency(tierPrice)}
                    </dd>
                  </div>
                </div>

                {eventDate && (
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Jadwal Acara
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                        {formatDateTime(eventDate)}
                      </dd>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 sm:col-span-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Lokasi
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                      {eventLocation}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p>
                Dipesan:{' '}
                <span className="font-semibold text-slate-700">
                  {formatShortDate(ticket.createdAt)}
                </span>
              </p>
              <p>
                Check-in:{' '}
                <span className="font-semibold text-slate-700">
                  {ticket.checkedInAt ? formatShortDate(ticket.checkedInAt) : 'Belum digunakan'}
                </span>
              </p>
            </div>
          </div>

          {/* Right Clean QR Code Panel */}
          <div className="flex flex-col items-center justify-center border-t border-dashed border-slate-200 bg-slate-50 p-5 sm:p-6 md:w-72 md:border-l md:border-t-0">
            <span className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scan di Gerbang
            </span>

            <div
              ref={qrWrapperRef}
              role="img"
              aria-label={`QR Code tiket untuk ${eventTitle} dengan kode ${ticket.ticketCode}`}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <QRCodeSVG
                value={ticket.ticketCode}
                size={148}
                level="M"
                includeMargin
              />
            </div>

            <p
              title={ticket.ticketCode}
              className="mt-3 w-full truncate text-center font-mono text-[11px] font-medium text-slate-600"
            >
              {ticket.ticketCode}
            </p>

            <div className="mt-3 grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Perbesar QR
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                aria-live="polite"
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {downloaded ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    Tersimpan
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Unduh PNG
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              aria-live="polite"
              className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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

      {/* High-Contrast Enlarged QR Modal */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`qr-modal-title-${ticket.id}`}
          onClick={() => setIsQrModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 text-left">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  QR Code Check-in
                </p>
                <h3
                  id={`qr-modal-title-${ticket.id}`}
                  className="mt-1 truncate text-lg font-bold text-slate-900"
                >
                  {eventTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                aria-label="Tutup modal QR"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {tierName}
              </span>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="mx-auto mt-5 inline-flex rounded-lg border-2 border-slate-900 bg-white p-4">
              <QRCodeSVG
                value={ticket.ticketCode}
                size={260}
                level="M"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#0F172A"
              />
            </div>

            <p className="mt-4 break-all font-mono text-xs font-semibold text-slate-800">
              {ticket.ticketCode}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh PNG
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
