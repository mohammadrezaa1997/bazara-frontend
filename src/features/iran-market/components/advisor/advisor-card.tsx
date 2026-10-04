import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  Newspaper,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import type { ReactNode } from "react";

import type {
  AdvisorAction,
  AdvisorComponentEvidence,
  AdvisorItem,
  AdvisorNewsEvidence,
} from "../../types";
import {
  formatDate,
  formatPercent,
  formatPrice,
  unitLabel,
} from "../../utils/formatters";

export const ADVISOR_CARD_UI_VERSION = "advisor-card-ui-v3";

const ACTION_META: Record<
  AdvisorAction,
  { label: string; icon: typeof CheckCircle2; tone: string }
> = {
  buy: {
    label: "خرید پله‌ای",
    icon: CheckCircle2,
    tone: "nv-status-success",
  },
  sell: {
    label: "فروش / کاهش",
    icon: TrendingDown,
    tone: "nv-status-danger",
  },
  hold: {
    label: "نگهداری",
    icon: Clock3,
    tone: "nv-status-info",
  },
  avoid: {
    label: "عدم ورود",
    icon: ShieldAlert,
    tone: "nv-status-warning",
  },
  watch: {
    label: "زیرنظر",
    icon: Eye,
    tone: "border-[var(--nv-border-strong)] bg-[var(--nv-soft-strong)] text-[var(--nv-text-soft)]",
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

const WATCH_TRIGGER_COPY: Record<string, string> = {
  fresh_price:
    "پس از دریافت قیمت تازه، تحلیل ترکیبی دوباره ساخته و این نماد ارزیابی می‌شود.",
  valid_composite_analysis:
    "پس از ساخته‌شدن تحلیل ترکیبی معتبر شامل تکنیکال، خبر و شرایط کلان، این نماد دوباره بررسی می‌شود.",
};

function watchTriggerDescription(item: AdvisorItem) {
  const trigger = item.watch_trigger;
  if (!trigger) return null;
  return (
    trigger.description ||
    (trigger.type ? WATCH_TRIGGER_COPY[trigger.type] : undefined) ||
    "پس از تازه‌شدن داده‌ها، این دارایی دوباره ارزیابی می‌شود."
  );
}

function emptyNewsMessage(item: AdvisorItem) {
  if (item.evidence_note) return item.evidence_note;
  if (item.reason_code === "stale_price") {
    return "قیمت این دارایی تازه نیست؛ به همین دلیل تحلیل ترکیبی جدید ساخته نشده و خبرها هنوز به این تصمیم متصل نشده‌اند.";
  }
  if (item.reason_code === "missing_valid_composite") {
    return "تحلیل ترکیبی معتبر برای این دارایی موجود نیست. پس از تکمیل تحلیل تکنیکال، خبر و داده‌های کلان، شواهد خبری اینجا نمایش داده می‌شوند.";
  }
  return "در تحلیل فعلی، خبر مستقیمی با اعتبار کافی برای اثرگذاری بر این تصمیم ثبت نشده است.";
}

function NewsEvidenceCard({ news }: { news: AdvisorNewsEvidence }) {
  const direction = newsDirection(news.direction);
  const href = safeNewsUrl(news.url);

  return (
    <article className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-black leading-7 text-[var(--nv-text)] sm:text-[15px]">
            {news.title}
          </h5>
          <p className="mt-0.5 text-xs leading-5 text-[var(--nv-muted)]">
            {news.source || "منبع نامشخص"}
            {news.published_at ? ` · ${formatDate(news.published_at)}` : ""}
          </p>
        </div>
        <span
          className={`w-fit shrink-0 rounded-lg border px-2.5 py-1 text-xs font-black ${direction.tone}`}
        >
          {direction.label} · {formatPrice(news.score)}
        </span>
      </div>

      {news.reason ? (
        <p className="mt-2 text-sm leading-7 text-[var(--nv-text-soft)]">
          {news.reason}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--nv-muted)]">
        <span>
          اطمینان {news.confidence_score ?? "—"}٪
          {news.horizon ? ` · افق اثر ${news.horizon}` : ""}
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-bold text-[var(--nv-accent)] hover:bg-[var(--nv-accent-soft)]"
          >
            مشاهده خبر
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
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
      tone: "nv-status-danger",
    };
  }
  if (value?.includes("bullish")) {
    return {
      label: "اثر مثبت",
      tone: "nv-status-success",
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
    <div className="nv-surface min-w-0 rounded-xl p-3.5">
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

function ScoreMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number;
  tone: string;
}) {
  const normalized = Math.min(100, Math.max(0, Number(value ?? 0)));

  return (
    <div className={`min-w-0 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[var(--nv-muted)]">{label}</p>
        <p className="text-sm font-black tabular-nums">
          {value === undefined ? "—" : value.toLocaleString("fa-IR")}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
        <div
          className="h-full rounded-full bg-current transition-[width] duration-300"
          style={{ width: `${normalized}%` }}
          aria-hidden="true"
        />
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
  const scenario = item.scenario_plan as ConditionalScenarioPlan | undefined;
  const componentEvidence: AdvisorComponentEvidence[] =
    item.component_evidence ?? [];
  const newsEvidence = componentEvidence
    .flatMap((component) =>
      (component.evidence_items ?? []).map((evidence) => ({
        ...evidence,
        componentLabel: component.label,
      })),
    )
    .slice(0, 5);
  const triggerDescription = watchTriggerDescription(item);
  const scenarioTargets = (scenario?.targets_after_confirmation ?? []).filter(
    (target): target is string | number =>
      target !== null && target !== undefined,
  );
  const hasTradePlan = Boolean(
    plan?.entry_min || plan?.entry_max || plan?.stop_loss || targets.length,
  );

  return (
    <article className="nv-card-interactive min-w-0 overflow-hidden rounded-2xl">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black leading-8 text-[var(--nv-text)]">
                {item.name}
              </h3>
              <span
                dir="ltr"
                className="rounded-lg border border-[var(--nv-border)] bg-[var(--nv-soft)] px-2.5 py-1 text-xs font-bold text-[var(--nv-muted)]"
              >
                {item.symbol}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
              <p
                dir="ltr"
                className="text-left text-lg font-black tabular-nums text-[var(--nv-text)]"
              >
                {formatPrice(item.current_price)}
              </p>
              <span className="text-xs font-medium text-[var(--nv-muted)]">
                {unitLabel(item.price_unit)}
              </span>
            </div>
            {item.price_recorded_at ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-5 text-[var(--nv-muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                قیمت ثبت‌شده در {formatDate(item.price_recorded_at)}
                {item.price_age_minutes !== undefined
                  ? ` · ${Math.round(item.price_age_minutes).toLocaleString("fa-IR")} دقیقه قبل`
                  : ""}
              </p>
            ) : null}
          </div>

          <span
            className={`inline-flex min-h-10 w-fit shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-black ${meta.tone}`}
          >
            <ActionIcon className="h-4 w-4" />
            {meta.label}
          </span>
        </div>

        <p className="mt-4 text-[15px] leading-8 text-[var(--nv-text-soft)] sm:text-base">
          {item.reason || "برای این تصمیم توضیحی ثبت نشده است."}
        </p>

        {item.decision_explanation ? (
          <div className="nv-status-info mt-4 rounded-xl p-4">
            <p className="text-sm font-black">
              نتیجه تصمیم
            </p>
            <p className="mt-2 text-[15px] font-bold leading-8 text-[var(--nv-text)] sm:text-base">
              {item.decision_explanation}
            </p>
          </div>
        ) : null}

        <section className="mt-4 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)] sm:text-[15px]">
              <Newspaper className="h-4 w-4 text-[var(--nv-accent)]" />
              خبرهای اثرگذار
            </h4>
            <span className="rounded-lg border border-[var(--nv-border)] bg-[var(--nv-panel)] px-2 py-1 text-xs font-bold text-[var(--nv-muted)]">
              {newsEvidence.length.toLocaleString("fa-IR")} خبر معتبر
            </span>
          </div>

          {newsEvidence.length ? (
            <div className="mt-3 space-y-2.5">
              {newsEvidence.map((news, index) => (
                <NewsEvidenceCard
                  key={`${news.signal_id ?? news.title}-${index}`}
                  news={news}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-panel)] p-3 text-sm leading-7 text-[var(--nv-muted)]">
              <RefreshCw className="mt-1 h-4 w-4 shrink-0 text-[var(--nv-accent)]" />
              <p>{emptyNewsMessage(item)}</p>
            </div>
          )}
        </section>

        {item.analysis_detail || componentEvidence.length ? (
          <details className="group mt-4 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)]">
            <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-black text-[var(--nv-text)] marker:hidden">
              <span>نمایش تحلیل کامل و شواهد</span>
              <span className="flex items-center gap-2">
                {item.final_score !== null && item.final_score !== undefined ? (
                  <span className="rounded-lg bg-[var(--nv-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--nv-accent)]">
                    امتیاز {formatPrice(item.final_score)}
                  </span>
                ) : null}
                <ChevronDown className="h-5 w-5 text-[var(--nv-muted)] transition group-open:rotate-180" />
              </span>
            </summary>

            <div className="border-t border-[var(--nv-border)] px-4 pb-4 pt-3">
              {item.analysis_detail ? (
                <p className="text-[15px] leading-8 text-[var(--nv-text-soft)] sm:text-base sm:leading-9">
                  {item.analysis_detail}
                </p>
              ) : null}

              {componentEvidence.length ? (
                <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
                  {componentEvidence.map((component) => {
                    const numericScore = Number(component.score ?? 0);
                    const scoreTone =
                      numericScore > 9
                        ? "text-[var(--nv-positive)]"
                        : numericScore < -9
                          ? "text-[var(--nv-danger)]"
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

            </div>
          </details>
        ) : null}

        {item.blocking_reasons?.length ? (
          <div className="nv-status-warning mt-4 rounded-xl p-4">
            <p className="flex items-center gap-2 text-sm font-black">
              <AlertTriangle className="h-4 w-4" /> دلایل عدم اقدام
            </p>
            <ul className="mt-2 space-y-1 text-[15px] leading-7">
              {item.blocking_reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {triggerDescription ? (
          <div className="nv-status-info mt-4 rounded-xl p-4 text-[15px] leading-7">
            <span className="font-black">
              شرط بررسی دوباره:{" "}
            </span>
            {triggerDescription}
          </div>
        ) : null}

        {action === "watch" && scenario ? (
          <section className="nv-status-info mt-4 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-black">
                <Eye className="h-4 w-4" /> سناریوی مشروط بررسی
              </p>
              <span className="rounded-full border border-[var(--nv-border)] bg-[var(--nv-panel)] px-2.5 py-1 text-xs font-bold text-[var(--nv-muted)]">
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
                tone="text-[var(--nv-danger)]"
                value={
                  scenario.invalidation_below
                    ? formatPrice(scenario.invalidation_below)
                    : "تعیین نشده"
                }
              />
              <LevelBox
                label="هدف پس از تأیید"
                tone="text-[var(--nv-positive)]"
                value={
                  scenarioTargets[0]
                    ? formatPrice(scenarioTargets[0])
                    : "پس از شکست محاسبه شود"
                }
              />
            </div>

            {scenario.scenario_type === "improve_risk_reward" ? (
              <div className="nv-status-warning mt-3 rounded-xl p-3 text-sm leading-7">
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
                tone="text-[var(--nv-danger)]"
                value={formatPrice(plan?.stop_loss)}
              />
              <LevelBox
                label="هدف اول"
                tone="text-[var(--nv-positive)]"
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
          <div className="nv-status-success mt-4 grid grid-cols-1 gap-2 rounded-xl p-4 min-[420px]:grid-cols-3">
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
          <div className="nv-status-info mt-4 grid grid-cols-1 gap-2 rounded-xl p-4 min-[420px]:grid-cols-2 sm:grid-cols-4">
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

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-[var(--nv-border)] pt-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <ScoreMetric
            label="اطمینان تحلیل"
            value={item.confidence_score}
            tone="text-[var(--nv-info)]"
          />
          <ScoreMetric
            label="کیفیت داده"
            value={item.data_quality_score}
            tone="text-[var(--nv-positive)]"
          />
          <ScoreMetric
            label="ریسک"
            value={item.risk_score}
            tone="text-[var(--nv-warning)]"
          />
          <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-2.5">
            <p className="text-xs font-bold text-[var(--nv-muted)]">
              زمان ثبت قیمت
            </p>
            <p className="mt-1 text-sm font-black text-[var(--nv-text)]">
              {formatDate(item.price_recorded_at)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
