'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  Cpu,
  DollarSign,
  Gauge,
  Hexagon,
  Loader2,
  LogOut,
  Minus,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { CryptoProfessionalChart } from '@/features/crypto/components/crypto-professional-chart';
import { FinancialAssistant } from '@/features/financial-assistant/financial-assistant';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

type SignalAction = 'BUY' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL';

interface PortfolioItem {
  symbol: string;
  name: string;
  sentiment: string;
  catalyst_reason: string;
  psychological_analysis: string;

  // Structured fields returned by the backend when available.
  action?: SignalAction | string;
  recommendation?: SignalAction | string;
  allocation_percent?: number | string;
  suggested_amount?: number | string;
  entry_zone?: string;
  entry_price_min?: number | string;
  entry_price_max?: number | string;
  take_profit_targets?: Array<number | string> | string;
  stop_loss?: number | string;
  holding_period?: string;
  confidence_score?: number | string;
  risk_level?: string;
  risk_note?: string;
}

interface PortfolioResponse {
  portfolio_analysis: PortfolioItem[];
  generated_at?: string;
  disclaimer?: string;
  portfolio?: {
    investment_horizon?: string;
    valid_until?: string | null;
  };
  portfolio_meta?: {
    next_review_at?: string | null;
    next_rebalance_at?: string | null;
    refresh_policy?: string;
    data_hold?: {
      active?: boolean;
      reason?: string;
      retry_after?: string;
      new_entries_frozen?: boolean;
    } | null;
  };
}

interface UserProfile {
  investment_horizon: string;
  budget_amount: string | number;
  overall_risk_score: number;
  risk_profile: string;
  answers_json: Record<string, unknown>;
}

interface ProfileResponse {
  is_profile_complete: boolean;
  profile: UserProfile;
}

interface CryptoPriceData {
  usd: number;
  usd_24h_change: number;
}

interface PriceApiResponse {
  success: boolean;
  crypto?: Record<string, CryptoPriceData>;
  usdt?: {
    lastTradePrice?: string | number;
  };
}

interface ApiError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

function getProfileErrorMessage(error: ApiError): string {
  if (error.response?.status === 401) {
    return 'نشست کاربری شما منقضی شده است.';
  }

  if (error.response?.status === 404) {
    return 'پروفایل روان‌شناختی هنوز تکمیل نشده است.';
  }

  return (
    error.response?.data?.detail ||
    error.message ||
    'خطا در دریافت پروفایل کاربر.'
  );
}

function getPortfolioErrorMessage(error: ApiError): string {
  if (error.response?.status === 404) {
    return 'مسیر دریافت پورتفو هنوز در بک‌اند ایجاد نشده است.';
  }

  return (
    error.response?.data?.detail ||
    error.message ||
    'دریافت تحلیل پورتفو با خطا مواجه شد.'
  );
}

function normalizeSignalAction(item: PortfolioItem): SignalAction {
  const rawAction = String(item.action || item.recommendation || '')
    .trim()
    .toUpperCase();

  if (
    rawAction === 'BUY' ||
    rawAction === 'HOLD' ||
    rawAction === 'WATCH' ||
    rawAction === 'AVOID' ||
    rawAction === 'SELL'
  ) {
    return rawAction;
  }

  // Sentiment is not enough to generate a buy/sell order.
  // We only use it as a market-observation fallback.
  return 'WATCH';
}

function getSignalMeta(action: SignalAction) {
  switch (action) {
    case 'BUY':
      return {
        label: 'خرید پله‌ای',
        icon: CheckCircle2,
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        panel: 'border-emerald-500/20 bg-emerald-500/[0.06]',
      };
    case 'HOLD':
      return {
        label: 'نگهداری',
        icon: Clock3,
        badge: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
        panel: 'border-blue-500/20 bg-blue-500/[0.06]',
      };
    case 'SELL':
      return {
        label: 'کاهش موقعیت',
        icon: TrendingDown,
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        panel: 'border-rose-500/20 bg-rose-500/[0.06]',
      };
    case 'AVOID':
      return {
        label: 'عدم ورود',
        icon: AlertTriangle,
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        panel: 'border-amber-500/20 bg-amber-500/[0.06]',
      };
    default:
      return {
        label: 'زیر نظر',
        icon: Minus,
        badge: 'border-slate-500/30 bg-slate-500/10 text-[var(--nv-text-soft)]',
        panel: 'border-slate-500/20 bg-slate-500/[0.06]',
      };
  }
}

