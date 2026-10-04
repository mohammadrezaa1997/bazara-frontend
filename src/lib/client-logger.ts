'use client';

import { useAuthStore } from './store';

interface ClientLogEvent {
  event: 'api_failure' | 'ui_failure';
  message: string;
  component?: string;
  requestId?: string;
  statusCode?: number;
}

const recentEvents = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 30_000;

function cleanText(value: string, maximumLength: number) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&](?:api[_-]?key|token|secret)=)[^&\s]+/gi, '$1[REDACTED]')
    .slice(0, maximumLength);
}

function shouldSend(fingerprint: string) {
  const now = Date.now();
  const previous = recentEvents.get(fingerprint) ?? 0;
  if (now - previous < DUPLICATE_WINDOW_MS) return false;
  recentEvents.set(fingerprint, now);

  if (recentEvents.size > 40) {
    for (const [key, timestamp] of recentEvents) {
      if (now - timestamp > DUPLICATE_WINDOW_MS) recentEvents.delete(key);
    }
  }
  return true;
}

export function reportClientEvent(event: ClientLogEvent) {
  if (typeof window === 'undefined') return;

  const fingerprint = `${event.event}:${event.component ?? ''}:${event.statusCode ?? ''}:${event.message}`;
  if (!shouldSend(fingerprint)) return;

  const token = useAuthStore.getState().accessToken;
  if (!token) return;

  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ).replace(/\/$/, '');

  const body = JSON.stringify({
    event: event.event,
    message: cleanText(event.message, 600),
    component: cleanText(event.component ?? 'unknown', 80),
    path: window.location.pathname.slice(0, 240),
    request_id: cleanText(event.requestId ?? '', 80),
    status_code: event.statusCode ?? null,
  });

  void fetch(`${baseUrl}/api/telemetry/client-events/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
