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
    color: 'text-[var(--nv-accent)]',
    panel: 'bg-[var(--nv-accent-soft)] border-[var(--nv-accent-border)]',
  },
  {
    key: 'ready',
    title: 'نمادهای دارای قیمت',
    icon: Activity,
    color: 'text-[var(--nv-positive)]',
    panel: 'bg-[var(--nv-positive-soft)] border-[var(--nv-positive-border)]',
  },
  {
    key: 'quality',
    title: 'دسته‌های بازار',
    icon: Gauge,
    color: 'text-[var(--nv-warning)]',
    panel: 'bg-[var(--nv-warning-soft)] border-[var(--nv-warning-border)]',
  },
  {
    key: 'updated',
    title: 'آخرین ثبت قیمت',
    icon: Database,
    color: 'text-[var(--nv-info)]',
    panel: 'bg-[var(--nv-info-soft)] border-[var(--nv-info-border)]',
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
          className="nv-card min-w-0 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold leading-6 text-[var(--nv-muted)]">{title}</p>
              <p className={`mt-1.5 break-words font-black text-[var(--nv-text)] sm:mt-2 ${key === 'updated' ? 'text-xs leading-6 sm:text-sm' : 'text-lg'}`}>{values[key]}</p>
            </div>
            <div className={`hidden h-11 w-11 shrink-0 place-items-center rounded-xl border min-[390px]:grid ${panel}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
