import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main
      dir="rtl"
      className="nv-page grid min-h-dvh place-items-center px-4 py-10"
    >
      <section className="nv-card w-full max-w-md rounded-2xl p-7 text-center sm:p-10">
        <WifiOff className="mx-auto h-10 w-10 text-[var(--nv-warning)]" />
        <h1 className="mt-5 text-2xl font-black text-[var(--nv-text)]">
          اتصال اینترنت برقرار نیست
        </h1>
        <p className="mt-3 text-sm leading-8 text-[var(--nv-muted)]">
          بازارا تحلیل مالی ذخیره‌شده را به‌جای داده تازه نمایش نمی‌دهد. پس از
          اتصال دوباره، صفحه را باز کنید تا اطلاعات مستقیماً از سرور دریافت شود.
        </p>
        <Link href="/dashboard" className="nv-button-primary mt-6 w-full">
          تلاش دوباره
        </Link>
      </section>
    </main>
  );
}
