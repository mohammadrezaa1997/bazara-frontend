import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  Newspaper,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import type { ReactNode } from "react";

import type { AdvisorAction, AdvisorItem } from "../../types";
import {
  formatDate,
  formatPercent,
  formatPrice,
  unitLabel,
} from "../../utils/formatters";

export const ADVISOR_CARD_UI_VERSION = "responsive-theme-ui-v1";

const ACTION_META: Record<
  AdvisorAction,
  { label: string; icon: typeof CheckCircle2; tone: string }
> = {
  buy: {
    label: "خرید پله‌ای",
    icon: CheckCircle2,
    tone: "border-emerald-500/25 bg-emerald-500/[0.09] text-emerald-700 dark:text-emerald-300",
  },
  sell: {
    label: "فروش / کاهش",
    icon: TrendingDown,
    tone: "border-rose-500/25 bg-rose-500/[0.09] text-rose-700 dark:text-rose-300",
  },
  hold: {
    label: "نگهداری",
    icon: Clock3,
    tone: "border-blue-500/25 bg-blue-500/[0.09] text-blue-700 dark:text-blue-300",
  },
  avoid: {
    label: "عدم ورود",
    icon: ShieldAlert,
    tone: "border-amber-500/25 bg-amber-500/[0.09] text-amber-700 dark:text-amber-300",
  },
  watch: {
    label: "زیرنظر",
    icon: Eye,
    tone: "border-violet-500/25 bg-violet-500/[0.09] text-violet-700 dark:text-violet-300",
  },
};

interface AdvisorCardProps {
  item: AdvisorItem;
  action: AdvisorAction;
}

type ScenarioValue = string | number | null | undefined;

interface ConditionalScenarioPlan {
  status?: "conditional_not_order" | string;
  scenario_type?: string;
  description?: string;
  pullback_zone?: { low?: ScenarioValue; high?: ScenarioValue };
  breakout_above?: ScenarioValue;
  invalidation_below?: ScenarioValue;
  targets_after_confirmation?: ScenarioValue[];
  current_risk_reward?: ScenarioValue;
  minimum_risk_reward?: ScenarioValue;
  mathematical_thresholds?: {
    required_entry_max?: ScenarioValue;
    required_stop_min?: ScenarioValue;
    note?: string | null;
  };
}

interface ComponentEvidence {
  key: string;
  label: string;
  score?: ScenarioValue;
  confidence?: ScenarioValue;
  sample_count?: number;
}

interface DetailedAdvisorItem {
  analysis_detail?: string | null;
  decision_explanation?: string | null;
  final_score?: ScenarioValue;
  component_evidence?: ComponentEvidence[];
  scenario_plan?: ConditionalScenarioPlan;
}

function score(value: number | undefined) {
  return value === undefined ? "—" : `${value} از ۱۰۰`;
}

function safeNewsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function newsDirection(value: string | null | undefined) {
  if (value?.includes("bearish")) {
    return {
      label: "اثر منفی",
      tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }
  if (value?.includes("bullish")) {
    return {
      label: "اثر مثبت",
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }
  return {
    label: "اثر خنثی",
    tone: "bg-[var(--nv-soft)] text-[var(--nv-muted)]",
  };
}

function LevelBox({
  label,
  value,
  tone = "text-[var(--nv-text)]",
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3.5">
      <p className="text-xs font-medium leading-5 text-[var(--nv-muted)]">
        {label}
      </p>
      <div
        dir="ltr"
        className={`mt-2 text-right text-[15px] font-black leading-6 ${tone}`}
      >
        {value}
      </div>
    </div>
  );
}

export function AdvisorCard({ item, action }: AdvisorCardProps) {
  const meta = ACTION_META[action];
  const ActionIcon = meta.icon;
  const plan = item.trade_plan;
  const targets = (plan?.targets ?? []).filter(
    (target): target is string | number => target !== null,
  );
  const details = item as AdvisorItem & DetailedAdvisorItem;
  const scenario = details.scenario_plan;
  const componentEvidence = details.component_evidence ?? [];
  const newsEvidence = componentEvidence
    .flatMap((component) =>
      (component.evidence_items ?? []).map((evidence) => ({
        ...evidence,
        componentLabel: component.label,
      })),
    )
    .slice(0, 5);
  const scenarioTargets = (scenario?.targets_after_confirmation ?? []).filter(
    (target): target is string | number =>
      target !== null && target !== undefined,
  );
  const hasTradePlan = Boolean(
    plan?.entry_min || plan?.entry_max || plan?.stop_loss || targets.length,
  );

  return (
    <article className="overflow-hidden rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)]">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black leading-8 text-[var(--nv-text)]">
                {item.name}
              </h3>
              <span
                dir="ltr"
                className="rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-2.5 py-1 text-xs font-bold text-[var(--nv-muted)]"
              >
                {item.symbol}
              </span>
            </div>
            <p className="mt-2 text-lg font-black text-[var(--nv-text)]">
              {formatPrice(item.current_price)}
              <span className="mr-1 text-xs font-medium text-[var(--nv-muted)]">
                {unitLabel(item.price_unit)}
              </span>
            </p>
          </div>

          <span
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm font-black ${meta.tone}`}
          >
            <ActionIcon className="h-4 w-4" />
            {meta.label}
          </span>
        </div>

        <p className="mt-4 text-[15px] leading-8 text-[var(--nv-text-soft)] sm:text-base">
          {item.reason || "برای این تصمیم توضیحی ثبت نشده است."}
        </p>

        {details.decision_explanation ? (
          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.07] p-4">
            <p className="text-sm font-black text-cyan-700 dark:text-cyan-300">
              نتیجه تصمیم
            </p>
            <p className="mt-2 text-[15px] font-bold leading-8 text-[var(--nv-text)] sm:text-base">
              {details.decision_explanation}
            </p>
          </div>
        ) : null}

        {details.analysis_detail || componentEvidence.length ? (
          <details className="group mt-4 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)]">
            <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-black text-[var(--nv-text)] marker:hidden">
              <span>نمایش تحلیل کامل و شواهد</span>
              <span className="flex items-center gap-2">
                {details.final_score !== null &&
                details.final_score !== undefined ? (
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    امتیاز {formatPrice(details.final_score)}
                  </span>
                ) : null}
                <ChevronDown className="h-5 w-5 text-[var(--nv-muted)] transition group-open:rotate-180" />
              </span>
            </summary>

            <div className="border-t border-[var(--nv-border)] px-4 pb-4 pt-3">
              {details.analysis_detail ? (
                <p className="text-[15px] leading-8 text-[var(--nv-text-soft)] sm:text-base sm:leading-9">
                  {details.analysis_detail}
                </p>
              ) : null}

              {componentEvidence.length ? (
                <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
                  {componentEvidence.map((component) => {
                    const numericScore = Number(component.score ?? 0);
                    const scoreTone =
                      numericScore > 9
                        ? "text-emerald-600 dark:text-emerald-300"
                        : numericScore < -9
                          ? "text-rose-600 dark:text-rose-300"
                          : "text-[var(--nv-text)]";
                    return (
                      <div
                        key={component.key}
                        className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-3"
                      >
                        <p className="text-sm font-bold text-[var(--nv-muted)]">
                          {component.label}
                        </p>
                        <p
                          dir="ltr"
                          className={`mt-1 text-right text-lg font-black ${scoreTone}`}
                        >
                          {formatPrice(component.score)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--nv-muted)]">
                          اطمینان {formatPrice(component.confidence)}٪
                          {component.sample_count
                            ? ` · ${component.sample_count} شاهد`
                            : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {newsEvidence.length ? (
                <section className="mt-5 border-t border-[var(--nv-border)] pt-4">
                  <h4 className="flex items-center gap-2 text-base font-black text-[var(--nv-text)]">
                    <Newspaper className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                    خبرهای اثرگذار بر این تصمیم
                  </h4>
                  <div className="mt-3 space-y-3">
                    {newsEvidence.map((news, index) => {
                      const direction = newsDirection(news.direction);
                      const href = safeNewsUrl(news.url);
                      return (
                        <article
                          key={`${news.signal_id ?? news.title}-${index}`}
                          className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[15px] font-black leading-7 text-[var(--nv-text)] sm:text-base">
                                {news.title}
                              </h5>
                              <p className="mt-1 text-sm leading-6 text-[var(--nv-muted)]">
                                {news.source || "منبع نامشخص"}
                                {news.published_at
                                  ? ` · ${formatDate(news.published_at)}`
                                  : ""}
                              </p>
                            </div>
                            <span className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${direction.tone}`}>
                              {direction.label} · {formatPrice(news.score)}
                            </span>
                          </div>

                          {news.reason ? (
                            <p className="mt-3 text-[15px] leading-8 text-[var(--nv-text-soft)] sm:text-base">
                              <span className="font-black text-cyan-700 dark:text-cyan-300">
                                چرا مهم است؟{" "}
                              </span>
                              {news.reason}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--nv-muted)]">
                            <span>
                              اطمینان {news.confidence_score ?? "—"}٪
                              {news.horizon ? ` · افق اثر ${news.horizon}` : ""}
                            </span>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 font-bold text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300"
                              >
                                مشاهده خبر
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          </details>
        ) : null}

        {item.blocking_reasons?.length ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
            <p className="flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" /> دلایل عدم اقدام
            </p>
            <ul className="mt-2 space-y-1 text-[15px] leading-7 text-amber-800/85 dark:text-amber-100/80">
              {item.blocking_reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {item.watch_trigger?.description ? (
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] p-4 text-[15px] leading-7 text-violet-800 dark:text-violet-100/85">
            <span className="font-black text-violet-700 dark:text-violet-300">
              شرط بررسی دوباره:{" "}
            </span>
            {item.watch_trigger.description}
          </div>
        ) : null}

        {action === "watch" && scenario ? (
          <section className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.055] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-300">
                <Eye className="h-4 w-4" /> سناریوی مشروط بررسی
              </p>
              <span className="rounded-full border border-cyan-500/20 bg-[var(--nv-panel)] px-2.5 py-1 text-xs font-bold text-[var(--nv-muted)]">
                سفارش خرید نیست
              </span>
            </div>
            <p className="mt-3 text-[15px] leading-8 text-[var(--nv-text-soft)]">
              {scenario.description ||
                "پس از تأیید دوباره داده‌ها، این دارایی بررسی شود."}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
              <LevelBox
                label="محدوده اصلاح قابل بررسی"
                value={
                  scenario.pullback_zone?.low && scenario.pullback_zone?.high
                    ? `${formatPrice(scenario.pullback_zone.low)} – ${formatPrice(scenario.pullback_zone.high)}`
                    : "سطح معتبر موجود نیست"
                }
              />
              <LevelBox
                label="تأیید شکست بالاتر از"
                value={
                  scenario.breakout_above
                    ? formatPrice(scenario.breakout_above)
                    : "نیازمند تحلیل تازه"
                }
              />
              <LevelBox
                label="ابطال سناریو زیر"
                tone="text-rose-600 dark:text-rose-300"
                value={
                  scenario.invalidation_below
                    ? formatPrice(scenario.invalidation_below)
                    : "تعیین نشده"
                }
              />
              <LevelBox
                label="هدف پس از تأیید"
                tone="text-emerald-600 dark:text-emerald-300"
                value={
                  scenarioTargets[0]
                    ? formatPrice(scenarioTargets[0])
                    : "پس از شکست محاسبه شود"
                }
              />
            </div>

            {scenario.scenario_type === "improve_risk_reward" ? (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3 text-sm leading-7 text-amber-800 dark:text-amber-100/80">
                <p>
                  نسبت فعلی:{" "}
                  <strong>{formatPrice(scenario.current_risk_reward)}</strong>
                  {" · "}حداقل لازم:{" "}
                  <strong>{formatPrice(scenario.minimum_risk_reward)}</strong>
                </p>
                <p className="mt-1">
                  حداکثر ورود ریاضی:{" "}
                  <strong>
                    {formatPrice(
                      scenario.mathematical_thresholds?.required_entry_max,
                    )}
                  </strong>
                  {" · "}حد ضرر ریاضی لازم:{" "}
                  <strong>
                    {formatPrice(
                      scenario.mathematical_thresholds?.required_stop_min,
                    )}
                  </strong>
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {hasTradePlan ? (
          <section className="mt-5">
            <p className="mb-2 text-sm font-black text-[var(--nv-text)]">
              برنامه معامله قطعی
            </p>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
              <LevelBox
                label="محدوده ورود"
                value={
                  plan?.entry_min && plan?.entry_max
                    ? `${formatPrice(plan.entry_min)} – ${formatPrice(plan.entry_max)}`
                    : "—"
                }
              />
              <LevelBox
                label="حد ضرر"
                tone="text-rose-600 dark:text-rose-300"
                value={formatPrice(plan?.stop_loss)}
              />
              <LevelBox
                label="هدف اول"
                tone="text-emerald-600 dark:text-emerald-300"
                value={formatPrice(targets[0])}
              />
              <LevelBox
                label="نسبت سود به زیان"
                value={formatPrice(plan?.risk_reward_ratio)}
              />
            </div>
          </section>
        ) : null}

        {item.allocation ? (
          <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4 min-[420px]:grid-cols-3">
            <LevelBox
              label="سهم بودجه"
              value={formatPercent(item.allocation.percent)}
            />
            <LevelBox
              label="مبلغ پیشنهادی"
              value={formatPrice(item.allocation.amount)}
            />
            <LevelBox
              label="مقدار تقریبی"
              value={formatPrice(item.allocation.estimated_quantity)}
            />
          </div>
        ) : null}

        {item.position ? (
          <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-blue-500/15 bg-blue-500/[0.06] p-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
            <LevelBox
              label="تعداد فعلی"
              value={formatPrice(item.position.quantity)}
            />
            <LevelBox
              label="میانگین خرید"
              value={formatPrice(item.position.average_buy_price)}
            />
            <LevelBox
              label="ارزش روز"
              value={formatPrice(item.position.market_value)}
            />
            <LevelBox
              label="بازده تحقق‌نیافته"
              value={formatPercent(item.position.unrealized_pnl_percent)}
            />
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-[var(--nv-border)] pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--nv-muted)]">اطمینان</p>
            <p className="mt-1 text-sm font-bold">
              {score(item.confidence_score)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--nv-muted)]">کیفیت داده</p>
            <p className="mt-1 text-sm font-bold">
              {score(item.data_quality_score)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--nv-muted)]">ریسک</p>
            <p className="mt-1 text-sm font-bold">{score(item.risk_score)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--nv-muted)]">زمان قیمت</p>
            <p className="mt-1 text-sm font-bold">
              {formatDate(item.price_recorded_at)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
