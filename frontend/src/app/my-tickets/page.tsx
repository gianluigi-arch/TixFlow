'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Ticket } from 'lucide-react';
import {
  EmptyState,
  ErrorBanner,
  RoleGuardNotice,
  TicketCardSkeleton,
} from '@/components/StateViews';
import { TicketCard } from '@/components/TicketCard';
import { useAuth } from '@/context/AuthContext';
import { ApiError, ticketsApi } from '@/lib/api';
import type { TicketItem, TicketStatus } from '@/types/api';

type FilterTab = 'ALL' | TicketStatus;

export default function MyTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.myTickets();
      setTickets(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Gagal memuat tiket Anda. Silakan coba lagi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user?.role === 'PARTICIPANT') {
      void loadTickets();
    } else {
      setIsLoading(false);
    }
  }, [authLoading, user, loadTickets]);

  const filteredTickets = useMemo(() => {
    if (filter === 'ALL') {
      return tickets;
    }
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <TicketCardSkeleton />
        <TicketCardSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="unauthenticated"
          requiredRole="PARTICIPANT"
          redirectPath="/my-tickets"
        />
      </div>
    );
  }

  if (user.role !== 'PARTICIPANT') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="forbidden"
          requiredRole="PARTICIPANT"
          redirectPath="/my-tickets"
        />
      </div>
    );
  }

  const filterTabs: Array<{ value: FilterTab; label: string }> = [
    { value: 'ALL', label: `Semua (${tickets.length})` },
    {
      value: 'VALID',
      label: `Valid (${tickets.filter((t) => t.status === 'VALID').length})`,
    },
    {
      value: 'USED',
      label: `Sudah Check-in (${tickets.filter((t) => t.status === 'USED').length})`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            <Ticket className="h-7 w-7 text-indigo-600" aria-hidden="true" />
            Tiket Saya
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tunjukkan QR Code di bawah kepada panitia saat memasuki gerbang acara.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={isLoading}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Muat Ulang
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        role="group"
        aria-label="Filter status tiket"
        className="mb-6 flex flex-wrap gap-2"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
              filter === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <TicketCardSkeleton />
          <TicketCardSkeleton />
        </div>
      ) : error ? (
        <ErrorBanner
          title="Gagal Memuat Tiket"
          message={error}
          onRetry={() => void loadTickets()}
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="Anda Belum Memiliki Tiket"
          description="Jelajahi katalog event kampus dan pesan tiket pertama Anda sekarang."
          actionLabel="Jelajahi Event"
          actionHref="/"
        />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="Tidak Ada Tiket pada Filter Ini"
          description="Belum ada tiket yang sesuai dengan status yang dipilih."
          actionLabel="Tampilkan Semua Tiket"
          onAction={() => setFilter('ALL')}
        />
      ) : (
        <div className="space-y-5">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
