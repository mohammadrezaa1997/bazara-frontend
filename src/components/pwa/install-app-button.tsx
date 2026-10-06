'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const initialStateTimer = window.setTimeout(() => {
      setInstalled(isStandalone());
    }, 0);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setInstalled(false);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) {
      setShowGuide(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="nv-icon-button h-10 w-10"
        aria-label="نصب اپ بازارا"
        title="نصب اپ بازارا"
      >
        <Download className="h-4 w-4" />
      </button>

      {showGuide ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-3 sm:place-items-center">
          <section className="nv-card w-full max-w-md rounded-2xl p-5 text-right shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="nv-kicker">نصب نسخه وب‌اپ</p>
                <h2 className="mt-2 text-lg font-black text-[var(--nv-text)]">
                  بازارا را به صفحه اصلی اضافه کنید
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="nv-icon-button h-9 w-9"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-8 text-[var(--nv-text-soft)]">
              در مرورگر موبایل منوی مرورگر را باز کنید و گزینه
              «افزودن به صفحه اصلی» یا «Install app» را بزنید. در Safari ابتدا
              دکمه اشتراک‌گذاری را بزنید و سپس Add to Home Screen را انتخاب کنید.
            </p>
            <div className="nv-status-info mt-4 flex items-center gap-2 rounded-xl p-3 text-sm">
              <Share2 className="h-4 w-4 shrink-0" />
              بعد از نصب، آیکن بازارا مستقیماً داشبورد موبایل را باز می‌کند.
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
