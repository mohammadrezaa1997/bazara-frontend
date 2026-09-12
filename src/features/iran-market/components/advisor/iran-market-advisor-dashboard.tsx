"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Settings2,
  ShieldAlert,
  TrendingDown,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";

import { IranMarketApiError } from "../../api/client";
import { useGenerateIranMarketAdvice } from "../../hooks/use-iran-market";
import type {
  AdvisorAction,
  AdvisorItem,
  AdvisorRequest,
  AdvisorResponse,
} from "../../types";
import { formatDate, formatPercent, formatPrice } from "../../utils/formatters";
import { AdvisorCard } from "./advisor-card";
import { AdvisorForm } from "./advisor-form";

export const ADVISOR_UI_VERSION = "responsive-theme-ui-v1";

type BucketKey =
  | "buy_recommendations"
  | "sell_recommendations"
  | "hold_recommendations"
  | "avoid_recommendations"
  | "watchlist";

const TABS: Array<{
  key: BucketKey;
  label: string;
  action: AdvisorAction;
  icon: typeof CheckCircle2;
  countKey: keyof AdvisorResponse["summary"];
}> = [
  {
    key: "buy_recommendations",
    label: "خرید",
    action: "buy",
    icon: CheckCircle2,
    countKey: "buy",
  },
  {
    key: "sell_recommendations",
    label: "فروش",
    action: "sell",
    icon: TrendingDown,
    countKey: "sell",
  },
  {
    key: "hold_recommendations",
    label: "نگهداری",
    action: "hold",
    icon: Banknote,
    countKey: "hold",
  },
  {
    key: "avoid_recommendations",
    label: "عدم ورود",
    action: "avoid",
    icon: ShieldAlert,
    countKey: "avoid",
  },
  {
    key: "watchlist",
    label: "زیرنظر",
    action: "watch",
    icon: Eye,
    countKey: "watch",
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof IranMarketApiError) return error.message;
  return error instanceof Error
    ? error.message
    : "ساخت پیشنهاد مشاور ناموفق بود.";
}

