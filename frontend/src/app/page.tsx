'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { EmptyState, ErrorBanner, EventCardSkeleton } from '@/components/StateViews';
import { QuotaBadge } from '@/components/StatusBadge';
import { ApiError, eventsApi } from '@/lib/api';
import { formatCurrency, formatShortDate } from '@/lib/format';
import type { EventItem } from '@/types/api';

export default function CatalogPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat daftar event. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return events;
    }
    return events.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q),
    );
  }, [events, searchQuery]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Ticketing Event Kampus Real-Time
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Temukan &amp; Pesan Tiket Event Kampus Favoritmu
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                Pemesanan tiket dengan penguncian kuota atomik anti-overselling serta QR Code
                digital untuk check-in cepat di lokasi acara.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full lg:max-w-sm">
              <label
                htmlFor="event-search"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Cari Event
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="event-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul atau lokasi event..."
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading ? (
          <div
            aria-label="Memuat daftar event"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <EventCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <ErrorBanner
            title="Gagal Memuat Katalog Event"
            message={error}
            onRetry={() => void loadEvents()}
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="Belum Ada Event Tersedia"
            description="Saat ini belum ada event kampus yang dipublikasikan. Panitia dapat membuat event baru dari Dashboard Panitia."
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="Event Tidak Ditemukan"
            description={`Tidak ada event yang cocok dengan kata kunci "${searchQuery}".`}
            actionLabel="Reset Pencarian"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Menampilkan <strong className="text-slate-900">{filteredEvents.length}</strong>{' '}
                event
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const totalQuota = event.ticketTiers.reduce(
                  (sum, t) => sum + t.totalQuota,
                  0,
                );
                const remainingQuota = event.ticketTiers.reduce(
                  (sum, t) => sum + t.remainingQuota,
                  0,
                );
                const lowestPrice =
                  event.ticketTiers.length > 0
                    ? Math.min(...event.ticketTiers.map((t) => t.price))
                    : null;

                return (
                  <article
                    key={event.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        {event.ticketTiers.length > 0 ? (
                          <QuotaBadge
                            remainingQuota={remainingQuota}
                            totalQuota={totalQuota}
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                            Belum ada tier
                          </span>
                        )}

                        {lowestPrice !== null && (
                          <span className="text-sm font-bold text-indigo-700">
                            {lowestPrice === 0
                              ? 'Gratis'
                              : `Mulai ${formatCurrency(lowestPrice)}`}
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {event.description}
                      </p>
                    </div>

                    <div className="mt-5">
                      <dl className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarDays
                            className="h-4 w-4 shrink-0 text-slate-500"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Tanggal</dt>
                          <dd>{formatShortDate(event.eventDate)}</dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-slate-500"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">Lokasi</dt>
                          <dd className="truncate">{event.location}</dd>
                        </div>
                      </dl>

                      <Link
                        href={`/events/${event.id}`}
                        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      >
                        Lihat Detail &amp; Pesan
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