function formatNumber(value?: number | string): string {
  if (value === undefined || value === null || value === '') {
    return 'تعیین نشده';
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return parsed.toLocaleString('en-US', {
    maximumFractionDigits: 8,
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'تعیین نشده';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return 'تعیین نشده';

  return parsed.toLocaleString('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getEntryZone(item: PortfolioItem): string {
  if (item.entry_zone) {
    return item.entry_zone;
  }

  if (
    item.entry_price_min !== undefined &&
    item.entry_price_max !== undefined
  ) {
    return `${formatNumber(item.entry_price_min)} تا ${formatNumber(
      item.entry_price_max,
    )} USDT`;
  }

  return 'هنوز توسط بک‌اند محاسبه نشده';
}

function getTargets(targets?: Array<number | string> | string): string {
  if (!targets) {
    return 'هنوز توسط بک‌اند محاسبه نشده';
  }

  if (Array.isArray(targets)) {
    return targets
      .map((target, index) => `هدف ${index + 1}: ${formatNumber(target)}`)
      .join(' | ');
  }

  return targets;
}

function getConfidence(value?: number | string): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(100, Math.max(0, parsed));
}

/* -------------------------------------------------------------------------- */
/*                              Dashboard Page                                */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();

  const {
    logout,
    budget,
    riskProfile,
    overallRiskScore,
    investmentHorizon,
    updateUserStats,
    setProfileComplete,
  } = useAuthStore();

  const [selectedChartAsset, setSelectedChartAsset] = useState<
    'BTC' | 'ETH' | 'SOL'
  >('BTC');

  const [cryptoPrices, setCryptoPrices] = useState<Record<
    string,
    CryptoPriceData
  > | null>(null);

  const [usdtTomanPrice, setUsdtTomanPrice] = useState<number | null>(null);

  /* ------------------------------------------------------------------------ */
  /*                           دریافت قیمت‌های زنده                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let isMounted = true;

    const fetchLivePrices = async () => {
      try {
        const response = await fetch('/api/prices', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Price API returned ${response.status}`);
        }

        const data: PriceApiResponse = await response.json();

        if (!isMounted || !data.success) {
          return;
        }

        if (data.crypto) {
          setCryptoPrices(data.crypto);
        }

        if (data.usdt?.lastTradePrice) {
          const rialPrice = Number(data.usdt.lastTradePrice);

          if (Number.isFinite(rialPrice)) {
            setUsdtTomanPrice(Math.round(rialPrice / 10));
          }
        }
      } catch (error) {
        console.error('Live prices fetch error:', error);
      }
    };

    fetchLivePrices();

    const intervalId = window.setInterval(fetchLivePrices, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                       دریافت پروفایل واقعی کاربر                         */
  /* ------------------------------------------------------------------------ */

  const {
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<ProfileResponse, ApiError>({
    queryKey: ['user-psych-profile'],

    queryFn: async () => {
      const { data } = await api.get<ProfileResponse>(
        '/api/questionnaire/profile/',
      );

      return data;
    },

    retry: false,

    staleTime: 60_000,
  });

  useEffect(() => {
    const loadProfileIntoStore = async () => {
      try {
        const result = await refetchProfile();

        if (result.data?.is_profile_complete && result.data.profile) {
          const profile = result.data.profile;

          updateUserStats(
            Number(profile.budget_amount),
            profile.risk_profile,
            Number(profile.overall_risk_score),
            profile.investment_horizon,
          );

          setProfileComplete(true);
        }
      } catch (error) {
        console.error('Profile synchronization error:', error);
      }
    };

    loadProfileIntoStore();
  }, [refetchProfile, setProfileComplete, updateUserStats]);

  useEffect(() => {
    if (!isProfileError) {
      return;
    }

    const statusCode = profileError?.response?.status;

    if (statusCode === 404) {
      setProfileComplete(false);
      router.replace('/onboarding');
      return;
    }

    if (statusCode === 401) {
      logout();
      router.replace('/');
    }
  }, [isProfileError, logout, profileError, router, setProfileComplete]);

  /* ------------------------------------------------------------------------ */
  /*                         دریافت سیگنال‌های پورتفو                         */
  /* ------------------------------------------------------------------------ */

  const {
    data: portfolioData,
    isLoading: isPortfolioLoading,
    isFetching: isPortfolioFetching,
    isError: isPortfolioError,
    error: portfolioError,
    refetch: refetchPortfolio,
  } = useQuery<PortfolioResponse, ApiError>({
    queryKey: ['portfolio'],

    queryFn: async () => {
      const { data } = await api.get<PortfolioResponse>(
        '/api/market/portfolio/',
      );

      return data;
    },

    retry: false,
  });

  /* ------------------------------------------------------------------------ */
  /*                               Handlers                                   */
  /* ------------------------------------------------------------------------ */

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  /* ------------------------------------------------------------------------ */
  /*                              Loading State                               */
  /* ------------------------------------------------------------------------ */

  if (isProfileLoading) {
    return (
      <div className="nv-page flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />

          <p className="animate-pulse text-sm font-medium text-cyan-400">
            در حال دریافت پروفایل سرمایه‌گذاری...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                               Error State                                */
  /* ------------------------------------------------------------------------ */

  if (
    isProfileError &&
    profileError?.response?.status !== 404 &&
    profileError?.response?.status !== 401
  ) {
    return (
      <div
        dir="rtl"
        className="nv-page flex min-h-screen items-center justify-center px-4"
      >
        <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-[var(--nv-panel)] p-8 text-center shadow-[var(--nv-shadow)]">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-rose-400" />

          <h2 className="mb-3 text-xl font-black text-[var(--nv-text)]">
            خطا در دریافت پروفایل
          </h2>

          <p className="mb-6 text-sm leading-7 text-[var(--nv-muted)]">
            {getProfileErrorMessage(profileError)}
          </p>

          <button
            type="button"
            onClick={() => refetchProfile()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-bold text-white transition-all hover:from-cyan-500 hover:to-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                  UI                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <div dir="rtl" className="nv-page font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--nv-border)] bg-[var(--nv-header)] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-6 lg:px-10">
          <div className="group flex min-w-0 cursor-default items-center gap-2.5 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 opacity-40 blur-md transition-opacity group-hover:opacity-70" />

              <Hexagon className="relative z-10 h-8 w-8 text-cyan-400" />

              <Cpu className="absolute left-1/2 top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-slate-900" />
            </div>

            <div>
              <h1 className="truncate text-base font-black tracking-tight text-[var(--nv-text)] sm:text-xl">
                BAZARA
              </h1>

              <span className="text-[10px] font-medium tracking-wider text-cyan-400/80">
                INTELLIGENT RISK MANAGEMENT
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => router.push('/iran-market')}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-600 transition-all duration-300 hover:bg-cyan-500/15 sm:px-4 dark:text-cyan-300"
            >
              <BarChart3 className="h-4 w-4" />

              <span className="hidden min-[430px]:inline">بازار ایران</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/forex')}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 text-xs font-bold text-violet-600 transition-all duration-300 hover:bg-violet-500/15 sm:px-4 dark:text-violet-300"
            >
              <Coins className="h-4 w-4" />

              <span className="hidden min-[520px]:inline">فارکس</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 text-xs transition-all duration-300 hover:border-cyan-500/25 sm:px-4"
            >
              <ClipboardList className="h-4 w-4 text-cyan-400" />

              <span className="hidden font-medium sm:inline">
                ویرایش پروفایل
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="خروج از حساب"
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-muted)] transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-2 md:hidden">
        <ThemeToggle />
      </div>

      {/* Live Ticker */}
      <section className="nv-scrollbar overflow-x-auto overflow-y-hidden border-b border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-3 sm:px-6">
        <div className="flex min-w-max items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 border-l border-[var(--nv-border)] pl-6 text-xs font-bold text-cyan-500">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />

              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
            </span>
            بازار زنده
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-1.5 text-xs shadow-inner">
            <span className="text-[var(--nv-muted)]">تتر:</span>

            <span dir="ltr" className="font-bold text-amber-400">
              {usdtTomanPrice ? `${usdtTomanPrice.toLocaleString()} T` : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs">
            <Coins className="h-4 w-4 text-amber-400" />

            <span className="text-amber-200/80">انس طلا:</span>

            <span dir="ltr" className="font-bold text-[var(--nv-text)]">
              {cryptoPrices?.['pax-gold']
                ? `$${cryptoPrices['pax-gold'].usd.toLocaleString()}`
                : '...'}
            </span>
          </div>

          {[
            {
              key: 'bitcoin',
              symbol: 'BTC',
            },
            {
              key: 'ethereum',
              symbol: 'ETH',
            },
            {
              key: 'solana',
              symbol: 'SOL',
            },
          ].map(({ key, symbol }) => {
            const coinData = cryptoPrices?.[key];

            if (!coinData) {
              return null;
            }

            const isPositive = coinData.usd_24h_change >= 0;

            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-1.5 text-xs"
              >
                <span className="text-[var(--nv-muted)]">{symbol}/USDT:</span>

                <span dir="ltr" className="font-bold text-[var(--nv-text)]">
                  ${coinData.usd.toLocaleString()}
                </span>

                <span
                  dir="ltr"
                  className={`flex items-center text-[11px] font-bold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}

                  {coinData.usd_24h_change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <main className="mx-auto mt-3 max-w-7xl space-y-6 px-3 py-4 sm:mt-4 sm:space-y-8 sm:px-6 sm:py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <div className="group min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] transition-all duration-300 sm:flex sm:items-center sm:justify-between sm:p-5 sm:hover:-translate-y-1">
            <div>
              <p className="mb-1 text-xs text-[var(--nv-muted)]">
                پروفایل ریسک
              </p>

              <h4 className="text-xl font-black text-[var(--nv-text)]">
                {riskProfile || 'در حال ارزیابی...'}
              </h4>
            </div>

            <div className="mt-3 hidden rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 transition-transform duration-300 min-[430px]:inline-grid sm:mt-0 group-hover:scale-110">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
            </div>
          </div>

          <div className="group min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] transition-all duration-300 sm:flex sm:items-center sm:justify-between sm:p-5 sm:hover:-translate-y-1">
            <div>
              <p className="mb-1 text-xs text-[var(--nv-muted)]">امتیاز ریسک</p>

              <h4
                dir="ltr"
                className="text-right text-xl font-black text-[var(--nv-text)]"
              >
                {overallRiskScore !== null
                  ? `${Number(overallRiskScore).toFixed(1)} / 100`
                  : '---'}
              </h4>
            </div>

            <div className="mt-3 hidden rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 transition-transform duration-300 min-[430px]:inline-grid sm:mt-0 group-hover:scale-110">
              <BrainCircuit className="h-6 w-6 text-blue-400" />
            </div>
          </div>

          <div className="group min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] transition-all duration-300 sm:flex sm:items-center sm:justify-between sm:p-5 sm:hover:-translate-y-1">
            <div>
              <p className="mb-1 text-xs text-[var(--nv-muted)]">
                بودجه سرمایه‌گذاری
              </p>

              <h4
                dir="ltr"
                className="text-right text-xl font-black text-[var(--nv-text)]"
              >
                {budget > 0 ? budget.toLocaleString() : '0'} USDT
              </h4>
            </div>

            <div className="mt-3 hidden rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 transition-transform duration-300 min-[430px]:inline-grid sm:mt-0 group-hover:scale-110">
              <DollarSign className="h-6 w-6 text-amber-400" />
            </div>
          </div>

          <div className="group min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] transition-all duration-300 sm:flex sm:items-center sm:justify-between sm:p-5 sm:hover:-translate-y-1">
            <div>
              <p className="mb-1 text-xs text-[var(--nv-muted)]">
                افق سرمایه‌گذاری
              </p>

              <h4 className="text-xl font-black text-[var(--nv-text)]">
                {investmentHorizon || '---'}
              </h4>
            </div>

            <div className="mt-3 hidden rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 transition-transform duration-300 min-[430px]:inline-grid sm:mt-0 group-hover:scale-110">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chart */}
          <section className="relative overflow-hidden rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] sm:p-6 lg:col-span-3">
            <div className="absolute left-1/4 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-3 text-lg font-bold text-[var(--nv-text)]">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                روند قیمت و تحلیل تکنیکال
              </h2>

              <div
                dir="ltr"
                className="flex gap-2 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-1"
              >
                {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => setSelectedChartAsset(asset)}
                    className={`rounded-lg px-6 py-2 text-sm font-bold transition-all duration-300 ${
                      selectedChartAsset === asset
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'text-[var(--nv-muted)] hover:bg-[var(--nv-soft)] hover:text-[var(--nv-text)]'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            <CryptoProfessionalChart symbol={selectedChartAsset} />
          </section>
        </div>

        {/* General Iran-market and crypto conversational assistant */}
        <FinancialAssistant />

        {/* Portfolio Signals */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col gap-4 border-b border-[var(--nv-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--nv-text)]">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
                برنامه پیشنهادی سبد رمزارز
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--nv-muted)]">
                هر کارت باید مشخص کند دارایی صرفاً زیر نظر باشد، خرید پله‌ای
                انجام شود، نگهداری شود یا ورود به آن مناسب نیست. محدوده ورود،
                حد ضرر و اهداف تنها زمانی نمایش داده می‌شوند که بک‌اند آن‌ها را
                به‌صورت عددی و ساختاریافته محاسبه کرده باشد.
              </p>

              {portfolioData?.portfolio_meta ? (
                <p className="mt-2 text-xs leading-6 text-cyan-300">
                  بازبینی بعدی:{' '}
                  {formatDateTime(portfolioData.portfolio_meta.next_review_at)}
                  {' · '}بازتنظیم برنامه‌ریزی‌شده:{' '}
                  {formatDateTime(
                    portfolioData.portfolio_meta.next_rebalance_at,
                  )}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => refetchPortfolio()}
              disabled={isPortfolioFetching}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-2.5 text-sm text-[var(--nv-text-soft)] transition-all hover:bg-[var(--nv-soft-strong)] hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isPortfolioFetching ? 'animate-spin' : ''
                }`}
              />
              به‌روزرسانی تحلیل
            </button>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-7 text-amber-100/80">
            این خروجی یک سناریوی تحلیلی مبتنی بر پروفایل ریسک است و دستور قطعی
            خرید یا فروش محسوب نمی‌شود. اعداد ورود و خروج باید همراه با قیمت
            لحظه‌ای بازار و کنترل ریسک بررسی شوند.
          </div>

          {portfolioData?.portfolio_meta?.data_hold?.active ? (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-4 text-sm leading-7 text-sky-200">
              منبع تازه بازار موقتاً در دسترس نیست؛ سبد قبلی حفظ شده و خرید تازه
              تا دریافت داده معتبر متوقف است.
            </div>
          ) : null}

          {isPortfolioLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-5 py-14 text-center sm:p-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <span className="animate-pulse text-[var(--nv-muted)]">
                در حال اسکن بازار و ساخت برنامه متناسب با پروفایل شما...
              </span>
            </div>
          ) : isPortfolioError ? (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <Activity className="mx-auto mb-4 h-10 w-10 text-amber-400" />
              <h3 className="mb-2 font-bold text-[var(--nv-text)]">
                برنامه پورتفو در دسترس نیست
              </h3>
              <p className="mb-5 text-sm leading-7 text-[var(--nv-muted)]">
                {getPortfolioErrorMessage(portfolioError)}
              </p>
              <button
                type="button"
                onClick={() => refetchPortfolio()}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش مجدد
              </button>
            </div>
          ) : portfolioData?.portfolio_analysis?.length ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {portfolioData.portfolio_analysis.map((item, index) => {
                const action = normalizeSignalAction(item);
                const signalMeta = getSignalMeta(action);
                const SignalIcon = signalMeta.icon;
                const confidence = getConfidence(item.confidence_score);

                return (
                  <article
                    key={`${item.symbol}-${index}`}
                    className="overflow-hidden rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)]"
                  >
                    <div className="space-y-5 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3
                              dir="ltr"
                              className="text-left text-xl font-black text-[var(--nv-text)]"
                            >
                              {item.name} ({item.symbol})
                            </h3>

                            <span className="rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-1 text-xs font-bold text-[var(--nv-text-soft)]">
                              رتبه {index + 1}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-[var(--nv-muted)]">
                            {item.catalyst_reason ||
                              'دلیل محرک بازار ثبت نشده است.'}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${signalMeta.badge}`}
                        >
                          <SignalIcon className="h-4 w-4" />
                          {signalMeta.label}
                        </span>
                      </div>

                      <div
                        className={`grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${signalMeta.panel}`}
                      >
                        <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <WalletCards className="h-4 w-4 text-cyan-400" />
                            سهم پیشنهادی از بودجه
                          </p>
                          <p className="font-black text-[var(--nv-text)]">
                            {item.allocation_percent !== undefined
                              ? `${formatNumber(item.allocation_percent)}%`
                              : 'تعیین نشده'}
                          </p>
                          {item.suggested_amount !== undefined && (
                            <p
                              dir="ltr"
                              className="mt-1 text-right text-xs text-cyan-300"
                            >
                              {formatNumber(item.suggested_amount)} USDT
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <Target className="h-4 w-4 text-emerald-400" />
                            محدوده ورود
                          </p>
                          <p
                            dir="ltr"
                            className="text-right text-sm font-bold text-[var(--nv-text)]"
                          >
                            {getEntryZone(item)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            اهداف خروج
                          </p>
                          <p
                            dir="ltr"
                            className="text-right text-sm font-bold leading-7 text-[var(--nv-text)]"
                          >
                            {getTargets(item.take_profit_targets)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <ShieldAlert className="h-4 w-4 text-rose-400" />
                            حد ضرر
                          </p>
                          <p
                            dir="ltr"
                            className="text-right text-sm font-bold text-[var(--nv-text)]"
                          >
                            {item.stop_loss !== undefined
                              ? `${formatNumber(item.stop_loss)} USDT`
                              : 'هنوز توسط بک‌اند محاسبه نشده'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <Clock3 className="h-4 w-4 text-blue-400" />
                            مدت نگهداری
                          </p>
                          <p className="text-sm font-bold text-[var(--nv-text)]">
                            {item.holding_period ||
                              investmentHorizon ||
                              'تعیین نشده'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-xs text-[var(--nv-muted)]">
                            <Gauge className="h-4 w-4 text-violet-400" />
                            سطح ریسک
                          </p>
                          <p className="text-sm font-bold text-[var(--nv-text)]">
                            {item.risk_level || riskProfile || 'تعیین نشده'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4">
                          <p className="mb-2 text-xs text-[var(--nv-muted)]">
                            اطمینان تحلیل
                          </p>
                          {confidence !== null ? (
                            <>
                              <div className="h-2 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                  style={{
                                    width: `${confidence}%`,
                                  }}
                                />
                              </div>
                              <p
                                dir="ltr"
                                className="mt-2 text-right text-xs font-bold text-cyan-300"
                              >
                                {confidence.toFixed(0)}%
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-[var(--nv-text)]">
                              تعیین نشده
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-5">
                        <p className="mb-3 text-xs font-bold text-cyan-300">
                          منطق تحلیل متناسب با پروفایل شما
                        </p>
                        <div className="prose prose-sm max-w-none leading-8 text-[var(--nv-text-soft)] prose-headings:text-[var(--nv-text)] prose-strong:text-cyan-600 dark:prose-invert dark:prose-strong:text-cyan-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {item.psychological_analysis ||
                              'تحلیل روان‌شناختی برای این نماد ثبت نشده است.'}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {item.risk_note && (
                        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4 text-sm leading-7 text-rose-200/80">
                          <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-400" />
                          {item.risk_note}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-5 py-10 text-center sm:p-12">
              <p className="text-[var(--nv-muted)]">
                در حال حاضر برنامه‌ای برای نمایش وجود ندارد.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
