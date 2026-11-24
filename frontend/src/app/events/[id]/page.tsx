'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Expand,
  Images,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { DetailSkeleton, EmptyState, ErrorBanner } from '@/components/StateViews';
import { QuotaBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { ApiError, eventsApi, ticketsApi } from '@/lib/api';
import {
  DocumentationPhoto,
  getEventVisuals,
} from '@/lib/eventVisuals';
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

  const [coverFailed, setCoverFailed] = useState(false);
  const [activePhoto, setActivePhoto] = useState<DocumentationPhoto | null>(null);

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

  useEffect(() => {
    if (!activePhoto) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto]);

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 text-blue-600" aria-hidden="true" />
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
      ) : (() => {
        const visuals = getEventVisuals(event.title);
        return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left 7 Columns: Event Banner, Details, Previous Edition Gallery & Check-in Terms */}
          <div className="space-y-6 lg:col-span-7">
            <section
              aria-labelledby="event-title-heading"
              className="overflow-hidden rounded-lg border border-slate-200 border-t-4 border-t-blue-600 bg-white shadow-sm"
            >
              {/* Event Photo Banner */}
              <div className="aspect-[16/9] w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                {coverFailed ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                    <CalendarDays className="h-12 w-12" aria-hidden="true" />
                  </div>
                ) : (
                  <img
                    src={visuals.coverSrc}
                    alt={`Banner event ${event.title}`}
                    onError={() => setCoverFailed(true)}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Informasi Event
                </p>
                <h1
                  id="event-title-heading"
                  className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
                >
                  {event.title}
                </h1>

                <dl className="mt-6 grid grid-cols-1 gap-4 border-y border-slate-100 py-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Jadwal
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {formatDateTime(event.eventDate)}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Lokasi
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {event.location}
                      </dd>
                    </div>
                  </div>

                  {event.creator && (
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Penyelenggara
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-900">
                          {event.creator.name}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>

                <div className="mt-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Deskripsi Lengkap
                  </h2>
                  <p className="mt-2.5 whitespace-pre-line text-base leading-relaxed text-slate-700">
                    {event.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Documentation Gallery (3 Campus Photos + Modal Preview) */}
            <section
              aria-labelledby="docs-gallery-heading"
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Images className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="docs-gallery-heading"
                    className="text-base font-bold text-slate-900"
                  >
                    Dokumentasi Edisi Sebelumnya
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik foto untuk melihat pratinjau ukuran penuh.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {visuals.gallery.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhoto(photo)}
                    className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left transition hover:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/80 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <Expand className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-slate-900">{photo.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">
                        {photo.caption}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Check-in Terms Box (1px solid border-slate-200) */}
            <section
              aria-labelledby="checkin-terms-heading"
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2
                  id="checkin-terms-heading"
                  className="text-base font-bold text-slate-900"
                >
                  Ketentuan Check-in
                </h2>
              </div>

              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span>
                    Satu kode QR hanya berlaku untuk <strong>1 kali check-in</strong> dan
                    langsung berubah status menjadi <code>USED</code> saat dipindai panitia.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span>
                    Siapkan E-Ticket dari menu <strong>Tiket Saya</strong> atau unduh QR PNG
                    sebelum tiba di lokasi acara.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <span>
                    Peserta disarankan hadir minimal 15 menit sebelum acara dimulai dan
                    membawa kartu identitas mahasiswa/peserta bila diminta panitia.
                  </span>
                </li>
              </ul>
            </section>
          </div>

          {/* Right 5 Columns (Sticky): Ticket Tiers Selection */}
          <aside
            aria-labelledby="tiers-heading"
            className="space-y-4 lg:sticky lg:top-24 lg:col-span-5"
          >
            <div className="flex items-center justify-between">
              <h2 id="tiers-heading" className="text-lg font-bold text-slate-900">
                Kategori Tiket
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wider tabular-nums text-slate-500">
                {event.ticketTiers.length} Tier
              </span>
            </div>

            {bookedTicket && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-emerald-900">
                      Tiket Berhasil Dipesan!
                    </h3>
                    <p className="mt-1 text-xs text-emerald-800">
                      Kode:{' '}
                      <span className="break-all font-mono font-semibold">
                        {bookedTicket.ticketCode}
                      </span>
                    </p>
                    <Link
                      href="/my-tickets"
                      className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                    >
                      Lihat Tiket &amp; QR Code
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {bookingError && (
              <ErrorBanner title="Pemesanan Tiket Ditolak" message={bookingError} />
            )}

            {event.ticketTiers.length === 0 ? (
              <EmptyState
                title="Belum Ada Kategori Tiket"
                description="Panitia belum menambahkan kategori tiket untuk event ini."
              />
            ) : (
              <div className="space-y-4">
                {event.ticketTiers.map((tier) => {
                  const soldOut = tier.remainingQuota <= 0;
                  const pct =
                    tier.totalQuota > 0
                      ? Math.round((tier.remainingQuota / tier.totalQuota) * 100)
                      : 0;
                  const isBookingThis = bookingTierId === tier.id;
                  const perks = visuals.getTierPerks(tier);

                  return (
                    <div
                      key={tier.id}
                      className="rounded-lg border border-slate-200 border-t-4 border-t-blue-600 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{tier.name}</h3>
                          <p className="mt-1 text-2xl font-extrabold tabular-nums text-blue-600">
                            {formatCurrency(tier.price)}
                          </p>
                        </div>
                        <QuotaBadge
                          remainingQuota={tier.remainingQuota}
                          totalQuota={tier.totalQuota}
                        />
                      </div>

                      {/* Tier Facilities */}
                      <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                        {perks.map((perk) => (
                          <li key={perk} className="flex items-center gap-2">
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Solid Quota Progress Bar */}
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>Sisa Kuota</span>
                          <span className="font-semibold tabular-nums text-slate-800">
                            {tier.remainingQuota} / {tier.totalQuota}
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`Sisa kuota ${tier.name}`}
                          aria-valuemin={0}
                          aria-valuemax={tier.totalQuota}
                          aria-valuenow={tier.remainingQuota}
                          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${
                              soldOut
                                ? 'bg-rose-500'
                                : pct <= 20
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        {!user ? (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                          >
                            Masuk untuk Memesan
                          </Link>
                        ) : user.role === 'PANITIA' ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"
                          >
                            Booking khusus akun PARTICIPANT
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={soldOut || bookingTierId !== null}
                            onClick={() => void handleBookTicket(tier.id)}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
          </aside>
        </div>
        );
      })()}

      {/* Photo Preview Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-modal-title"
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 id="photo-modal-title" className="text-base font-bold text-slate-900">
                {activePhoto.title}
              </h3>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                aria-label="Tutup pratinjau foto"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="bg-slate-100 p-4">
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                className="aspect-[16/9] max-h-[65vh] w-full rounded-md border border-slate-200 bg-white object-cover"
              />
            </div>
            <p className="border-t border-slate-200 px-5 py-3.5 text-sm text-slate-600">
              {activePhoto.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
