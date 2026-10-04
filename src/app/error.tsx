'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

import { reportClientEvent } from '@/lib/client-logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientEvent({
      event: 'ui_failure',
      message: error.message || 'Unhandled interface error',
      component: 'app-error-boundary',
      requestId: error.digest,
    });
  }, [error]);

  return (
    <main
      dir="rtl"
      className="nv-page grid min-h-dvh place-items-center px-4 py-10"
    >
      <section className="nv-card w-full max-w-lg rounded-2xl p-6 text-center sm:p-8">
        <span className="nv-status-danger mx-auto grid h-12 w-12 place-items-center rounded-xl">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-black text-[var(--nv-text)]">
          نمایش این بخش با خطا روبه‌رو شد
        </h1>
        <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
          خطا برای بررسی فنی ثبت شد. یک‌بار دیگر تلاش کنید؛ اطلاعات حساب یا
          سفارش شما تغییر نکرده است.
        </p>
        <button
          type="button"
          onClick={reset}
          className="nv-button-primary mt-6 w-full"
        >
          <RefreshCw className="h-4 w-4" />
          تلاش دوباره
        </button>
      </section>
    </main>
  );
}