export function IranMarketAdvisorDashboard() {
  const advisor = useGenerateIranMarketAdvice();
  const [activeTab, setActiveTab] = useState<BucketKey>("buy_recommendations");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleGenerate = (request: AdvisorRequest) => {
    advisor.mutate(request, {
      onSuccess: (result) => {
        const firstNonEmpty = TABS.find((tab) => result[tab.key].length > 0);
        setActiveTab(firstNonEmpty?.key ?? "watchlist");
        setIsFormOpen(false);
      },
    });
  };

  const result = advisor.data;
  const selectedTab = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const items: AdvisorItem[] = result?.[activeTab] ?? [];

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-[var(--nv-bg)] text-[var(--nv-text)]"
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -right-48 -top-48 h-[560px] w-[560px] rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute -left-48 top-1/3 h-[480px] w-[480px] rounded-full bg-violet-500/[0.045] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[var(--nv-border)] bg-[var(--nv-overlay)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1540px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 sm:h-11 sm:w-11">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-[var(--nv-text)] sm:text-lg">
                مشاور خبره بازار ایران
              </h1>
              <p className="mt-0.5 hidden text-sm text-[var(--nv-muted)] sm:block">
                تصمیم قابل توضیح بر پایه تکنیکال، خبر، ژئوپلیتیک و اقتصاد کلان
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/iran-market"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] text-[var(--nv-text-soft)] transition hover:border-cyan-500/30 hover:text-cyan-500 sm:flex sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:font-bold"
              aria-label="بازگشت به بازار"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">بازگشت به بازار</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1540px] px-3 py-4 sm:px-6 sm:py-7 lg:px-10 xl:grid xl:grid-cols-[370px_minmax(0,1fr)] xl:items-start xl:gap-7 xl:py-9">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 px-4 text-base font-black text-white shadow-lg shadow-cyan-500/10 xl:hidden"
          aria-expanded={isFormOpen}
        >
          <Settings2 className="h-5 w-5" />
          تنظیم بودجه و ساخت پیشنهاد
        </button>

        {isFormOpen ? (
          <button
            type="button"
            aria-label="بستن فرم"
            onClick={() => setIsFormOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm xl:hidden"
          />
        ) : null}

        <aside
          className={`${
            isFormOpen
              ? "fixed inset-x-2 bottom-2 top-16 z-[60] block overflow-y-auto rounded-[26px] bg-[var(--nv-bg)] p-2 shadow-2xl"
              : "hidden"
          } nv-scrollbar safe-bottom xl:sticky xl:top-24 xl:z-10 xl:block xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:rounded-none xl:bg-transparent xl:p-0 xl:shadow-none`}
        >
          <div className="mb-2 flex items-center justify-between px-2 py-1 xl:hidden">
            <p className="text-base font-black">تنظیمات پیشنهاد</p>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)]"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <AdvisorForm
            isPending={advisor.isPending}
            onSubmit={handleGenerate}
          />
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4 text-sm leading-7 text-amber-700 dark:text-amber-100/80">
            این ابزار تضمین سود نیست. نقاط معامله فقط وقتی نمایش داده می‌شوند که
            تحلیل معتبر و برنامه عددی کامل باشد.
          </div>
        </aside>

        <section className="min-w-0">
          {!result && !advisor.isError ? (
            <div className="flex min-h-[440px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-panel)] px-5 text-center shadow-[var(--nv-shadow)] sm:min-h-[560px] sm:px-8">
              <BrainCircuit className="h-12 w-12 text-cyan-500/50" />
              <h2 className="mt-5 text-xl font-black sm:text-2xl">
                آماده ساخت پیشنهاد واقعی
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-8 text-[var(--nv-muted)] sm:text-base">
                بودجه، سطح ریسک و نمادهای مدنظر را وارد کنید. اگر داده کافی
                نباشد، سیستم صادقانه «زیرنظر» یا «عدم ورود» اعلام می‌کند.
              </p>
            </div>
          ) : null}

          {advisor.isError ? (
            <div className="rounded-[28px] border border-rose-500/25 bg-rose-500/[0.07] p-6 text-center sm:p-8">
              <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
              <h2 className="mt-4 text-lg font-black">
                مشاور نتوانست پیشنهاد تولید کند
              </h2>
              <p className="mt-2 text-[15px] leading-8 text-rose-700 dark:text-rose-100/80">
                {getErrorMessage(advisor.error)}
              </p>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4 sm:space-y-5">
              <div
                className={`rounded-[26px] border p-4 sm:p-6 ${
                  result.status === "actionable"
                    ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                    : "border-amber-500/20 bg-amber-500/[0.07]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--nv-muted)]">
                      جمع‌بندی مشاور
                    </p>
                    <h2 className="mt-2 text-lg font-black leading-8 sm:text-xl">
                      {result.summary.message}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--nv-muted)]">
                      {result.coverage.evaluated_assets} دارایی ارزیابی شد ·{" "}
                      {formatDate(result.generated_at)}
                    </p>
                    {result.cycle ? (
                      <p className="mt-1 text-sm text-[var(--nv-muted)]">
                        بازبینی بعدی {formatDate(result.cycle.next_review_at)} ·
                        بازتنظیم سبد {formatDate(result.cycle.next_rebalance_at)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-4 py-3 sm:block sm:min-w-40 sm:text-left">
                    <p className="text-xs text-[var(--nv-muted)]">ذخیره نقد</p>
                    <div>
                      <p className="text-lg font-black sm:mt-1">
                        {formatPercent(result.summary.cash_reserve_percent)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--nv-muted)]">
                        {formatPrice(result.summary.cash_reserve_amount)} تومان
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nv-scrollbar sticky top-[65px] z-30 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-overlay)] p-2 backdrop-blur-xl sm:top-[81px]">
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const count = Number(result.summary[tab.countKey]);
                  return (
                    <button
                      type="button"
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex min-h-11 min-w-max items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                        activeTab === tab.key
                          ? "bg-cyan-500 text-white shadow-sm"
                          : "text-[var(--nv-muted)] hover:bg-[var(--nv-soft)] hover:text-[var(--nv-text)]"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                      <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-black/25">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {items.length ? (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {items.map((item) => (
                    <AdvisorCard
                      key={`${selectedTab.key}-${item.symbol}`}
                      item={item}
                      action={selectedTab.action}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[26px] border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-panel)] p-10 text-center text-base text-[var(--nv-muted)]">
                  در دسته «{selectedTab.label}» موردی وجود ندارد.
                </div>
              )}

              <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 text-sm leading-7 text-[var(--nv-muted)]">
                {result.disclaimer}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
