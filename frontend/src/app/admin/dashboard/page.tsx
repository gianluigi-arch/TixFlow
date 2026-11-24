'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Plus,
  QrCode,
} from 'lucide-react';
import {
  EmptyState,
  ErrorBanner,
  EventCardSkeleton,
  RoleGuardNotice,
} from '@/components/StateViews';
import { QuotaBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { ApiError, eventsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { EventItem } from '@/types/api';

interface TierDraft {
  name: string;
  price: string;
  totalQuota: string;
}

const DEFAULT_TIER_DRAFT: TierDraft = {
  name: '',
  price: '0',
  totalQuota: '50',
};

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Event form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventSuccess, setEventSuccess] = useState<string | null>(null);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  // Per-event Add Tier form state
  const [tierDrafts, setTierDrafts] = useState<Record<string, TierDraft>>({});
  const [creatingTierFor, setCreatingTierFor] = useState<string | null>(null);
  const [tierErrorByEvent, setTierErrorByEvent] = useState<Record<string, string>>({});
  const [tierSuccessByEvent, setTierSuccessByEvent] = useState<Record<string, string>>({});

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
          : 'Gagal memuat daftar event.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user?.role === 'PANITIA') {
      void loadEvents();
    } else {
      setIsLoading(false);
    }
  }, [authLoading, user, loadEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventFormError(null);
    setEventSuccess(null);

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      setEventFormError('Tanggal & waktu event tidak valid.');
      return;
    }

    setCreatingEvent(true);
    try {
      const created = await eventsApi.create({
        title: title.trim(),
        description: description.trim(),
        eventDate: parsedDate.toISOString(),
        location: location.trim(),
      });
      setTitle('');
      setDescription('');
      setEventDate('');
      setLocation('');
      setEventSuccess(`Event "${created.title}" berhasil dibuat.`);
      await loadEvents();
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.errors?.map((item) => item.message).join(' • ');
        setEventFormError(detail ? `${err.message}: ${detail}` : err.message);
      } else {
        setEventFormError('Gagal membuat event baru.');
      }
    } finally {
      setCreatingEvent(false);
    }
  };

  const getDraft = (eventId: string): TierDraft =>
    tierDrafts[eventId] ?? DEFAULT_TIER_DRAFT;

  const updateDraft = (eventId: string, patch: Partial<TierDraft>) => {
    setTierDrafts((prev) => ({
      ...prev,
      [eventId]: { ...getDraft(eventId), ...patch },
    }));
  };

  const handleCreateTier = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    const draft = getDraft(eventId);
    setTierErrorByEvent((prev) => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
    setTierSuccessByEvent((prev) => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });

    const priceNum = Number(draft.price);
    const quotaNum = Number(draft.totalQuota);

    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setTierErrorByEvent((prev) => ({
        ...prev,
        [eventId]: 'Harga harus berupa bilangan bulat >= 0.',
      }));
      return;
    }
    if (!Number.isInteger(quotaNum) || quotaNum < 1) {
      setTierErrorByEvent((prev) => ({
        ...prev,
        [eventId]: 'Kuota total minimal 1 tiket.',
      }));
      return;
    }

    setCreatingTierFor(eventId);
    try {
      const tier = await eventsApi.createTier(eventId, {
        name: draft.name.trim(),
        price: priceNum,
        totalQuota: quotaNum,
      });
      setTierDrafts((prev) => ({
        ...prev,
        [eventId]: DEFAULT_TIER_DRAFT,
      }));
      setTierSuccessByEvent((prev) => ({
        ...prev,
        [eventId]: `Tier "${tier.name}" (${tier.totalQuota} kuota) berhasil ditambahkan.`,
      }));
      await loadEvents();
    } catch (err) {
      setTierErrorByEvent((prev) => ({
        ...prev,
        [eventId]:
          err instanceof ApiError ? err.message : 'Gagal menambahkan kategori tiket.',
      }));
    } finally {
      setCreatingTierFor(null);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="unauthenticated"
          requiredRole="PANITIA"
          redirectPath="/admin/dashboard"
        />
      </div>
    );
  }

  if (user.role !== 'PANITIA') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="forbidden"
          requiredRole="PANITIA"
          redirectPath="/admin/dashboard"
        />
      </div>
    );
  }

  const totalTiers = events.reduce((sum, ev) => sum + ev.ticketTiers.length, 0);
  const totalQuota = events.reduce(
    (sum, ev) => sum + ev.ticketTiers.reduce((s, t) => s + t.totalQuota, 0),
    0,
  );
  const remainingQuota = events.reduce(
    (sum, ev) => sum + ev.ticketTiers.reduce((s, t) => s + t.remainingQuota, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            <LayoutDashboard className="h-7 w-7 text-indigo-600" aria-hidden="true" />
            Dashboard Panitia
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola event kampus, kategori tiket, dan pantau ketersediaan kuota.
          </p>
        </div>

        <Link
          href="/admin/scan"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          Buka Scanner Check-in
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Event
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Kategori Tiket
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalTiers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kuota Tersisa / Total
          </p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-700">
            {remainingQuota}{' '}
            <span className="text-lg font-semibold text-slate-500">/ {totalQuota}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Create Event Form */}
        <section className="lg:col-span-5" aria-labelledby="create-event-heading">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2
              id="create-event-heading"
              className="flex items-center gap-2 text-lg font-bold text-slate-900"
            >
              <CalendarPlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              Buat Event Baru
            </h2>

            {eventSuccess && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {eventSuccess}
              </div>
            )}

            {eventFormError && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-800"
              >
                {eventFormError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Judul Event
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  minLength={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="TechFest Kampus 2026"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div>
                <label
                  htmlFor="event-date"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Tanggal &amp; Waktu
                </label>
                <input
                  id="event-date"
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div>
                <label
                  htmlFor="event-location"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Lokasi
                </label>
                <input
                  id="event-location"
                  type="text"
                  required
                  minLength={2}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Auditorium Utama Gedung A"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Deskripsi
                </label>
                <textarea
                  id="event-description"
                  rows={4}
                  required
                  minLength={10}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan agenda, pembicara, atau informasi penting peserta (min 10 karakter)..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={creatingEvent}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {creatingEvent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menyimpan Event...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Simpan Event
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Events & Tiers Management List */}
        <section className="space-y-5 lg:col-span-7" aria-labelledby="manage-events-heading">
          <h2 id="manage-events-heading" className="text-lg font-bold text-slate-900">
            Daftar Event &amp; Pengaturan Tier
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : error ? (
            <ErrorBanner
              title="Gagal Memuat Daftar Event"
              message={error}
              onRetry={() => void loadEvents()}
            />
          ) : events.length === 0 ? (
            <EmptyState
              title="Belum Ada Event"
              description="Gunakan form di samping untuk membuat event pertama Anda."
            />
          ) : (
            events.map((event) => {
              const draft = getDraft(event.id);
              const tierError = tierErrorByEvent[event.id];
              const tierSuccess = tierSuccessByEvent[event.id];
              const isAddingTier = creatingTierFor === event.id;

              return (
                <article
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatDateTime(event.eventDate)} • {event.location}
                      </p>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="inline-flex min-h-[36px] shrink-0 items-center text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Lihat Halaman Publik
                    </Link>
                  </div>

                  {/* Existing Tiers */}
                  <div className="mt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Kategori Tiket ({event.ticketTiers.length})
                    </h4>

                    {event.ticketTiers.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Belum ada kategori tiket. Tambahkan di bawah ini.
                      </p>
                    ) : (
                      <div className="mt-2.5 space-y-2.5">
                        {event.ticketTiers.map((tier) => (
                          <div
                            key={tier.id}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900">{tier.name}</p>
                              <p className="text-xs text-slate-600">
                                {formatCurrency(tier.price)} • Terjual{' '}
                                {tier.totalQuota - tier.remainingQuota} dari {tier.totalQuota}
                              </p>
                            </div>
                            <QuotaBadge
                              remainingQuota={tier.remainingQuota}
                              totalQuota={tier.totalQuota}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Tier Form */}
                  <form
                    onSubmit={(e) => void handleCreateTier(e, event.id)}
                    className="mt-5 border-t border-slate-100 pt-5"
                  >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Tambah Kategori Tiket
                    </p>

                    {tierSuccess && (
                      <div
                        role="status"
                        className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
                      >
                        {tierSuccess}
                      </div>
                    )}
                    {tierError && (
                      <div
                        role="alert"
                        className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                      >
                        {tierError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <label
                          htmlFor={`tier-name-${event.id}`}
                          className="mb-1 block text-xs font-medium text-slate-700"
                        >
                          Nama Tier
                        </label>
                        <input
                          id={`tier-name-${event.id}`}
                          type="text"
                          required
                          minLength={2}
                          value={draft.name}
                          onChange={(e) => updateDraft(event.id, { name: e.target.value })}
                          placeholder="Early Bird / VIP"
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label
                          htmlFor={`tier-price-${event.id}`}
                          className="mb-1 block text-xs font-medium text-slate-700"
                        >
                          Harga (IDR)
                        </label>
                        <input
                          id={`tier-price-${event.id}`}
                          type="number"
                          min={0}
                          step={1000}
                          required
                          value={draft.price}
                          onChange={(e) => updateDraft(event.id, { price: e.target.value })}
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`tier-quota-${event.id}`}
                          className="mb-1 block text-xs font-medium text-slate-700"
                        >
                          Kuota
                        </label>
                        <input
                          id={`tier-quota-${event.id}`}
                          type="number"
                          min={1}
                          required
                          value={draft.totalQuota}
                          onChange={(e) =>
                            updateDraft(event.id, { totalQuota: e.target.value })
                          }
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                      </div>

                      <div className="flex items-end sm:col-span-2">
                        <button
                          type="submit"
                          disabled={isAddingTier}
                          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                        >
                          {isAddingTier ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            'Tambah'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
