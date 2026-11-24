'use client';

import Link from 'next/link';
import { AlertCircle, Inbox, Lock, RefreshCw, ShieldAlert } from 'lucide-react';
import type { Role } from '@/types/api';

export function EventCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="h-5 w-28 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </div>
      <div className="mb-2 h-6 w-3/4 rounded bg-slate-200" />
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="mb-5 space-y-2 border-t border-slate-100 pt-4">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="h-11 w-full rounded-lg bg-slate-200" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-5 w-36 rounded bg-slate-200" />
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-3 h-8 w-2/3 rounded bg-slate-200" />
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-11/12 rounded bg-slate-200" />
          <div className="h-4 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-6" />
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-6" />
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-28 rounded-full bg-slate-200" />
          <div className="h-6 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
        </div>
        <div className="h-40 w-40 shrink-0 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

export function ErrorBanner({
  title = 'Terjadi Kesalahan',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-rose-900">{title}</h2>
            <p className="mt-1 text-sm text-rose-800">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {actionLabel}
          </Link>
        </div>
      )}
      {actionLabel && !actionHref && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export function RoleGuardNotice({
  mode,
  requiredRole,
  redirectPath,
}: {
  mode: 'unauthenticated' | 'forbidden';
  requiredRole: Role;
  redirectPath: string;
}) {
  if (mode === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Autentikasi Diperlukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Silakan masuk dengan akun <strong>{requiredRole}</strong> untuk mengakses halaman ini.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Masuk Sekarang
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700">
        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Akses Ditolak (403)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Halaman ini hanya tersedia untuk peran <strong>{requiredRole}</strong>. Akun Anda saat
        ini tidak memiliki izin untuk membuka halaman ini.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
