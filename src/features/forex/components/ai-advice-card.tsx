import {
    AlertTriangle,
    BrainCircuit,
    CheckCircle2,
    Clock3,
    Loader2,
    ShieldAlert,
} from 'lucide-react';

import type { ForexAIAdvice } from '../types';

interface AIAdviceCardProps {
    advice?: ForexAIAdvice | null;
    pairName?: string;
    isLoading?: boolean;
}

const stanceMeta = {
    confirm: {
        label: 'هم‌نظر با تحلیل رسمی',
        Icon: CheckCircle2,
        style:
            'nv-status-success',
    },
    cautious: {
        label: 'نیازمند احتیاط',
        Icon: AlertTriangle,
        style:
            'nv-status-warning',
    },
    avoid: {
        label: 'پیشنهاد عدم ورود',
        Icon: ShieldAlert,
        style:
            'nv-status-danger',
    },
};

function formatGeneratedAt(value?: string | null) {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(parsed);
}

function PairName({ value }: { value?: string }) {
    if (!value) {
        return null;
    }

    return (
        <span
            dir="ltr"
            className="mr-2 inline-block text-[var(--nv-accent)]"
        >
            {value}
        </span>
    );
}

export function AIAdviceCard({
    advice,
    pairName,
    isLoading = false,
}: AIAdviceCardProps) {
    if (isLoading) {
        return (
            <section className="nv-card flex min-h-36 items-center justify-center gap-3 rounded-2xl p-6 text-sm font-bold text-[var(--nv-accent)] sm:text-base">
                <Loader2 className="h-5 w-5 animate-spin" />

                <span>
                    در حال دریافت تفسیر هوش مصنوعی
                    <PairName value={pairName} />
                    ...
                </span>
            </section>
        );
    }

    if (!advice) {
        return null;
    }

    if (advice.status === 'unavailable') {
        return (
            <section className="nv-status-warning rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--nv-warning-border)] bg-[var(--nv-panel)] text-[var(--nv-warning)]">
                        <AlertTriangle className="h-6 w-6" />
                    </div>

                    <div>
                        <h2 className="text-lg font-black sm:text-xl">
                            تفسیر هوش مصنوعی موقتاً در دسترس نیست
                        </h2>

                        <p className="mt-3 text-sm leading-8 text-[var(--nv-text-soft)] sm:text-base">
                            تحلیل رسمی تکنیکال همچنان معتبر است. اختلال
                            سرویس هوش مصنوعی، تصمیم و سطوح محاسبه‌شده
                            موتور تحلیل را تغییر نمی‌دهد.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const meta =
        stanceMeta[advice.stance ?? 'cautious'];

    const StanceIcon = meta.Icon;
    const risks = advice.key_risks ?? [];
    const confirmations =
        advice.confirmation_conditions ?? [];

    return (
        <section className="nv-card rounded-2xl p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]">
                        <BrainCircuit className="h-6 w-6" />
                    </div>

                    <div>
                        <p className="nv-kicker">
                            مشاور تحلیلی BAZARA
                        </p>

                        <h2 className="mt-1 text-lg font-black text-[var(--nv-text)] sm:text-xl">
                            تفسیر هوش مصنوعی
                            <PairName value={pairName} />
                        </h2>
                    </div>
                </div>

                <span
                    className={`flex w-fit items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black sm:text-sm ${meta.style}`}
                >
                    <StanceIcon className="h-4 w-4" />
                    {meta.label}
                </span>
            </div>

            <div className="nv-surface mt-6 rounded-xl p-4 sm:p-5">
                <p className="nv-kicker">
                    جمع‌بندی ساده
                </p>

                <p className="mt-3 text-sm font-medium leading-8 text-[var(--nv-text-soft)] sm:text-base sm:leading-9">
                    {advice.summary}
                </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="nv-status-danger rounded-xl p-4 sm:p-5">
                    <h3 className="flex items-center gap-2 text-sm font-black sm:text-base">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        ریسک‌های مهم
                    </h3>

                    {risks.length > 0 ? (
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--nv-text-soft)] sm:text-base sm:leading-8">
                            {risks.map((risk) => (
                                <li
                                    key={risk}
                                    className="flex items-start gap-3"
                                >
                                    <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--nv-danger)]" />
                                    <span>{risk}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-sm leading-7 text-[var(--nv-muted)]">
                            ریسک ویژه‌ای ثبت نشده است.
                        </p>
                    )}
                </div>

                <div className="nv-status-info rounded-xl p-4 sm:p-5">
                    <h3 className="flex items-center gap-2 text-sm font-black sm:text-base">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        چه چیزی تحلیل را تأیید می‌کند؟
                    </h3>

                    {confirmations.length > 0 ? (
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--nv-text-soft)] sm:text-base sm:leading-8">
                            {confirmations.map((condition) => (
                                <li
                                    key={condition}
                                    className="flex items-start gap-3"
                                >
                                    <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--nv-accent)]" />
                                    <span>{condition}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-sm leading-7 text-[var(--nv-muted)]">
                            شرط تأیید جداگانه‌ای ثبت نشده است.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {advice.invalidation_note ? (
                    <div className="nv-status-warning rounded-xl p-4 text-sm leading-8 sm:p-5 sm:text-base">
                        <strong className="block text-sm font-black sm:text-base">
                            چه زمانی این سناریو باطل می‌شود؟
                        </strong>

                        <p className="mt-2">
                            {advice.invalidation_note}
                        </p>
                    </div>
                ) : null}

                {advice.confidence_comment ? (
                    <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 text-sm leading-8 text-[var(--nv-text-soft)] sm:p-5 sm:text-base">
                        <strong className="block text-sm font-black text-[var(--nv-text)] sm:text-base">
                            ارزیابی میزان اطمینان
                        </strong>

                        <p className="mt-2">
                            {advice.confidence_comment}
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--nv-border)] pt-4 text-xs text-[var(--nv-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:text-sm">
                <span className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    زمان تحلیل:
                    {' '}
                    {formatGeneratedAt(
                        advice.generated_at,
                    )}
                </span>

                <span>
                 تهیه‌شده توسط موتور تحلیل هوشمند بازارا
               </span>

                {advice.reused ? (
                    <span>
                        استفاده از تحلیل معتبر ذخیره‌شده
                    </span>
                ) : null}
            </div>

            <p className="mt-4 text-xs leading-6 text-[var(--nv-muted)] sm:text-sm">
                این متن، توضیح همان خروجی رسمی موتور تحلیل است؛
                سطوح ورود، حد ضرر و اهداف را تغییر نمی‌دهد و
                تضمین سود نیست.
            </p>
        </section>
    );
}
