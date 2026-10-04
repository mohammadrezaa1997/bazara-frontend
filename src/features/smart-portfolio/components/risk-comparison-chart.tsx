'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { SmartPortfolioItem } from '../types';
import { toNumber } from '../utils/formatters';

function riskColor(value: number) {
  if (value < 40) return '#10b981';
  if (value < 70) return '#f59e0b';
  return '#f43f5e';
}

function riskLabel(value: number) {
  if (value < 40) return 'کم';
  if (value < 70) return 'متوسط';
  return 'زیاد';
}

export function RiskComparisonChart({ items }: { items: SmartPortfolioItem[] }) {
  const capitalItems = items.filter((item) => item.allocation_type === 'capital');
  const sourceItems = capitalItems.length ? capitalItems : items;
  const data = sourceItems.slice(0, 10).map((item) => {
    const risk = Math.round(toNumber(item.risk_score));
    return {
      symbol: item.display_symbol || item.symbol,
      risk,
      level: riskLabel(risk),
      color: riskColor(risk),
    };
  });

  if (!data.length) return null;

  const averageRisk = Math.round(
    data.reduce((total, item) => total + item.risk, 0) / data.length,
  );
  const chartHeight = Math.max(250, data.length * 54);

  return (
    <section className="nv-card rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="nv-kicker">ریسک انتخاب‌ها</p>
          <h2 className="mt-1 text-lg font-black text-[var(--nv-text)]">
            ریسک هر دارایی در سبد
          </h2>
          <p className="mt-2 text-xs leading-6 text-[var(--nv-muted)] sm:text-sm">
            هرچه میله کوتاه‌تر باشد، ریسک آن انتخاب کمتر است. دارایی با امتیاز
            ۷۰ یا بیشتر وارد تخصیص سرمایه نمی‌شود.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-4 py-3 text-center">
          <p className="text-xs font-bold text-[var(--nv-muted)] sm:text-sm">میانگین ریسک انتخاب‌ها</p>
          <p className="mt-1 text-lg font-black text-[var(--nv-text)]">
            {averageRisk.toLocaleString('fa-IR')} / ۱۰۰
          </p>
          <p className="mt-1 text-xs font-black sm:text-sm" style={{ color: riskColor(averageRisk) }}>
            {riskLabel(averageRisk)}
          </p>
        </div>
      </div>

      <div className="mt-5 min-w-0" dir="ltr" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 42, left: 8, bottom: 4 }}
          >
            <CartesianGrid stroke="var(--nv-chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 70, 80, 100]}
              tick={{ fill: 'var(--nv-muted)', fontSize: 12, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              width={82}
              tick={{ fill: 'var(--nv-text-soft)', fontSize: 13, fontWeight: 800 }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={40} stroke="#f59e0b" strokeDasharray="4 4" />
            <ReferenceLine x={70} stroke="#f43f5e" strokeDasharray="5 4" />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString('fa-IR')} از ۱۰۰`, 'ریسک']}
              labelFormatter={(label) => `نماد: ${label}`}
              contentStyle={{
                background: 'var(--nv-panel-raised)',
                border: '1px solid var(--nv-border)',
                borderRadius: 14,
                color: 'var(--nv-text)',
                direction: 'rtl',
              }}
            />
            <Bar dataKey="risk" name="ریسک" radius={[0, 8, 8, 0]} barSize={22}>
              {data.map((item) => (
                <Cell key={item.symbol} fill={item.color} />
              ))}
              <LabelList
                dataKey="risk"
                position="right"
                fill="var(--nv-text-soft)"
                fontSize={13}
                formatter={(value: unknown) => Number(value).toLocaleString('fa-IR')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
        <RiskLegend color="#10b981" label="ریسک کم" range="۰ تا ۳۹" />
        <RiskLegend color="#f59e0b" label="ریسک متوسط" range="۴۰ تا ۶۹" />
        <RiskLegend color="#f43f5e" label="غیرقابل تخصیص" range="۷۰ تا ۱۰۰" />
      </div>
    </section>
  );
}

function RiskLegend({ color, label, range }: { color: string; label: string; range: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-2.5">
      <span className="flex items-center gap-2 font-bold text-[var(--nv-text-soft)]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-black text-[var(--nv-muted)]">{range}</span>
    </div>
  );
}
