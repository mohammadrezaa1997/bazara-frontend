"use client";

import { FormEvent, useId, useState } from "react";
import { Loader2, Plus, Trash2, WalletCards } from "lucide-react";

import type {
  AdvisorHoldingInput,
  AdvisorRequest,
  InvestmentHorizon,
  RiskProfile,
} from "../../types";

const CORE_ASSETS = [
  { symbol: "IR_USD", label: "دلار آمریکا" },
  { symbol: "IR_EUR", label: "یورو" },
  { symbol: "IR_GOLD_18K", label: "طلای ۱۸ عیار" },
  { symbol: "IR_COIN_EMAMI", label: "سکه امامی" },
  { symbol: "IR_TSE_INDEX", label: "شاخص کل بورس" },
] as const;

const DEFAULT_SYMBOLS = CORE_ASSETS.map((asset) => asset.symbol);

export const ADVISOR_FORM_UI_VERSION = "responsive-theme-ui-v1";

interface HoldingRow {
  id: number;
  symbol: string;
  quantity: string;
  average_buy_price: string;
}

interface AdvisorFormProps {
  isPending: boolean;
  onSubmit: (request: AdvisorRequest) => void;
}

function toEnglishDigits(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function normalizeDecimal(value: string, maximumDecimals = 8) {
  const cleaned = toEnglishDigits(value)
    .replace(/[٬،,\s]/g, "")
    .replace(/٫/g, ".")
    .replace(/[^\d.]/g, "");
  const [integerPart = "", ...decimalParts] = cleaned.split(".");
  const decimalPart = decimalParts.join("").slice(0, maximumDecimals);

  if (!decimalParts.length) return integerPart;
  return `${integerPart}.${decimalPart}`;
}

function formatNumericInput(value: string) {
  if (!value) return "";
  const [integerPart, decimalPart] = value.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger}.${decimalPart}`;
}

export function AdvisorForm({ isPending, onSubmit }: AdvisorFormProps) {
  const symbolListId = useId();
  const [budget, setBudget] = useState("100000000");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("moderate");
  const [investmentHorizon, setInvestmentHorizon] =
    useState<InvestmentHorizon>("3_months");
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleSymbol = (symbol: string) => {
    setSymbols((current) =>
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  };

  const addHolding = () => {
    setHoldings((current) => [
      ...current,
      {
        id: Date.now(),
        symbol: "",
        quantity: "",
        average_buy_price: "",
      },
    ]);
    setFormError(null);
  };

  const updateHolding = (id: number, patch: Partial<HoldingRow>) => {
    setHoldings((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
    setFormError(null);
  };

  const removeHolding = (id: number) => {
    setHoldings((current) => current.filter((row) => row.id !== id));
    setFormError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const numericBudget = Number(budget);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      setFormError("بودجه باید یک عدد مثبت بر حسب تومان باشد.");
      return;
    }

    const parsedHoldings: AdvisorHoldingInput[] = [];
    const holdingSymbols = new Set<string>();

    for (const row of holdings) {
      const symbol = row.symbol.trim().toUpperCase();
      const quantity = Number(row.quantity);
      const averageBuyPrice = Number(row.average_buy_price);

      if (!symbol) {
        setFormError("نماد تمام دارایی‌های فعلی را انتخاب کنید.");
        return;
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setFormError(`تعداد دارایی ${symbol} باید بیشتر از صفر باشد.`);
        return;
      }
      if (!Number.isFinite(averageBuyPrice) || averageBuyPrice <= 0) {
        setFormError(`میانگین قیمت خرید ${symbol} باید بیشتر از صفر باشد.`);
        return;
      }
      if (holdingSymbols.has(symbol)) {
        setFormError(`دارایی ${symbol} بیش از یک‌بار وارد شده است.`);
        return;
      }

      holdingSymbols.add(symbol);
      parsedHoldings.push({
        symbol,
        quantity: row.quantity,
        average_buy_price: row.average_buy_price,
      });
    }

    const requestedSymbols = Array.from(
      new Set([...symbols, ...parsedHoldings.map((holding) => holding.symbol)]),
    );

    if (!requestedSymbols.length) {
      setFormError("حداقل یک بازار را برای بررسی انتخاب کنید.");
      return;
    }

    onSubmit({
      budget,
      risk_profile: riskProfile,
      investment_horizon: investmentHorizon,
      symbols: requestedSymbols,
      holdings: parsedHoldings,
      max_results: 20,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)]"
    >
      <div className="border-b border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--nv-text)]">
              ساخت پیشنهاد شخصی
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--nv-muted)]">
              اطلاعات را به تومان وارد کنید؛ ارقام فارسی و انگلیسی پذیرفته
              می‌شوند.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <section className="space-y-4">
          <div className="grid gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-[var(--nv-text-soft)]">
                بودجه جدید برای سرمایه‌گذاری
              </span>
              <div className="relative">
                <input
                  dir="ltr"
                  inputMode="decimal"
                  autoComplete="off"
                  value={formatNumericInput(budget)}
                  onChange={(event) =>
                    setBudget(normalizeDecimal(event.target.value, 0))
                  }
                  placeholder="100,000,000"
                  className="h-13 w-full rounded-2xl border border-[var(--nv-border-strong)] bg-[var(--nv-soft)] px-4 pl-16 text-left text-base font-bold text-[var(--nv-text)] outline-none transition placeholder:text-[var(--nv-faint)] focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
                />
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--nv-muted)]">
                  تومان
                </span>
              </div>
              <span className="block text-xs leading-6 text-[var(--nv-muted)]">
                این مبلغ جدا از ارزش دارایی‌های فعلی شماست.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-[var(--nv-text-soft)]">
                میزان ریسک‌پذیری
              </span>
              <select
                value={riskProfile}
                onChange={(event) =>
                  setRiskProfile(event.target.value as RiskProfile)
                }
                className="h-13 w-full rounded-2xl border border-[var(--nv-border-strong)] bg-[var(--nv-soft)] px-4 text-base text-[var(--nv-text)] outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="conservative">
                  کم‌ریسک — حفظ سرمایه مهم‌تر است
                </option>
                <option value="moderate">متعادل — تعادل ریسک و بازده</option>
                <option value="aggressive">پرریسک — پذیرش نوسان بیشتر</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-[var(--nv-text-soft)]">
                دوره سرمایه‌گذاری و سبد
              </span>
              <select
                value={investmentHorizon}
                onChange={(event) =>
                  setInvestmentHorizon(
                    event.target.value as InvestmentHorizon,
                  )
                }
                className="h-13 w-full rounded-2xl border border-[var(--nv-border-strong)] bg-[var(--nv-soft)] px-4 text-base text-[var(--nv-text)] outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="1_month">یک‌ماهه — بازبینی روزانه، تنظیم هفتگی</option>
                <option value="3_months">سه‌ماهه — بازبینی سه‌روزه، تنظیم دوهفته‌ای</option>
                <option value="6_months">شش‌ماهه — بازبینی هفتگی، تنظیم ماهانه</option>
                <option value="1_year">یک‌ساله — بازبینی دوهفته‌ای، تنظیم دوماهه</option>
              </select>
              <span className="block text-xs leading-6 text-[var(--nv-muted)]">
                بازبینی به معنی کنترل ریسک است؛ فقط در موعد تنظیم یا با فعال‌شدن
                حد ضرر، تغییر واقعی در وزن‌ها انجام می‌شود.
              </span>
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--nv-border)] pt-5">
          <div>
            <p className="text-base font-black text-[var(--nv-text)]">
              بازارهای مورد بررسی
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--nv-muted)]">
              روی هر گزینه بزنید تا انتخاب یا حذف شود.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {CORE_ASSETS.map((asset) => {
              const selected = symbols.includes(asset.symbol);
              return (
                <button
                  key={asset.symbol}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSymbol(asset.symbol)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                    selected
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                      : "border-[var(--nv-border)] bg-[var(--nv-soft)] text-[var(--nv-muted)] hover:border-cyan-500/25 hover:text-[var(--nv-text)]"
                  }`}
                >
                  {asset.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-t border-[var(--nv-border)] pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-black text-[var(--nv-text)]">
                دارایی‌های فعلی شما
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--nv-muted)]">
                اختیاری؛ برای پیشنهاد فروش یا نگهداری وارد کنید.
              </p>
            </div>
            <button
              type="button"
              onClick={addHolding}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-2 text-sm font-bold text-cyan-600 transition hover:bg-cyan-500/15 dark:text-cyan-200"
            >
              <Plus className="h-4 w-4" />
              افزودن
            </button>
          </div>

          {!holdings.length ? (
            <button
              type="button"
              onClick={addHolding}
              className="mt-4 min-h-20 w-full rounded-2xl border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-soft)] px-4 py-5 text-center text-sm leading-7 text-[var(--nv-muted)] transition hover:border-cyan-500/30 hover:text-[var(--nv-text-soft)]"
            >
              اگر قبلاً دلار، طلا، سکه یا سهام خریده‌اید، اینجا اضافه کنید.
            </button>
          ) : null}

          <datalist id={symbolListId}>
            {CORE_ASSETS.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.label}
              </option>
            ))}
          </datalist>

          <div className="mt-4 space-y-3">
            {holdings.map((row, index) => (
              <div
                key={row.id}
                className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-[var(--nv-text-soft)]">
                    دارایی {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHolding(row.id)}
                    className="grid h-11 w-11 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/[0.07] text-rose-500 transition hover:bg-rose-500/15"
                    aria-label={`حذف دارایی ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[var(--nv-muted)]">
                      نماد دارایی
                    </span>
                    <input
                      dir="ltr"
                      list={symbolListId}
                      autoComplete="off"
                      value={row.symbol}
                      onChange={(event) =>
                        updateHolding(row.id, {
                          symbol: event.target.value
                            .toUpperCase()
                            .replace(/\s/g, ""),
                        })
                      }
                      placeholder="مثال: IR_GOLD_18K"
                      className="h-12 w-full rounded-xl border border-[var(--nv-border-strong)] bg-[var(--nv-panel)] px-3 text-left text-sm text-[var(--nv-text)] outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    <label className="block min-w-0 space-y-1.5">
                      <span className="text-xs font-bold text-[var(--nv-muted)]">
                        مقدار / تعداد
                      </span>
                      <input
                        dir="ltr"
                        inputMode="decimal"
                        autoComplete="off"
                        value={formatNumericInput(row.quantity)}
                        onChange={(event) =>
                          updateHolding(row.id, {
                            quantity: normalizeDecimal(event.target.value, 8),
                          })
                        }
                        placeholder="مثال: 2.5"
                        className="h-12 w-full min-w-0 rounded-xl border border-[var(--nv-border-strong)] bg-[var(--nv-panel)] px-3 text-left text-sm text-[var(--nv-text)] outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
                      />
                    </label>

                    <label className="block min-w-0 space-y-1.5">
                      <span className="text-xs font-bold text-[var(--nv-muted)]">
                        میانگین خرید (تومان)
                      </span>
                      <input
                        dir="ltr"
                        inputMode="decimal"
                        autoComplete="off"
                        value={formatNumericInput(row.average_buy_price)}
                        onChange={(event) =>
                          updateHolding(row.id, {
                            average_buy_price: normalizeDecimal(
                              event.target.value,
                              4,
                            ),
                          })
                        }
                        placeholder="مثال: 18,500,000"
                        className="h-12 w-full min-w-0 rounded-xl border border-[var(--nv-border-strong)] bg-[var(--nv-panel)] px-3 text-left text-sm text-[var(--nv-text)] outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {formError ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm leading-7 text-rose-700 dark:text-rose-200"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 px-4 text-base font-black text-white shadow-[0_12px_35px_rgba(34,211,238,0.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isPending
            ? "در حال ارزیابی داده‌های واقعی..."
            : "ساخت پیشنهاد مشاور"}
        </button>
      </div>
    </form>
  );
}
