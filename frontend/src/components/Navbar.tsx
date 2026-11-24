'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Ticket,
  X,
} from 'lucide-react';
import { RoleBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setMobileOpen(false);
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    {
      href: '/',
      label: 'Katalog Event',
      icon: CalendarDays,
      show: true,
    },
    {
      href: '/my-tickets',
      label: 'Tiket Saya',
      icon: Ticket,
      show: user?.role === 'PARTICIPANT',
    },
    {
      href: '/admin/dashboard',
      label: 'Dashboard Panitia',
      icon: LayoutDashboard,
      show: user?.role === 'PANITIA',
    },
    {
      href: '/admin/scan',
      label: 'Scan QR',
      icon: QrCode,
      show: user?.role === 'PANITIA',
    },
  ].filter((item) => item.show);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-lg px-1 text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>TixFlow</span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/'
                ? pathname === '/' || pathname.startsWith('/events/')
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth Area */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoading ? (
            <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="max-w-[140px] truncate text-sm font-medium text-slate-900">
                  {user.name}
                </span>
                <RoleBadge role={user.role} />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {loggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile collapsible navigation */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
        >
          <nav aria-label="Navigasi mobile" className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/'
                  ? pathname === '/' || pathname.startsWith('/events/')
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {isLoading ? (
              <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-600">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {loggingOut ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
