'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  History,
  QrCode,
  XCircle,
} from 'lucide-react';
import { QrScannerPanel } from '@/components/QrScannerPanel';
import { RoleGuardNotice, TicketCardSkeleton } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { ApiError, ticketsApi } from '@/lib/api';
import { formatShortDate } from '@/lib/format';
import type { TicketItem } from '@/types/api';

interface ScanOutcome {
  id: string;
  code: string;
  success: boolean;
  message: string;
  ticket?: TicketItem;
  scannedAt: string;
}

export default function AdminScanPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [latestOutcome, setLatestOutcome] = useState<ScanOutcome | null>(null);
  const [history, setHistory] = useState<ScanOutcome[]>([]);

  const handleValidateCode = async (ticketCode: string) => {
    setIsCheckingIn(true);
    const scannedAt = new Date().toISOString();

    try {
      const res = await ticketsApi.checkin(ticketCode);
      const outcome: ScanOutcome = {
        id: `${Date.now()}-${Math.random()}`,
        code: ticketCode,
        success: true,
        message: res.message,
        ticket: res.ticket,
        scannedAt,
      };
      setLatestOutcome(outcome);
      setHistory((prev) => [outcome, ...prev].slice(0, 15));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Gagal memvalidasi tiket. Periksa koneksi ke backend.';
      const outcome: ScanOutcome = {
        id: `${Date.now()}-${Math.random()}`,
        code: ticketCode,
        success: false,
        message,
        scannedAt,
      };
      setLatestOutcome(outcome);
      setHistory((prev) => [outcome, ...prev].slice(0, 15));
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <TicketCardSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="unauthenticated"
          requiredRole="PANITIA"
          redirectPath="/admin/scan"
        />
      </div>
    );
  }

  if (user.role !== 'PANITIA') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <RoleGuardNotice
          mode="forbidden"
          requiredRole="PANITIA"
          redirectPath="/admin/scan"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <QrCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Scanner Check-in Gerbang
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Validasi tiket peserta secara atomik menggunakan kamera atau kode UUID manual.
            </p>
          </div>
        </div>

        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <QrScannerPanel
            onValidateCode={handleValidateCode}
            isValidating={isCheckingIn}
          />
        </div>

        <div className="space-y-6 lg:col-span-5">
          {/* Latest Verification Result */}
          <section aria-labelledby="scan-result-heading">
            <h2
              id="scan-result-heading"
              className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              Hasil Validasi Terakhir
            </h2>

            {!latestOutcome ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Belum ada tiket yang dipindai pada sesi ini.
              </div>
            ) : latestOutcome.success ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold text-emerald-900">
                      Check-in Berhasil
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">{latestOutcome.message}</p>

                    {latestOutcome.ticket && (
                      <dl className="mt-4 space-y-1.5 border-t border-emerald-200 pt-3 text-xs">
                        {latestOutcome.ticket.user && (
                          <div>
                            <dt className="font-semibold text-emerald-800">Peserta</dt>
                            <dd className="text-emerald-950">
                              {latestOutcome.ticket.user.name} ({latestOutcome.ticket.user.email})
                            </dd>
                          </div>
                        )}
                        {latestOutcome.ticket.tier?.event && (
                          <div>
                            <dt className="font-semibold text-emerald-800">Event &amp; Tier</dt>
                            <dd className="text-emerald-950">
                              {latestOutcome.ticket.tier.event.title} —{' '}
                              {latestOutcome.ticket.tier.name}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="font-semibold text-emerald-800">Kode Tiket</dt>
                          <dd className="break-all font-mono text-emerald-900">
                            {latestOutcome.code}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border-2 border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <XCircle
                    className="mt-0.5 h-6 w-6 shrink-0 text-rose-700"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold text-rose-900">
                      Check-in Ditolak
                    </p>
                    <p className="mt-1 text-sm font-medium text-rose-800">
                      {latestOutcome.message}
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-rose-700">
                      {latestOutcome.code}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Session History */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <History className="h-4 w-4" aria-hidden="true" />
              </span>
              Riwayat Scan Sesi Ini ({history.length})
            </h2>

            {history.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                Riwayat hasil scan akan muncul di sini.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {history.map((item) => (
                  <li key={item.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          item.success ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {item.success ? 'VALID -> USED' : 'DITOLAK'}
                      </span>
                      <span className="text-slate-500">
                        {formatShortDate(item.scannedAt)}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-slate-700">
                      {item.code}
                    </p>
                    <p className="mt-0.5 text-slate-600">{item.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
