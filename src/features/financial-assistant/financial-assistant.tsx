'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';

import api from '@/lib/api';

export const FINANCIAL_ASSISTANT_UI_VERSION =
  'financial-assistant-ui-v1';

type ChatRole = 'user' | 'assistant';

interface ResolvedAsset {
  market: 'iran' | 'crypto' | string;
  symbol: string;
  name: string;
  query?: string;
}

interface AssistantSource {
  title?: string | null;
  url?: string | null;
  source?: string | null;
  published_at?: string | null;
  reason?: string | null;
  score?: string | number | null;
}

interface AssistantResponse {
  version: string;
  message_id: string;
  intent: string;
  answer: string;
  short_summary?: string;
  resolved_assets?: ResolvedAsset[];
  needs_clarification?: boolean;
  clarification_question?: string | null;
  sources?: AssistantSource[];
  follow_up_suggestions?: string[];
  disclaimer?: string;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  response?: AssistantResponse;
}

interface ApiFailure {
  response?: {
    data?: {
      message?: string;
      detail?: string;
    };
  };
  message?: string;
}

const STARTER_PROMPTS = [
  'دلار و طلای ۱۸ عیار را مقایسه کن',
  'سولانا را برای سه ماه آینده تحلیل کن',
  'خبرهای امروز چه اثری روی بازار ایران دارند؟',
  'چرا سکه امامی زیر نظر است؟',
];

function safeExternalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function newLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function FinancialAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const latestSuggestions = useMemo(() => {
    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant');
    return latestAssistant?.response?.follow_up_suggestions?.length
      ? latestAssistant.response.follow_up_suggestions
      : STARTER_PROMPTS;
  }, [messages]);

  async function sendMessage(message: string) {
    const cleaned = message.trim();
    if (!cleaned || isPending) return;

    const previousMessages = messages;
    const userMessage: ChatMessage = {
      id: newLocalId(),
      role: 'user',
      content: cleaned,
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError(null);
    setIsPending(true);

    try {
      const history = previousMessages.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const { data } = await api.post<AssistantResponse>(
        '/api/market/assistant/',
        { message: cleaned, history },
      );
      setMessages((current) => [
        ...current,
        {
          id: data.message_id || newLocalId(),
          role: 'assistant',
          content: data.answer,
          response: data,
        },
      ]);
    } catch (requestError) {
      const failure = requestError as ApiFailure;
      setError(
        failure.response?.data?.message ||
          failure.response?.data?.detail ||
          failure.message ||
          'دستیار مالی در حال حاضر پاسخ‌گو نیست.',
      );
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--nv-border)] bg-[var(--nv-panel)] shadow-[var(--nv-shadow)]">
      <div className="border-b border-[var(--nv-border)] bg-gradient-to-l from-cyan-500/[0.09] to-blue-500/[0.03] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-[var(--nv-text)]">
              دستیار هوشمند مالی 
            </h2>
            <p className="mt-1 text-sm leading-7 text-[var(--nv-muted)] sm:text-[15px]">
              سؤال خود را فارسی یا انگلیسی بنویسید؛ نام یا نماد بازار ایران و
              رمزارز به‌صورت خودکار تشخیص داده می‌شود.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {messages.length ? (
          <div
            aria-live="polite"
            className="mb-5 max-h-[680px] space-y-4 overflow-y-auto pl-1 sm:pl-2"
          >
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <article
                  key={message.id}
                  className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      isUser
                        ? 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                        : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                    }`}
                  >
                    {isUser ? (
                      <UserRound className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </span>

                  <div
                    className={`min-w-0 max-w-[92%] rounded-2xl border p-4 sm:max-w-[86%] ${
                      isUser
                        ? 'border-blue-500/20 bg-blue-500/[0.08]'
                        : 'border-[var(--nv-border)] bg-[var(--nv-soft)]'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-[15px] leading-8 text-[var(--nv-text)] sm:text-base">
                        {message.content}
                      </p>
                    ) : (
                      <>
                        {message.response?.resolved_assets?.length ? (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {message.response.resolved_assets.map((asset) => (
                              <span
                                key={`${asset.market}-${asset.symbol}`}
                                dir="ltr"
                                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300"
                              >
                                {asset.symbol} ·{' '}
                                {asset.market === 'iran' ? 'Iran' : 'Crypto'}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="prose max-w-none text-[15px] leading-8 text-[var(--nv-text-soft)] prose-headings:mb-2 prose-headings:mt-5 prose-headings:text-[var(--nv-text)] prose-strong:text-cyan-700 dark:prose-invert dark:prose-strong:text-cyan-300 sm:text-base sm:leading-9">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {message.response?.sources?.length ? (
                          <details className="mt-4 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-3">
                            <summary className="cursor-pointer text-sm font-black text-[var(--nv-text)]">
                              منابع و شواهد ({message.response.sources.length})
                            </summary>
                            <div className="mt-3 space-y-2">
                              {message.response.sources.map((source, index) => {
                                const href = safeExternalUrl(source.url);
                                return (
                                  <div
                                    key={`${source.url ?? source.title}-${index}`}
                                    className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3"
                                  >
                                    <p className="text-sm font-bold leading-6 text-[var(--nv-text)]">
                                      [{index + 1}] {source.title || 'شاهد تحلیلی'}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-[var(--nv-muted)]">
                                      {source.source || 'منبع ثبت‌شده'}
                                    </p>
                                    {source.reason ? (
                                      <p className="mt-2 text-sm leading-6 text-[var(--nv-text-soft)]">
                                        {source.reason}
                                      </p>
                                    ) : null}
                                    {href ? (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-bold text-cyan-700 dark:text-cyan-300"
                                      >
                                        مشاهده منبع
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}

                        {message.response?.disclaimer ? (
                          <p className="mt-4 border-t border-[var(--nv-border)] pt-3 text-xs leading-6 text-[var(--nv-muted)]">
                            {message.response.disclaimer}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}

            {isPending ? (
              <div className="flex items-center gap-2 text-sm text-[var(--nv-muted)]">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                در حال بررسی داده‌های معتبر بازار...
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-dashed border-[var(--nv-border)] bg-[var(--nv-soft)] p-5 text-center">
            <MessageSquareText className="mx-auto h-8 w-8 text-cyan-500" />
            <p className="mt-3 text-[15px] font-bold leading-7 text-[var(--nv-text)]">
              تحلیل دارایی، مقایسه بازارها، بررسی خبر و توضیح پیشنهادها
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--nv-muted)]">
              برای مثال بنویسید: «دلار بهتر است یا بیت‌کوین؟»
            </p>
          </div>
        )}

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {latestSuggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isPending}
              onClick={() => setInput(prompt)}
              className="min-h-10 shrink-0 rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 text-sm font-bold text-[var(--nv-text-soft)] transition hover:border-cyan-500/30 hover:text-cyan-700 disabled:opacity-50 dark:hover:text-cyan-300"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            maxLength={2000}
            rows={3}
            dir="auto"
            placeholder="مثلاً: سکه امامی چرا زیر نظر است و چه خبری روی آن اثر گذاشته؟"
            className="min-h-28 w-full resize-y rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-field)] px-4 py-3 text-[15px] leading-7 text-[var(--nv-text)] outline-none transition placeholder:text-[var(--nv-muted)] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 sm:text-base"
          />

          {error ? (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm leading-6 text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[var(--nv-muted)]">
              Enter برای ارسال · Shift+Enter برای رفتن به خط بعد
            </p>
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 font-black text-white shadow-lg shadow-blue-500/15 transition hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {isPending ? 'در حال تحلیل...' : 'ارسال برای تحلیل'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
