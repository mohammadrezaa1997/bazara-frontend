import { Activity, Database, Gauge, Layers3 } from 'lucide-react';

import type { IranMarketOverview } from '../types';
import { formatDate } from '../utils/formatters';

interface OverviewCardsProps {
  overview?: IranMarketOverview;
  displayedAssets: number;
}

const cards = [
  {
    key: 'assets',
    title: 'دارایی‌های فعال',
    icon: Layers3,
    color: 'text-cyan-300',
    panel: 'bg-cyan-400/10 border-cyan-400/15',
  },
  {
    key: 'ready',
    title: 'نمادهای دارای قیمت',
    icon: Activity,
    color: 'text-emerald-300',
    panel: 'bg-emerald-400/10 border-emerald-400/15',
  },
  {
    key: 'quality',
    title: 'دسته‌های بازار',
    icon: Gauge,
    color: 'text-amber-300',
    panel: 'bg-amber-400/10 border-amber-400/15',
  },
  {
    key: 'updated',
    title: 'آخرین ثبت قیمت',
    icon: Database,
    color: 'text-violet-300',
    panel: 'bg-violet-400/10 border-violet-400/15',
  },
] as const;

export function OverviewCards({ overview, displayedAssets }: OverviewCardsProps) {
  const values: Record<(typeof cards)[number]['key'], string> = {
    assets: String(overview?.assets_count ?? displayedAssets),
    ready: String(
      overview?.priced_assets_count ?? overview?.assets_with_price_count ?? 0,
    ),
    quality: String(Object.keys(overview?.categories ?? {}).length),
    updated: formatDate(
      overview?.latest_recorded_at ?? overview?.last_price_update,
    ),
  };

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
      {cards.map(({ key, title, icon: Icon, color, panel }) => (
        <article
          key={key}
          className="min-w-0 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] sm:rounded-3xl sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs leading-5 text-[var(--nv-muted)]">{title}</p>
              <p className={`mt-1.5 break-words font-black text-[var(--nv-text)] sm:mt-2 ${key === 'updated' ? 'text-xs leading-6 sm:text-sm' : 'text-lg'}`}>{values[key]}</p>
            </div>
            <div className={`hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border min-[390px]:grid ${panel}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
