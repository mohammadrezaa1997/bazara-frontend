import type { DecimalValue } from '../types';

export function toNumber(value: DecimalValue | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatToman(value: DecimalValue | null | undefined) {
  return `${Math.round(toNumber(value)).toLocaleString('fa-IR')} تومان`;
}

export function formatPercent(value: DecimalValue | null | undefined) {
  return `${toNumber(value).toLocaleString('fa-IR', { maximumFractionDigits: 2 })}٪`;
}

export function formatNative(
  value: DecimalValue | null | undefined,
  currency?: string,
) {
  if (value === null || value === undefined || value === '') return '—';
  const number = toNumber(value);
  const digits = number >= 100 ? 2 : number >= 1 ? 4 : 8;
  const formatted = number.toLocaleString('en-US', { maximumFractionDigits: digits });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatNumericInput(value: string | number) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('en-US') : '';
}
