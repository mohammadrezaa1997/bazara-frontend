import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

import type { FreshnessResult } from '@/lib/freshness';
import { formatFreshnessTime } from '@/lib/freshness';

interface FreshnessNoticeProps {
  freshness: FreshnessResult;
  analyzedAt?: string | null;
  compact?: boolean;
}

export function FreshnessNotice({
  freshness,
  analyzedAt,
  compact = false,
}: FreshnessNoticeProps) {
  const Icon = freshness.isFresh ? CheckCircle2 : AlertTriangle;
  const tone = freshness.isFresh ? 'nv-status-success' : 'nv-status-warning';

  return (
    <div
      className={`${tone} flex items-start gap-2 rounded-xl ${
        compact ? 'px-3 py-2 text-xs' : 'p-3 text-sm'
      } leading-6`}
      role={freshness.isFresh ? undefined : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <strong>{freshness.label}</strong>
        {analyzedAt ? (
          <span className="mr-1 inline-flex items-center gap-1 text-[var(--nv-text-soft)]">
            <Clock3 className="h-3.5 w-3.5" />
            {formatFreshnessTime(analyzedAt)}
          </span>
        ) : null}
        {!freshness.isFresh ? (
          <span className="mt-1 block text-[var(--nv-text-soft)]">
            این نتیجه فقط سابقهٔ تحلیلی است و سیگنال، سطح ورود یا مبنای تخصیص سرمایه نیست.
          </span>
        ) : null}
      </span>
    </div>
  );
}
