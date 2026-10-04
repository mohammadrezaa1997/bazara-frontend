"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Eye,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  X,
} from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";

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

export const ADVISOR_UI_VERSION = "advisor-workspace-ui-v3";

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

function SummaryMetric({
  label,
  value,
  tone = "text-[var(--nv-text)]",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-3 sm:px-4">
      <p className="text-xs font-bold text-[var(--nv-muted)]">{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${tone}`}>
        {value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}

export function IranMarketAdvisorDashboard() {
  const advisor = useGenerateIranMarketAdvice();
  const [activeTab, setActiveTab] =
    useState<BucketKey>("buy_recommendations");
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
  const actionableCount = result
    ? Number(result.summary.buy) +
      Number(result.summary.sell) +
      Number(result.summary.hold)
    : 0;

  return (
    <div dir="rtl" className="nv-page nv-mobile-safe text-[var(--nv-text)]">
      <AppHeader
        active="iran"
        badge="ADVISOR"
        subtitle="مشاور بازار ایران"
        maxWidthClass="max-w-[1500px]"
      />

      <main className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
        <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)] sm:mb-6">
          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)] sm:h-14 sm:w-14">
                <BrainCircuit className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="nv-kicker">دستیار تصمیم‌گیری بازار ایران</p>
                <h1 className="mt-1.5 text-xl font-black tracking-tight text-[var(--nv-text)] sm:text-2xl lg:text-[28px]">
                  پیشنهاد روشن، فقط با داده قابل اتکا
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--nv-muted)] sm:text-[15px]">
                  قیمت، تحلیل تکنیکال، خبر و شرایط کلان کنار هم ارزیابی می‌شوند؛
                  اگر داده کافی نباشد، به‌جای پیشنهاد عجولانه دلیل انتظار را
                  می‌بینید.
                </p>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
              <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--nv-positive-border)] bg-[var(--nv-positive-soft)] px-3 text-xs font-black text-[var(--nv-positive)]">
                <ShieldCheck className="h-4 w-4" />
                کنترل کیفیت داده
              </span>
              <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 text-xs font-black text-[var(--nv-text-soft)]">
                <Clock3 className="h-4 w-4" />
                پایش تازگی قیمت
              </span>
            </div>
          </div>
        </section>

        <div
          dir="ltr"
          className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start xl:gap-6"
        >
          <section dir="rtl" className="min-w-0 xl:col-start-1 xl:row-start-1">
            <div className="mb-4 xl:hidden">
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="nv-button-primary w-full"
                aria-expanded={isFormOpen}
              >
                <Settings2 className="h-5 w-5" />
                تنظیم بودجه و ساخت پیشنهاد
              </button>
            </div>

            {!result && !advisor.isError ? (
              <div className="nv-card overflow-hidden rounded-2xl">
                <div className="border-b border-[var(--nv-border)] p-5 sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--nv-soft-strong)] text-[var(--nv-accent)]">
                      <Settings2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-[var(--nv-text)] sm:text-xl">
                        پیشنهاد شخصی شما هنوز ساخته نشده است
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--nv-muted)] sm:text-[15px]">
                        بودجه، سطح ریسک و بازارهای مدنظر را مشخص کنید. نتیجه در
                        پنج وضعیت شفاف نمایش داده می‌شود و هر تصمیم توضیح قابل
                        بررسی دارد.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-px bg-[var(--nv-border)] sm:grid-cols-3">
                  {[
                    ["۱", "تنظیم ورودی", "بودجه و دارایی‌های فعلی"],
                    ["۲", "ارزیابی داده", "قیمت، تکنیکال و خبر"],
                    ["۳", "نمایش تصمیم", "اقدام، انتظار یا عدم ورود"],
                  ].map(([number, title, description]) => (
                    <div key={number} className="bg-[var(--nv-panel)] p-4 sm:p-5">
                      <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-[var(--nv-accent-soft)] text-xs font-black text-[var(--nv-accent)]">
                        {number}
                      </span>
                      <p className="mt-3 text-sm font-black text-[var(--nv-text)]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-[var(--nv-muted)]">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {advisor.isError ? (
              <div className="nv-status-danger rounded-2xl p-6 text-center sm:p-8">
                <AlertTriangle className="mx-auto h-9 w-9" />
                <h2 className="mt-4 text-lg font-black">
                  مشاور نتوانست پیشنهاد تولید کند
                </h2>
                <p className="mt-2 text-[15px] leading-8">
                  {getErrorMessage(advisor.error)}
                </p>
              </div>
            ) : null}

            {result ? (
              <div className="space-y-4 sm:space-y-5" aria-live="polite">
                <section className="nv-card overflow-hidden rounded-2xl">
                  <div className="flex flex-col gap-5 border-b border-[var(--nv-border)] p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-black ${
                            result.status === "actionable"
                              ? "nv-status-success"
                              : "nv-status-warning"
                          }`}
                        >
                          {result.status === "actionable" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {result.status === "actionable"
                            ? "فرصت قابل اقدام"
                            : "فعلاً نیازمند پایش"}
                        </span>
                        <span className="text-xs font-bold text-[var(--nv-muted)]">
                          {result.coverage.evaluated_assets.toLocaleString("fa-IR")} دارایی بررسی شد
                        </span>
                      </div>
                      <h2 className="mt-3 max-w-3xl text-lg font-black leading-8 text-[var(--nv-text)] sm:text-xl sm:leading-9">
                        {result.summary.message}
                      </h2>
                      <p className="mt-2 text-xs leading-6 text-[var(--nv-muted)] sm:text-sm">
                        آخرین ارزیابی: {formatDate(result.generated_at)}
                        {result.cycle
                          ? ` · بازبینی بعدی ${formatDate(result.cycle.next_review_at)}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex min-w-full items-center justify-between rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-3 lg:min-w-52 lg:block lg:text-right">
                      <div>
                        <p className="text-xs font-bold text-[var(--nv-muted)]">
                          ذخیره نقد پیشنهادی
                        </p>
                        <p className="mt-1 text-xl font-black text-[var(--nv-text)]">
                          {formatPercent(result.summary.cash_reserve_percent)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[var(--nv-text-soft)] lg:mt-2">
                        {formatPrice(result.summary.cash_reserve_amount)} تومان
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-5 sm:p-5">
                    <SummaryMetric
                      label="خرید"
                      value={Number(result.summary.buy)}
                      tone="text-[var(--nv-positive)]"
                    />
                    <SummaryMetric
                      label="فروش"
                      value={Number(result.summary.sell)}
                      tone="text-[var(--nv-danger)]"
                    />
                    <SummaryMetric
                      label="نگهداری"
                      value={Number(result.summary.hold)}
                      tone="text-[var(--nv-info)]"
                    />
                    <SummaryMetric
                      label="عدم ورود"
                      value={Number(result.summary.avoid)}
                      tone="text-[var(--nv-warning)]"
                    />
                    <SummaryMetric
                      label="زیرنظر"
                      value={Number(result.summary.watch)}
                      tone="text-[var(--nv-accent)]"
                    />
                  </div>
                </section>

                <div className="nv-scrollbar sticky top-[65px] z-30 overflow-x-auto rounded-xl border border-[var(--nv-border)] bg-[var(--nv-overlay)] p-1.5 shadow-[var(--nv-shadow)] backdrop-blur-xl sm:top-[81px]">
                  <div className="flex min-w-max gap-1.5 sm:grid sm:min-w-0 sm:grid-cols-5">
                    {TABS.map((tab) => {
                      const TabIcon = tab.icon;
                      const count = Number(result.summary[tab.countKey]);
                      return (
                        <button
                          type="button"
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition sm:min-w-0 ${
                            activeTab === tab.key
                              ? "border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]"
                              : "border-transparent text-[var(--nv-muted)] hover:bg-[var(--nv-soft)] hover:text-[var(--nv-text)]"
                          }`}
                        >
                          <TabIcon className="h-4 w-4 shrink-0" />
                          <span>{tab.label}</span>
                          <span className="grid h-6 min-w-6 place-items-center rounded-md bg-[var(--nv-panel)] px-1.5 text-xs tabular-nums text-[var(--nv-text-soft)]">
                            {count.toLocaleString("fa-IR")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {items.length ? (
                  <div className="grid min-w-0 gap-4">
                    {items.map((item) => (
                      <AdvisorCard
                        key={`${selectedTab.key}-${item.symbol}`}
                        item={item}
                        action={selectedTab.action}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="nv-card rounded-2xl p-8 text-center sm:p-10">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--nv-soft)] text-[var(--nv-muted)]">
                      <Eye className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-base font-black text-[var(--nv-text)]">
                      در دسته «{selectedTab.label}» موردی وجود ندارد
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
                      {actionableCount === 0
                        ? "این نتیجه طبیعی است؛ مشاور در نبود فرصت معتبر، نقد ماندن را ترجیح می‌دهد."
                        : "برای مشاهده موارد موجود، یکی از دسته‌های دارای عدد را انتخاب کنید."}
                    </p>
                  </div>
                )}

                <p className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-3 text-xs leading-6 text-[var(--nv-muted)] sm:text-sm sm:leading-7">
                  {result.disclaimer}
                </p>
              </div>
            ) : null}
          </section>

          {isFormOpen ? (
            <button
              type="button"
              aria-label="بستن فرم"
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm xl:hidden"
            />
          ) : null}

          <aside
            dir="rtl"
            className={`min-w-0 xl:col-start-2 xl:row-start-1 ${
              isFormOpen
                ? "fixed inset-x-2 bottom-2 top-16 z-[60] block overflow-y-auto rounded-2xl bg-[var(--nv-bg)] p-2 shadow-[var(--nv-shadow-raised)]"
                : "hidden"
            } nv-scrollbar safe-bottom xl:sticky xl:top-24 xl:z-10 xl:block xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:rounded-none xl:bg-transparent xl:p-0 xl:shadow-none`}
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1 xl:hidden">
              <p className="text-base font-black">تنظیمات پیشنهاد</p>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="nv-icon-button"
                aria-label="بستن"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <AdvisorForm
              isPending={advisor.isPending}
              onSubmit={handleGenerate}
            />

            <div className="mt-3 rounded-xl border border-[var(--nv-warning-border)] bg-[var(--nv-warning-soft)] p-3.5 text-xs leading-6 text-[var(--nv-warning)]">
              این خروجی ابزار پشتیبان تصمیم است. برنامه معامله فقط با قیمت تازه
              و تحلیل عددی کامل نمایش داده می‌شود.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
