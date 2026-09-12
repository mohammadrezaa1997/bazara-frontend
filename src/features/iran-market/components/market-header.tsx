'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, BrainCircuit, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuthStore } from '@/lib/store';

interface MarketHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function MarketHeader({ isRefreshing, onRefresh }: MarketHeaderProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--nv-border)] bg-[var(--nv-header)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-500 shadow-[0_0_32px_rgba(34,211,238,0.1)] sm:h-11 sm:w-11">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-black tracking-tight text-[var(--nv-text)] sm:text-lg">
                BAZARA
              </h1>
              <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 min-[390px]:inline dark:text-emerald-300">
                IRAN MARKET
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-[var(--nv-muted)] sm:mt-1 sm:text-[11px]">
              تحلیل چندمنبعی بازار مالی ایران
            </p>
          </div>
        </div>

        <nav className="hidden items-center rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-1 lg:flex">
          <Link
            href="/dashboard"
            className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--nv-muted)] transition hover:bg-[var(--nv-panel)] hover:text-[var(--nv-text)]"
          >
            رمزارزها
          </Link>
          <Link
            href="/iran-market"
            className="rounded-xl bg-cyan-400/12 px-4 py-2 text-xs font-bold text-cyan-300"
          >
            بازار ایران
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-600 xl:flex dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            داده واقعی
          </div>
          <div className="hidden sm:block"><ThemeToggle /></div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-text-soft)] transition hover:border-cyan-500/30 hover:text-cyan-500 disabled:cursor-wait disabled:opacity-50"
            aria-label="به‌روزرسانی اطلاعات بازار"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-muted)] transition hover:border-rose-500/30 hover:text-rose-500"
            aria-label="خروج از حساب"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto border-t border-[var(--nv-border)] px-3 py-2 sm:hidden">
        <ThemeToggle />
        <Link href="/dashboard" className="min-w-max rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-2 text-xs font-bold text-[var(--nv-muted)]">رمزارزها</Link>
        <Link href="/iran-market" className="min-w-max rounded-xl bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-300">بازار ایران</Link>
        <Link href="/iran-market/advisor" className="flex min-w-max items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-300">
          <BrainCircuit className="h-3.5 w-3.5" /> مشاور
        </Link>
      </div>
    </header>
  );
}
