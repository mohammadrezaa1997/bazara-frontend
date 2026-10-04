'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Choice {
  id: number;
  text: string;
  risk_score: number;
  coach_note?: string;
}

interface Question {
  id: number;
  key: string;
  title: string;
  description: string;
  dimension: string;
  dimension_label: string;
  order: number;
  choices: Choice[];
}

interface SelectedAnswer {
  question_id: number;
  choice_id: number;
}

interface SubmittedProfile {
  investment_horizon: string;
  budget_amount: string | number;
  overall_risk_score: number;
  effective_risk_score: number;
  behavioral_score: number;
  consistency_score: number;
  max_drawdown_percent: string | number;
  risk_profile: string;
  risk_profile_code: string;
  profile_version: string;
  dimension_scores: Record<
    string,
    { key: string; label: string; score: number }
  >;
  behavioral_profile: {
    archetype?: { code: string; title: string; summary: string };
    strengths?: string[];
    cautions?: string[];
    decision_rules?: string[];
    safety_caps?: string[];
  };
  answers_json: Record<string, unknown>;
}

interface SubmitProfileResponse {
  message: string;
  created: boolean;
  profile: SubmittedProfile;
}

interface ApiErrorResponse {
  detail?: string;
  answers?: string | string[] | Record<string, unknown>;
  budget_amount?: string | string[];
  investment_horizon?: string | string[];
}

function clampScore(value: number | string) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function formatToman(value: number | string) {
  return `${Math.round(Number(value) || 0).toLocaleString('fa-IR')} تومان`;
}

