import type { DecimalValue, IranMarketPriceUnit } from '../types';

const PRICE_FORMATTER = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 2,
});

const COMPACT_FORMATTER = new Intl.NumberFormat('fa-IR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function toFiniteNumber(value: DecimalValue | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatPrice(value: DecimalValue | null | undefined) {
  const number = toFiniteNumber(value);
  return number === null ? '—' : PRICE_FORMATTER.format(number);
}

export function formatCompactPrice(value: DecimalValue | null | undefined) {
  const number = toFiniteNumber(value);
  return number === null ? '—' : COMPACT_FORMATTER.format(number);
}

export function formatPercent(value: DecimalValue | null | undefined) {
  const number = toFiniteNumber(value);
  if (number === null) return '—';
  const sign = number > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
  }).format(number)}٪`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'نامشخص';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'نامشخص' : DATE_FORMATTER.format(date);
}

export function unitLabel(unit: IranMarketPriceUnit | undefined) {
  switch (unit) {
    case 'IRR':
      return 'ریال';
    case 'POINT':
      return 'واحد';
    case 'PERCENT':
      return 'درصد';
    default:
      return 'تومان';
  }
}

export function changeTone(value: DecimalValue | null | undefined) {
  const number = toFiniteNumber(value);
  if (number === null || number === 0) return 'neutral' as const;
  return number > 0 ? ('positive' as const) : ('negative' as const);
}

