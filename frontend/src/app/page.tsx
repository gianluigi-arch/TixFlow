'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  Search,
  Ticket,
} from 'lucide-react';
import { EmptyState, ErrorBanner, EventCardSkeleton } from '@/components/StateViews';
import { QuotaBadge } from '@/components/StatusBadge';
import { ApiError, eventsApi } from '@/lib/api';
import { getEventVisuals } from '@/lib/eventVisuals';
import { formatCurrency, formatShortDate } from '@/lib/format';
import type { EventItem } from '@/types/api';

function EventThumbnail({ title, coverSrc }: { title: string; coverSrc: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex h-44 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 sm:h-36 sm:w-44"
        aria-hidden="true"
      >
        <CalendarDays className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      src={coverSrc}
      alt={`Cover event ${title}`}
      onError={() => setFailed(true)}
      className="h-44 w-full shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover sm:h-36 sm:w-44"
    />
  );
}

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
      {/* Compact 1-Row Corporate Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Katalog Event Kampus
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Pilih event dan pesan tiket kategori yang tersedia secara real-time.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <label htmlFor="event-search" className="sr-only">
              Cari judul atau lokasi event
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
                placeholder="Cari judul atau lokasi..."
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Ticket Stub Catalog */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading ? (
          <div aria-label="Memuat daftar event" className="space-y-5">
            {Array.from({ length: 3 }).map((_, idx) => (
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
                Menampilkan{' '}
                <strong className="tabular-nums text-slate-900">
                  {filteredEvents.length}
                </strong>{' '}
                event
              </p>
            </div>

            <div className="space-y-5">
              {filteredEvents.map((event) => {
                const hasTiers = event.ticketTiers.length > 0;
                const totalQuota = event.ticketTiers.reduce(
                  (sum, t) => sum + t.totalQuota,
                  0,
                );
                const remainingQuota = event.ticketTiers.reduce(
                  (sum, t) => sum + t.remainingQuota,
                  0,
                );
                const lowestPrice = hasTiers
                  ? Math.min(...event.ticketTiers.map((t) => t.price))
                  : null;
                const organizerName = event.creator?.name || 'Panitia Kampus';
                const visuals = getEventVisuals(event.title);

                return (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left Body (75%) */}
                      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6 md:w-3/4">
                        <EventThumbnail title={event.title} coverSrc={visuals.coverSrc} />

                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                            {organizerName}
                          </span>

                          <h2 className="mt-2.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                            {event.title}
                          </h2>
                          <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
                            {event.description}
                          </p>

                          <dl className="mt-3 space-y-1.5 text-xs text-slate-600 sm:text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                className="h-4 w-4 shrink-0 text-blue-600"
                                aria-hidden="true"
                              />
                              <dt className="sr-only">Tanggal</dt>
                              <dd className="font-medium text-slate-700">
                                {formatShortDate(event.eventDate)}
                              </dd>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin
                                className="h-4 w-4 shrink-0 text-blue-600"
                                aria-hidden="true"
                              />
                              <dt className="sr-only">Lokasi</dt>
                              <dd className="truncate font-medium text-slate-700">
                                {event.location}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Right Stub (25%) with Perforated Divider & Notches */}
                      <div className="relative flex flex-col justify-between gap-4 border-t border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6 md:w-1/4 md:border-l md:border-t-0">
                        {/* Ticket Notch Cutouts */}
                        <span
                          aria-hidden="true"
                          className="absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full border border-slate-200 bg-slate-50 md:block"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full border border-slate-200 bg-slate-50 md:block"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-slate-200 bg-slate-50 md:hidden"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-slate-200 bg-slate-50 md:hidden"
                        />

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {hasTiers ? 'Mulai Dari' : 'Tiket'}
                          </p>
                          <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">
                            {lowestPrice !== null ? formatCurrency(lowestPrice) : 'Belum Tersedia'}
                          </p>

                          <div className="mt-2.5">
                            {hasTiers ? (
                              <QuotaBadge
                                remainingQuota={remainingQuota}
                                totalQuota={totalQuota}
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                                Belum ada tier
                              </span>
                            )}
                          </div>
                        </div>

                        {hasTiers ? (
                          <Link
                            href={`/events/${event.id}`}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          >
                            Pilih Tiket
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400"
                          >
                            Segera Hadir
                          </button>
                        )}
                      </div>
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
