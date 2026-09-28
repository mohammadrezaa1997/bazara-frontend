'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coins,
  LogOut,
  RefreshCw,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuthStore } from '@/lib/store';

interface ForexHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ForexHeader({
  isRefreshing,
  onRefresh,
}: ForexHeaderProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--nv-border)] bg-[var(--nv-header)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-500">
            <Coins className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-black text-[var(--nv-text)] sm:text-lg">
                BAZARA
              </h1>

              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-300">
                FOREX
              </span>
            </div>

            <p className="mt-1 truncate text-[10px] text-[var(--nv-muted)] sm:text-[11px]">
              تحلیل تکنیکال چندتایم‌فریمی فارکس
            </p>
          </div>
        </div>

        <nav className="hidden items-center rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-1 lg:flex">
          <Link
            href="/dashboard"
            className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--nv-muted)] transition hover:bg-[var(--nv-panel)]"
          >
            رمزارزها
          </Link>

          <Link
            href="/iran-market"
            className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--nv-muted)] transition hover:bg-[var(--nv-panel)]"
          >
            بازار ایران
          </Link>

          <Link
            href="/forex"
            className="rounded-xl bg-violet-500/12 px-4 py-2 text-xs font-bold text-violet-600 dark:text-violet-300"
          >
            فارکس
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-text-soft)] disabled:opacity-50"
            aria-label="به‌روزرسانی صفحه فارکس"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace('/');
            }}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-muted)] hover:text-rose-500"
            aria-label="خروج"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="nv-scrollbar mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto border-t border-[var(--nv-border)] px-3 py-2 lg:hidden">
        <ThemeToggle />

        <Link
          href="/dashboard"
          className="min-w-max rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-2 text-xs font-bold text-[var(--nv-muted)]"
        >
          رمزارزها
        </Link>

        <Link
          href="/iran-market"
          className="min-w-max rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-2 text-xs font-bold text-[var(--nv-muted)]"
        >
          بازار ایران
        </Link>

        <Link
          href="/forex"
          className="min-w-max rounded-xl bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-300"
        >
          فارکس
        </Link>
      </div>
    </header>
  );
}