export type FreshnessState =
  | 'fresh'
  | 'expired'
  | 'missing_expiry'
  | 'invalid';

export interface FreshnessPayload {
  state?: FreshnessState | string;
  is_fresh?: boolean;
  requires_refresh?: boolean;
  age_seconds?: number | null;
  expires_in_seconds?: number | null;
}

interface FreshnessInput {
  isValid?: boolean;
  validUntil?: string | null;
  freshness?: FreshnessPayload | null;
}

export interface FreshnessResult {
  state: FreshnessState;
  isFresh: boolean;
  label: string;
}

export function resolveFreshness({
  isValid,
  validUntil,
  freshness,
}: FreshnessInput): FreshnessResult {
  const expiresAt = validUntil ? new Date(validUntil).getTime() : Number.NaN;
  const hasValidExpiry = Number.isFinite(expiresAt);
  const explicitFresh = freshness?.is_fresh ?? isValid;
  const isFresh = Boolean(
    explicitFresh === true && hasValidExpiry && expiresAt > Date.now(),
  );

  if (isFresh) {
    return { state: 'fresh', isFresh: true, label: 'تحلیل تازه' };
  }
  if (!validUntil || !hasValidExpiry) {
    return {
      state: 'missing_expiry',
      isFresh: false,
      label: 'اعتبار نامشخص',
    };
  }
  if (expiresAt <= Date.now()) {
    return { state: 'expired', isFresh: false, label: 'تحلیل منقضی' };
  }
  return { state: 'invalid', isFresh: false, label: 'نیازمند بازتحلیل' };
}

export function formatFreshnessTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}
