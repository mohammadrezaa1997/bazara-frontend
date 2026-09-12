'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Loader2,
  Target,
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
}

interface Question {
  id: number;
  title: string;
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
  risk_profile: string;
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

export default function OnboardingPage() {
  const router = useRouter();

  const updateUserStats = useAuthStore(
    (state) => state.updateUserStats
  );

  const [horizon, setHorizon] = useState('۳ ماهه');
  const [budget, setBudget] = useState<number>(5000);

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
        data.profile.risk_profile
      );

      toast.success(
        `پروفایل شما با سطح ریسک «${data.profile.risk_profile}» ذخیره شد.`
      );

      router.push('/dashboard');
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
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />

          <p className="animate-pulse font-medium tracking-wide text-cyan-400/80">
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
        <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-[var(--nv-panel)] p-8 text-center text-[var(--nv-text)] shadow-[var(--nv-shadow)]">
          <h2 className="mb-3 text-xl font-black text-rose-400">
            خطا در دریافت پرسش‌نامه
          </h2>

          <p className="mb-6 text-sm leading-7 text-[var(--nv-muted)]">
            ارتباط با بک‌اند برقرار نشد یا دریافت سؤال‌ها
            با خطا مواجه شد.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 font-bold text-white transition-all hover:from-cyan-500 hover:to-blue-500"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      dir="rtl"
      className="nv-page px-3 py-5 selection:bg-cyan-500/30 sm:px-6 sm:py-10"
    >
      <div className="relative mx-auto max-w-3xl space-y-5 sm:space-y-8">
        <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative z-10 mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-3 text-2xl font-black text-[var(--nv-text)] sm:text-3xl">
              <BrainCircuit className="h-8 w-8 text-cyan-400" />
              کالیبراسیون ذهن و ریسک
            </h1>

            <p className="mt-2 text-[15px] leading-8 text-[var(--nv-muted)]">
              برای تنظیم دقیق استراتژی‌های هوش مصنوعی،
              پارامترهای سرمایه‌گذاری و میزان تحمل ریسک خود
              را مشخص کنید.
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

        <div className="relative z-10 space-y-6">
          <section className="rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)] sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-[var(--nv-border)] pb-4 text-xl font-bold text-[var(--nv-text)]">
              <Target className="h-5 w-5 text-blue-400" />
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
                  <p className="text-xs text-rose-400">
                    افق زمانی سرمایه‌گذاری را وارد کنید.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="investment-budget"
                  className="mr-1 text-sm font-bold text-[var(--nv-text-soft)]"
                >
                  بودجه کل (USDT)
                </label>

                <div className="relative">
                  <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-[var(--nv-muted)]" />

                  <input
                    id="investment-budget"
                    type="number"
                    min="1"
                    step="1"
                    value={budget}
                    onChange={(event) =>
                      setBudget(
                        Number(event.target.value)
                      )
                    }
                    className="nv-field w-full rounded-2xl py-3.5 pl-12 pr-4 text-left font-bold transition-all"
                    dir="ltr"
                  />
                </div>

                {!isBudgetValid && (
                  <p className="text-xs text-rose-400">
                    بودجه باید بیشتر از صفر باشد.
                  </p>
                )}
              </div>
            </div>
          </section>

          {!questions || questions.length === 0 ? (
            <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <p className="font-medium text-amber-300">
                هنوز هیچ سؤال روان‌شناختی در بک‌اند ثبت
                نشده است.
              </p>
            </section>
          ) : (
            questions.map((question, index) => (
              <section
                key={question.id}
                className="rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)] transition-transform duration-300 sm:p-8 sm:hover:-translate-y-1"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 font-bold text-cyan-400">
                    {index + 1}
                  </div>

                  <h3 className="pt-1 text-lg font-bold leading-8 text-[var(--nv-text)]">
                    {question.title}
                  </h3>
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
                            ? 'border-cyan-500 bg-cyan-500/10 text-[var(--nv-text)] shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                            : 'border-[var(--nv-border)] bg-[var(--nv-soft)] text-[var(--nv-text-soft)] hover:border-cyan-500/25'
                        }`}
                      >
                        <span className="relative z-10 pl-6 font-medium leading-relaxed">
                          {choice.text}
                        </span>

                        <div
                          className={`relative z-10 shrink-0 transition-transform duration-300 ${
                            isSelected
                              ? 'scale-110'
                              : 'scale-100 group-hover:scale-110'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-[var(--nv-faint)] transition-colors group-hover:border-cyan-500" />
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 translate-x-[-100%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0" />
                        )}
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
                  ? 'font-bold text-emerald-400'
                  : 'font-bold text-cyan-400'
              }
            >
              {answeredQuestions} از {totalQuestions}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                در حال محاسبه پروفایل...
              </>
            ) : (
              <>
                تولید پروفایل AI و ورود به داشبورد
                <ChevronRight className="h-5 w-5 rotate-180" />
              </>
            )}
          </button>

          {!allQuestionsAnswered &&
            totalQuestions > 0 && (
              <p className="mt-4 text-center text-sm font-medium text-rose-400">
                لطفاً به تمامی سؤال‌ها پاسخ دهید تا دکمه
                فعال شود.
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