function ProfileMetric({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: typeof CircleGauge;
}) {
  return (
    <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[var(--nv-muted)] sm:text-sm">
          {label}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-[var(--nv-text)]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-6 text-[var(--nv-muted)]">{hint}</p>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  const updateUserStats = useAuthStore(
    (state) => state.updateUserStats
  );

  const [horizon, setHorizon] = useState('۳ ماهه');
  const [budget, setBudget] = useState<number>(100000000);
  const [profileResult, setProfileResult] =
    useState<SubmittedProfile | null>(null);

  const [answers, setAnswers] = useState<
    Record<number, SelectedAnswer>
  >({});

  const {
    data: questions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Question[]>({
    queryKey: ['questions'],

    queryFn: async () => {
      const { data } = await api.get<Question[]>(
        '/api/questionnaire/questions/'
      );

      return data;
    },

    retry: 1,
  });

  const submitMutation = useMutation<
    SubmitProfileResponse,
    unknown
  >({
    mutationFn: async () => {
      const formattedAnswers = Object.values(answers);

      const { data } = await api.post<SubmitProfileResponse>(
        '/api/questionnaire/submit/',
        {
          investment_horizon: horizon.trim(),
          budget_amount: Number(budget),
          answers: formattedAnswers,
        }
      );

      return data;
    },

    onSuccess: (data) => {
      const savedBudget = Number(data.profile.budget_amount);

      updateUserStats(
        savedBudget,
        data.profile.risk_profile,
        Number(data.profile.effective_risk_score),
        data.profile.investment_horizon,
      );

      toast.success(
        `پروفایل شما با سطح ریسک «${data.profile.risk_profile}» ذخیره شد.`
      );
      setProfileResult(data.profile);
    },

    onError: (mutationError: unknown) => {
      const responseData: ApiErrorResponse | undefined =
        mutationError instanceof AxiosError
          ? (mutationError.response?.data as ApiErrorResponse | undefined)
          : undefined;

      console.error(
        'Questionnaire submission error:',
        responseData || mutationError
      );

      let errorMessage =
        'خطا در ثبت اطلاعات. لطفاً مجدداً تلاش کنید.';

      if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.answers) {
        if (typeof responseData.answers === 'string') {
          errorMessage = responseData.answers;
        } else if (Array.isArray(responseData.answers)) {
          errorMessage = responseData.answers.join(' ');
        } else {
          errorMessage = JSON.stringify(
            responseData.answers
          );
        }
      } else if (responseData?.budget_amount) {
        errorMessage = Array.isArray(
          responseData.budget_amount
        )
          ? responseData.budget_amount.join(' ')
          : responseData.budget_amount;
      } else if (responseData?.investment_horizon) {
        errorMessage = Array.isArray(
          responseData.investment_horizon
        )
          ? responseData.investment_horizon.join(' ')
          : responseData.investment_horizon;
      }

      toast.error(errorMessage);
    },
  });

  const handleSelectChoice = (
    questionId: number,
    choiceId: number
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,

      [questionId]: {
        question_id: questionId,
        choice_id: choiceId,
      },
    }));
  };

  const totalQuestions = questions?.length ?? 0;
  const answeredQuestions = Object.keys(answers).length;

  const allQuestionsAnswered =
    totalQuestions > 0 &&
    answeredQuestions === totalQuestions;

  const isBudgetValid =
    Number.isFinite(budget) &&
    budget > 0;

  const isHorizonValid =
    horizon.trim().length > 0;

  const canSubmit =
    allQuestionsAnswered &&
    isBudgetValid &&
    isHorizonValid &&
    !submitMutation.isPending;

  const handleSubmit = () => {
    if (!questions || questions.length === 0) {
      toast.error(
        'هیچ سؤال روان‌شناختی برای ثبت وجود ندارد.'
      );

      return;
    }

    if (!allQuestionsAnswered) {
      toast.error(
        'لطفاً به تمام سؤال‌های روان‌شناختی پاسخ دهید.'
      );

      return;
    }

    if (!isBudgetValid) {
      toast.error(
        'بودجه سرمایه‌گذاری باید بیشتر از صفر باشد.'
      );

      return;
    }

    if (!isHorizonValid) {
      toast.error(
        'افق زمانی سرمایه‌گذاری را وارد کنید.'
      );

      return;
    }

    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="nv-page flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--nv-accent)]" />

          <p className="animate-pulse font-bold tracking-wide text-[var(--nv-accent)]">
            در حال بارگذاری موتور روان‌شناسی...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    console.error(
      'Questionnaire loading error:',
      error
    );

    return (
      <div className="nv-page flex min-h-screen items-center justify-center px-4">
        <div className="nv-status-danger w-full max-w-md rounded-2xl p-8 text-center">
          <h2 className="mb-3 text-xl font-black">
            خطا در دریافت پرسش‌نامه
          </h2>

          <p className="mb-6 text-sm leading-7 text-[var(--nv-muted)]">
            ارتباط با بک‌اند برقرار نشد یا دریافت سؤال‌ها
            با خطا مواجه شد.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="nv-button-primary w-full"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (profileResult) {
    const dimensions = Object.values(profileResult.dimension_scores || {});
    const behavioral = profileResult.behavioral_profile || {};
    const archetype = behavioral.archetype;

    return (
      <main dir="rtl" className="nv-page px-3 py-5 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-5 sm:space-y-7">
          <header className="overflow-hidden rounded-3xl border border-[var(--nv-accent-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow-raised)]">
            <div className="grid gap-6 bg-[linear-gradient(135deg,var(--nv-accent-soft),var(--nv-panel)_58%)] p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-[var(--nv-accent)]">
                  <Fingerprint className="h-4 w-4" />
                  پروفایل رفتاری اختصاصی شما
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--nv-text)] sm:text-4xl">
                  {archetype?.title || profileResult.risk_profile}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-8 text-[var(--nv-text-soft)] sm:text-base">
                  {archetype?.summary ||
                    'این نتیجه از ترکیب توان مالی، تحمل نوسان و کیفیت تصمیم‌گیری شما ساخته شده است.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="nv-chip-active rounded-full px-3 py-2 text-xs font-black">
                    سطح ریسک: {profileResult.risk_profile}
                  </span>
                  <span className="nv-chip rounded-full px-3 py-2 text-xs font-black">
                    بودجه: {formatToman(profileResult.budget_amount)}
                  </span>
                  <span className="nv-chip rounded-full px-3 py-2 text-xs font-black">
                    افق: {profileResult.investment_horizon}
                  </span>
                </div>
              </div>
              <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border-[10px] border-[var(--nv-accent-soft)] bg-[var(--nv-panel)] text-center shadow-[var(--nv-shadow)] lg:mx-0">
                <div>
                  <strong className="block text-3xl font-black text-[var(--nv-accent)]">
                    {Math.round(profileResult.effective_risk_score).toLocaleString('fa-IR')}
                  </strong>
                  <span className="text-[11px] font-bold text-[var(--nv-muted)]">
                    ریسک مؤثر از ۱۰۰
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ProfileMetric
              Icon={CircleGauge}
              label="ریسک مؤثر"
              value={`${Math.round(profileResult.effective_risk_score).toLocaleString('fa-IR')} / ۱۰۰`}
              hint="امتیازی که واقعاً در سبد استفاده می‌شود"
            />
            <ProfileMetric
              Icon={BrainCircuit}
              label="کنترل رفتاری"
              value={`${Math.round(profileResult.behavioral_score).toLocaleString('fa-IR')} / ۱۰۰`}
              hint="انضباط، کنترل هیجان و تنوع‌بخشی"
            />
            <ProfileMetric
              Icon={ShieldCheck}
              label="سازگاری پاسخ‌ها"
              value={`${Math.round(profileResult.consistency_score).toLocaleString('fa-IR')}٪`}
              hint="هماهنگی میل به ریسک با توان مالی"
            />
            <ProfileMetric
              Icon={TrendingUp}
              label="سقف افت پیشنهادی"
              value={`${Number(profileResult.max_drawdown_percent).toLocaleString('fa-IR')}٪`}
              hint="حد کنترلی کل سبد، نه پیش‌بینی زیان"
            />
          </section>

          <section className="nv-card rounded-3xl p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="nv-kicker">نقشه رفتاری</p>
                <h2 className="mt-1 text-xl font-black text-[var(--nv-text)]">
                  ده بُعد تصمیم‌گیری شما
                </h2>
              </div>
              <WalletCards className="h-6 w-6 text-[var(--nv-accent)]" />
            </div>
            <div className="mt-6 grid gap-x-7 gap-y-5 md:grid-cols-2">
              {dimensions.map((dimension) => {
                const score = clampScore(dimension.score);
                return (
                  <div key={dimension.key}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[var(--nv-text-soft)]">
                        {dimension.label}
                      </span>
                      <span className="font-black text-[var(--nv-text)]">
                        {Math.round(score).toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
                      <div
                        className="h-full rounded-full bg-[var(--nv-accent)] transition-[width] duration-700"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-[var(--nv-positive-border)] bg-[var(--nv-positive-soft)] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-[var(--nv-text)]">
                <CheckCircle2 className="h-5 w-5 text-[var(--nv-positive)]" />
                نقاط قوت تصمیم‌گیری
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--nv-text-soft)]">
                {(behavioral.strengths?.length
                  ? behavioral.strengths
                  : ['پروفایل شما برای تصمیم‌گیری محتاطانه کالیبره شد.']
                ).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--nv-positive)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-[var(--nv-warning-border)] bg-[var(--nv-warning-soft)] p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-black text-[var(--nv-text)]">
                <ShieldCheck className="h-5 w-5 text-[var(--nv-warning)]" />
                قواعد شخصی محافظت از سرمایه
              </h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--nv-text-soft)]">
                {(behavioral.decision_rules || []).map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--nv-panel)] text-xs font-black text-[var(--nv-warning)]">
                      {(index + 1).toLocaleString('fa-IR')}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <button
              type="button"
              onClick={() => setProfileResult(null)}
              className="nv-button-secondary min-h-12 px-5"
            >
              ویرایش پاسخ‌ها
            </button>
            <button
              type="button"
              onClick={() => router.push('/smart-portfolio')}
              className="nv-button-primary min-h-12 px-6"
            >
              ساخت سبد ترکیبی من
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="nv-page px-3 py-5 sm:px-6 sm:py-10"
    >
      <div className="relative mx-auto max-w-3xl space-y-5 sm:space-y-8">
        <div className="relative z-10 mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-3 text-2xl font-black text-[var(--nv-text)] sm:text-3xl">
              <BrainCircuit className="h-8 w-8 text-[var(--nv-accent)]" />
              نقشه رفتاری سرمایه‌گذاری
            </h1>

            <p className="mt-2 text-[15px] leading-8 text-[var(--nv-muted)]">
              پاسخ درست یا غلطی وجود ندارد. نتیجه، توان مالی، واکنش زیر فشار
              و عادت‌های تصمیم‌گیری شما را از هم جدا می‌کند.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => router.back()}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-panel)] px-4 py-2 text-sm font-bold text-[var(--nv-muted)] transition-colors hover:text-[var(--nv-text)]"
            >
              بازگشت
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="nv-card sticky top-3 z-30 rounded-2xl p-4 backdrop-blur-xl sm:top-5">
          <div className="flex items-center justify-between gap-3 text-xs font-black">
            <span className="text-[var(--nv-text-soft)]">پیشرفت ارزیابی</span>
            <span className="text-[var(--nv-accent)]">
              {answeredQuestions.toLocaleString('fa-IR')} از{' '}
              {totalQuestions.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
            <div
              className="h-full rounded-full bg-[var(--nv-accent)] transition-[width] duration-300"
              style={{
                width: `${totalQuestions ? (answeredQuestions / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
        </section>

        <div className="relative z-10 space-y-6">
          <section className="nv-card rounded-2xl p-5 sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-[var(--nv-border)] pb-4 text-xl font-bold text-[var(--nv-text)]">
              <Target className="h-5 w-5 text-[var(--nv-accent)]" />
              اهداف مالی و زمانی
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="investment-horizon"
                  className="mr-1 text-sm font-bold text-[var(--nv-text-soft)]"
                >
                  افق زمانی سرمایه‌گذاری
                </label>

                <input
                  id="investment-horizon"
                  type="text"
                  value={horizon}
                  onChange={(event) =>
                    setHorizon(event.target.value)
                  }
                  placeholder="مثال: ۶ ماهه"
                  className="nv-field w-full rounded-2xl px-4 py-3.5 transition-all"
                />

                {!isHorizonValid && (
                  <p className="text-xs font-bold text-[var(--nv-danger)]">
                    افق زمانی سرمایه‌گذاری را وارد کنید.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="investment-budget"
                  className="mr-1 text-sm font-bold text-[var(--nv-text-soft)]"
                >
                  بودجه کل (تومان)
                </label>

                <div className="relative">
                  <Banknote className="absolute left-4 top-3.5 h-5 w-5 text-[var(--nv-accent)]" />

                  <input
                    id="investment-budget"
                    type="number"
                    min="1000000"
                    step="1"
                    value={budget}
                    onChange={(event) =>
                      setBudget(
                        Number(event.target.value)
                      )
                    }
                    className="nv-field w-full rounded-2xl py-3.5 pl-24 pr-4 text-left font-bold transition-all"
                    dir="ltr"
                  />
                  <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--nv-muted)]">
                    تومان
                  </span>
                </div>

                {!isBudgetValid && (
                  <p className="text-xs font-bold text-[var(--nv-danger)]">
                    بودجه را به تومان و بیشتر از صفر وارد کنید.
                  </p>
                )}
              </div>
            </div>
          </section>

          {!questions || questions.length === 0 ? (
            <section className="nv-status-warning rounded-2xl p-8 text-center">
              <p className="font-medium">
                هنوز هیچ سؤال روان‌شناختی در بک‌اند ثبت
                نشده است.
              </p>
            </section>
          ) : (
            questions.map((question, index) => (
              <section
                key={question.id}
                className="nv-card rounded-2xl p-5 sm:p-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] font-black text-[var(--nv-accent)]">
                    {index + 1}
                  </div>

                  <div>
                    <span className="text-xs font-black text-[var(--nv-accent)]">
                      {question.dimension_label}
                    </span>
                    <h3 className="mt-1 text-lg font-bold leading-8 text-[var(--nv-text)]">
                      {question.title}
                    </h3>
                    {question.description ? (
                      <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
                        {question.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {question.choices.map((choice) => {
                    const isSelected =
                      answers[question.id]?.choice_id ===
                      choice.id;

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() =>
                          handleSelectChoice(
                            question.id,
                            choice.id
                          )
                        }
                        className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 text-right transition-all duration-300 ${
                          isSelected
                            ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-text)] shadow-sm'
                            : 'border-[var(--nv-border)] bg-[var(--nv-soft)] text-[var(--nv-text-soft)] hover:border-[var(--nv-border-strong)] hover:bg-[var(--nv-soft-strong)]'
                        }`}
                      >
                        <span className="relative z-10 pl-6">
                          <span className="block font-medium leading-relaxed">
                            {choice.text}
                          </span>
                          {isSelected && choice.coach_note ? (
                            <span className="mt-2 block text-xs font-medium leading-6 text-[var(--nv-muted)]">
                              {choice.coach_note}
                            </span>
                          ) : null}
                        </span>

                        <div
                          className={`relative z-10 shrink-0 transition-transform duration-300 ${
                            isSelected
                              ? 'scale-110'
                              : 'scale-100 group-hover:scale-110'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-6 w-6 text-[var(--nv-accent)]" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-[var(--nv-faint)] transition-colors group-hover:border-[var(--nv-accent)]" />
                          )}
                        </div>

                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="relative z-10 pt-6">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-[var(--nv-muted)]">
              تعداد پاسخ‌ها
            </span>

            <span
              className={
                allQuestionsAnswered
                  ? 'font-bold text-[var(--nv-positive)]'
                  : 'font-bold text-[var(--nv-accent)]'
              }
            >
              {answeredQuestions} از {totalQuestions}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="nv-button-primary w-full py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                در حال محاسبه پروفایل...
              </>
            ) : (
              <>
                تحلیل پروفایل و مشاهده نتیجه
                <ChevronRight className="h-5 w-5 rotate-180" />
              </>
            )}
          </button>

          {!allQuestionsAnswered &&
            totalQuestions > 0 && (
              <p className="mt-4 text-center text-sm font-bold text-[var(--nv-danger)]">
                لطفاً به تمامی سؤال‌ها پاسخ دهید تا دکمه
                فعال شود.
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
