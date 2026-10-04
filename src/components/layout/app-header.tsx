'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Coins,
  LogOut,
  PieChart,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuthStore } from '@/lib/store';

export type AppSection = 'crypto' | 'iran' | 'forex' | 'portfolio';

interface AppHeaderProps {
  active: AppSection;
  subtitle?: string;
  badge?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  maxWidthClass?: string;
}

const navItems = [
  { key: 'crypto', label: 'رمزارز', href: '/dashboard', Icon: Coins },
  { key: 'iran', label: 'بازار ایران', href: '/iran-market', Icon: BarChart3 },
  { key: 'forex', label: 'فارکس', href: '/forex', Icon: TrendingUp },
  { key: 'portfolio', label: 'سبد ترکیبی', href: '/smart-portfolio', Icon: PieChart },
] as const;

export function AppHeader({
  active,
  subtitle,
  badge,
  onRefresh,
  isRefreshing = false,
  maxWidthClass = 'max-w-[1500px]',
}: AppHeaderProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--nv-border)] bg-[var(--nv-header)] backdrop-blur-xl">
        <div className={`mx-auto flex min-h-16 items-center justify-between gap-2 px-3 sm:min-h-20 sm:px-6 lg:px-10 ${maxWidthClass}`}>
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo subtitle={subtitle} />
            {badge ? (
              <span className="nv-status-info hidden rounded-lg px-2.5 py-1 text-[11px] font-black sm:inline-flex">
                {badge}
              </span>
            ) : null}
          </div>

          <nav className="nv-toolbar hidden items-center rounded-xl p-1 lg:flex">
            {navItems.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                aria-current={active === key ? 'page' : undefined}
                className={`rounded-lg border px-3.5 py-2 text-xs font-extrabold transition ${
                  active === key
                    ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
                    : 'border-transparent text-[var(--nv-muted)] hover:bg-[var(--nv-panel)] hover:text-[var(--nv-text)]'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden xl:block">
              <ThemeToggle />
            </div>
            <div className="xl:hidden">
              <ThemeToggle compact />
            </div>

            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="nv-icon-button h-10 w-10 disabled:cursor-wait disabled:opacity-50"
                aria-label="به‌روزرسانی اطلاعات"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            ) : null}

            <Link
              href="/onboarding"
              className="nv-button-secondary hidden h-10 min-h-10 sm:flex"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden xl:inline">تنظیم پروفایل</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="nv-icon-button h-10 w-10 hover:border-[var(--nv-danger-border)] hover:bg-[var(--nv-danger-soft)] hover:text-[var(--nv-danger)]"
              aria-label="خروج از حساب"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--nv-border)] bg-[var(--nv-header)] px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(16,24,40,0.06)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {navItems.map(({ key, label, href, Icon }) => {
            const selected = active === key;
            return (
              <Link
                key={key}
                href={href}
                aria-current={selected ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-[11px] font-extrabold transition ${
                  selected
                    ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
                    : 'border-transparent text-[var(--nv-muted)] hover:bg-[var(--nv-soft)] hover:text-[var(--nv-text)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
