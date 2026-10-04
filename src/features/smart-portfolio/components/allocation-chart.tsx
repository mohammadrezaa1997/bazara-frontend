'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import type { MarketAllocation } from '../types';
import { formatPercent, formatToman, toNumber } from '../utils/formatters';

interface AllocationChartProps {
  allocations: MarketAllocation[];
}

const meta = {
  iran: { label: 'بازار ایران', color: '#06b6d4' },
  crypto: { label: 'رمزارز', color: '#8b5cf6' },
  cash: { label: 'وجه نقد', color: '#64748b' },
} as const;

export function AllocationChart({ allocations }: AllocationChartProps) {
  const data = allocations
    .filter(
      (item): item is MarketAllocation & { market: keyof typeof meta } =>
        item.type === 'capital' && item.market in meta,
    )
    .map((item) => ({
      name: meta[item.market].label,
      key: item.market,
      value: toNumber(item.allocation_percent),
      amount: toNumber(item.amount_toman),
      color: meta[item.market].color,
    }));

  const investedPercent = data
    .filter((item) => item.key !== 'cash')
    .reduce((total, item) => total + item.value, 0);
  const iranPercent = data.find((item) => item.key === 'iran')?.value ?? 0;
  const cryptoPercent = data.find((item) => item.key === 'crypto')?.value ?? 0;
  const cashPercent = data.find((item) => item.key === 'cash')?.value ?? 0;

  return (
    <section className="nv-card rounded-2xl p-4 sm:p-6">
      <div>
        <p className="nv-kicker">ترکیب سرمایه</p>
        <h2 className="mt-1 text-lg font-black text-[var(--nv-text)]">
          بودجه شما دقیقاً کجا قرار می‌گیرد؟
        </h2>
        <p className="mt-2 text-xs leading-6 text-[var(--nv-muted)] sm:text-sm">
          حلقه، سهم هر بازار و مقدار وجه نقد باقی‌مانده را از کل بودجه نشان می‌دهد.
        </p>
      </div>

      <div className="mt-4 grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative h-64 min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={94}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatPercent(Number(value))} · ${formatToman(item.payload.amount)}`,
                  item.payload.name,
                ]}
                contentStyle={{
                  background: 'var(--nv-panel-raised)',
                  border: '1px solid var(--nv-border)',
                  borderRadius: 14,
                  color: 'var(--nv-text)',
                  direction: 'rtl',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1 text-center" dir="rtl">
            <span className="text-xs font-bold text-[var(--nv-muted)]">سرمایه‌گذاری‌شده</span>
            <strong className="mt-1 text-2xl font-black text-[var(--nv-text)]">
              {formatPercent(investedPercent)}
            </strong>
            <span className="mt-1 text-xs font-bold text-[var(--nv-muted)]">از کل بودجه</span>
          </div>
        </div>

        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-bold text-[var(--nv-text-soft)]">
                  {item.name}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-[var(--nv-text)]">
                  {formatPercent(item.value)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[var(--nv-muted)]">
                  {formatToman(item.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nv-status-info mt-4 rounded-xl p-4 text-sm leading-7">
        <strong className="text-[var(--nv-text)]">به زبان ساده: </strong>
        {investedPercent > 0 ? (
          <>
            {formatPercent(iranPercent)} برای بازار ایران،{' '}
            {formatPercent(cryptoPercent)} برای رمزارز و{' '}
            {formatPercent(cashPercent)} به‌صورت وجه نقد نگهداری می‌شود.
          </>
        ) : (
          <>
            فعلاً فرصت سازگار با محدودیت ریسک پیدا نشده و{' '}
            {formatPercent(cashPercent || 100)} بودجه نقد می‌ماند.
          </>
        )}
      </div>
    </section>
  );
}
