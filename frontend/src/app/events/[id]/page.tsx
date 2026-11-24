'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Ticket,
  User,
} from 'lucide-react';
import { DetailSkeleton, EmptyState, ErrorBanner } from '@/components/StateViews';
import { QuotaBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { ApiError, eventsApi, ticketsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { EventItem, TicketItem } from '@/types/api';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingTierId, setBookingTierId] = useState<string | null>(null);
  const [bookedTicket, setBookedTicket] = useState<TicketItem | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getById(eventId);
      setEvent(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat detail event. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleBookTicket = async (tierId: string) => {
    setBookingTierId(tierId);
    setBookingError(null);
    setBookedTicket(null);

    try {
      const ticket = await ticketsApi.book(tierId);
      setBookedTicket(ticket);
      await loadEvent();
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
        if (err.status === 409) {
          await loadEvent();
        }
      } else {
        setBookingError('Gagal memproses booking tiket. Silakan coba lagi.');
      }
    } finally {
      setBookingTierId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Katalog Event
        </Link>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : error ? (
        <ErrorBanner
          title="Event Tidak Dapat Dimuat"
          message={error}
          onRetry={() => void loadEvent()}
        />
      ) : !event ? (
        <EmptyState
          title="Event Tidak Ditemukan"
          description="Event yang Anda cari tidak tersedia atau telah dihapus."
          actionLabel="Kembali ke Katalog"
          actionHref="/"
        />
      ) : (
        <div className="space-y-8">
          {/* Event Header Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {event.title}
            </h1>

            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                <dt className="sr-only">Waktu</dt>
                <dd>{formatDateTime(event.eventDate)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                <dt className="sr-only">Lokasi</dt>
                <dd>{event.location}</dd>
              </div>
              {event.creator && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                  <dt className="sr-only">Penyelenggara</dt>
                  <dd>Penyelenggara: {event.creator.name}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Deskripsi Event
              </h2>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-slate-700">
                {event.description}
              </p>
            </div>
          </section>

          {/* Booking Alerts */}
          {bookedTicket && (
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-emerald-900">
                      Tiket Berhasil Dipesan!
                    </h2>
                    <p className="mt-1 text-sm text-emerald-800">
                      Kode tiket Anda:{' '}
                      <span className="font-mono font-semibold">{bookedTicket.ticketCode}</span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/my-tickets"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                >
                  Lihat Tiket &amp; QR Code
                </Link>
              </div>
            </div>
          )}

          {bookingError && (
            <ErrorBanner title="Pemesanan Tiket Ditolak" message={bookingError} />
          )}

          {/* Ticket Tiers Section */}
          <section aria-labelledby="tiers-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="tiers-heading" className="text-xl font-bold text-slate-900">
                Pilih Kategori Tiket
              </h2>
              <span className="text-sm text-slate-600">
                {event.ticketTiers.length} kategori tersedia
              </span>
            </div>

            {event.ticketTiers.length === 0 ? (
              <EmptyState
                title="Belum Ada Kategori Tiket"
                description="Panitia belum menambahkan kategori tiket untuk event ini."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {event.ticketTiers.map((tier) => {
                  const soldOut = tier.remainingQuota <= 0;
                  const pct =
                    tier.totalQuota > 0
                      ? Math.round((tier.remainingQuota / tier.totalQuota) * 100)
                      : 0;
                  const isBookingThis = bookingTierId === tier.id;

                  return (
                    <div
                      key={tier.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                            <p className="mt-1 text-xl font-extrabold text-indigo-700">
                              {formatCurrency(tier.price)}
                            </p>
                          </div>
                          <QuotaBadge
                            remainingQuota={tier.remainingQuota}
                            totalQuota={tier.totalQuota}
                          />
                        </div>

                        <div className="mt-5">
                          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
                            <span>Sisa Kuota</span>
                            <span>
                              {tier.remainingQuota} / {tier.totalQuota}
                            </span>
                          </div>
                          <div
                            role="progressbar"
                            aria-label={`Sisa kuota ${tier.name}`}
                            aria-valuemin={0}
                            aria-valuemax={tier.totalQuota}
                            aria-valuenow={tier.remainingQuota}
                            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
                          >
                            <div
                              className={`h-full rounded-full transition-all ${
                                soldOut
                                  ? 'bg-rose-500'
                                  : pct <= 20
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        {!user ? (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                          >
                            Masuk untuk Memesan
                          </Link>
                        ) : user.role === 'PANITIA' ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"
                          >
                            Booking khusus akun PARTICIPANT
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={soldOut || bookingTierId !== null}
                            onClick={() => void handleBookTicket(tier.id)}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                          >
                            {isBookingThis ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Mengunci Kuota...
                              </>
                            ) : soldOut ? (
                              'Kuota Habis'
                            ) : (
                              <>
                                <Ticket className="h-4 w-4" aria-hidden="true" />
                                Pesan Tiket
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
