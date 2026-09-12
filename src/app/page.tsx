'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';

function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { error?: string; detail?: string } | undefined;
    return payload?.error || payload?.detail || fallback;
  }
  return fallback;
}

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const setTokens = useAuthStore((state) => state.setTokens);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10 || formData.password.length < 6) {
      toast.error('شماره موبایل معتبر و رمز عبور حداقل ۶ کاراکتری وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/users/auth/register/', {
        phone_number: formData.phone,
        email: formData.email,
        password: formData.password
      });
      toast.success('حساب شما با موفقیت ساخته شد! حالا وارد شوید.');
      setIsLoginMode(true); // سوئیچ خودکار به تب ورود
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'خطا در ثبت‌نام.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/users/auth/login/', {
        phone_number: formData.phone,
        password: formData.password,
      });

      setTokens(data.access, data.refresh, data.is_profile_complete);
      toast.success('با موفقیت وارد شدید!');

      if (data.is_profile_complete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'شماره موبایل یا رمز عبور اشتباه است.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nv-page flex min-h-dvh items-center px-3 py-5 sm:px-6 sm:py-8">
      <div className="absolute left-3 top-3 z-20 sm:left-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-l border-[var(--nv-border)] bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.06] to-transparent p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-sm font-bold text-cyan-600 dark:text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              تصمیم‌یار هوشمند سرمایه‌گذاری
            </div>
            <h2 className="mt-7 max-w-md text-4xl font-black leading-[1.55] text-[var(--nv-text)]">
              تحلیل بازار با تمرکز بر ریسک و شواهد واقعی
            </h2>
            <p className="mt-4 max-w-lg text-base leading-9 text-[var(--nv-muted)]">
              رمزارزها و بازار ایران را در یک محیط یکپارچه بررسی کنید و پیشنهادهای
              قابل توضیح متناسب با پروفایل خود دریافت کنید.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: BarChart3, label: 'داده بازار' },
              { icon: BrainCircuit, label: 'تحلیل چندمنبعی' },
              { icon: CheckCircle2, label: 'کنترل ریسک' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)]/75 p-4 text-center">
                <Icon className="mx-auto h-5 w-5 text-cyan-500" />
                <p className="mt-2 text-sm font-bold text-[var(--nv-text-soft)]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 pt-20 sm:p-9 sm:pt-20 lg:p-10">
          <div className="mb-7 text-center lg:text-right">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 lg:mx-0">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--nv-text)]">BAZARA</h1>
            <p className="mt-2 text-[15px] leading-7 text-[var(--nv-muted)]">پلتفرم هوشمند تحلیل بازار و مدیریت ریسک</p>
          </div>

          {/* تب‌های انتخاب حالت */}
          <div className="mb-7 flex rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-1">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${isLoginMode ? 'bg-[var(--nv-panel)] text-cyan-600 shadow-sm dark:text-cyan-300' : 'text-[var(--nv-muted)] hover:text-[var(--nv-text)]'}`}
            >
              <LogIn className="h-4 w-4" /> ورود
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${!isLoginMode ? 'bg-[var(--nv-panel)] text-cyan-600 shadow-sm dark:text-cyan-300' : 'text-[var(--nv-muted)] hover:text-[var(--nv-text)]'}`}
            >
              <UserPlus className="h-4 w-4" /> ثبت‌نام تستر
            </button>
          </div>

          {/* فرم ثبت‌نام / ورود */}
          <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">

            <div>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--nv-muted)]" />
                <input
                  type="text"
                  placeholder="شماره موبایل (09123456789)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="nv-field h-13 w-full rounded-2xl py-3 pl-4 pr-12 text-left text-base transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--nv-muted)]" />
                  <input
                    type="email"
                    placeholder="ایمیل (اختیاری)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="nv-field h-13 w-full rounded-2xl py-3 pl-4 pr-12 text-left text-base transition-all"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--nv-muted)]" />
                <input
                  type="password"
                  placeholder="رمز عبور"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="nv-field h-13 w-full rounded-2xl py-3 pl-4 pr-12 text-left text-base transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 font-black text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLoginMode ? 'ورود به داشبورد' : 'ساخت حساب کاربری')}
            </button>

          </form>
        </section>
      </div>
    </main>
  );
}
