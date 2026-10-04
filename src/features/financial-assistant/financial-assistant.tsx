'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  ExternalLink,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  Square,
  UserRound,
} from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export const FINANCIAL_ASSISTANT_UI_VERSION =
  'financial-assistant-ui-v2-streaming';

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
  context_carried?: boolean;
  sources?: AssistantSource[];
  follow_up_suggestions?: string[];
  disclaimer?: string;
}

interface ChatHistoryItem {
  role: ChatRole;
  content: string;
  intent?: string;
  resolved_assets?: ResolvedAsset[];
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

interface AssistantStreamEvent {
  event: 'status' | 'metadata' | 'delta' | 'done' | 'error';
  message?: string;
  message_id?: string;
  delta?: string;
  response?: Omit<AssistantResponse, 'answer'>;
  code?: string;
}

class StreamEndpointUnavailable extends Error {}

const STARTER_PROMPTS = [
  'دلار و طلای ۱۸ عیار را مقایسه کن',
  'سولانا را برای سه ماه آینده تحلیل کن',
  'EUR/USD را با سناریوهای معتبر بررسی کن',
  'خبرهای امروز چه اثری روی بازار ایران دارند؟',
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

function assistantStreamUrl() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ).replace(/\/$/, '');
  return `${baseUrl}/api/market/assistant/stream/`;
}

async function responseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      detail?: string;
    };
    return payload.message || payload.detail;
  } catch {
    return null;
  }
}

async function streamAssistantResponse({
  message,
  history,
  signal,
  onEvent,
}: {
  message: string;
  history: ChatHistoryItem[];
  signal: AbortSignal;
  onEvent: (event: AssistantStreamEvent) => void;
}) {
  const token = useAuthStore.getState().accessToken;
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const response = await fetch(assistantStreamUrl(), {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history }),
  });

  if (response.status === 404 || response.status === 405) {
    throw new StreamEndpointUnavailable();
  }
  if (response.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.replace('/');
  }
  if (!response.ok) {
    throw new Error(
      (await responseErrorMessage(response)) ||
        'دستیار مالی در حال حاضر پاسخ‌گو نیست.',
    );
  }
  if (!response.body) {
    throw new Error('مرورگر امکان دریافت پاسخ زنده را فراهم نکرد.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;

  const consumeLine = (line: string) => {
    const cleaned = line.trim();
    if (!cleaned) return;
    const event = JSON.parse(cleaned) as AssistantStreamEvent;
    if (event.event === 'error') {
      throw new Error(
        event.message || 'دستیار مالی در حال حاضر پاسخ‌گو نیست.',
      );
    }
    if (event.event === 'done') completed = true;
    onEvent(event);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(consumeLine);
    if (done) break;
  }

  if (buffer.trim()) consumeLine(buffer);
  if (!completed) {
    throw new Error('ارتباط هنگام دریافت پاسخ قطع شد؛ دوباره تلاش کنید.');
  }
}

export function FinancialAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

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
    const assistantId = newLocalId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
    setError(null);
    setIsPending(true);
    setActiveAssistantId(assistantId);
    setStreamStatus('در حال بررسی داده‌های معتبر بازار...');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let streamedContent = '';
    let serverMessageId = assistantId;

    const updateAssistant = (
      updater: (item: ChatMessage) => ChatMessage,
    ) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId ? updater(item) : item,
        ),
      );
    };

    try {
      const history = previousMessages.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
        ...(item.response
          ? {
              intent: item.response.intent,
              resolved_assets: item.response.resolved_assets,
            }
          : {}),
      }));
      try {
        await streamAssistantResponse({
          message: cleaned,
          history,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.event === 'status' && event.message) {
              setStreamStatus(event.message);
              return;
            }
            if (event.event === 'metadata' && event.message_id) {
              serverMessageId = event.message_id;
              setStreamStatus('در حال آماده‌سازی پاسخ...');
              return;
            }
            if (event.event === 'delta' && event.delta) {
              streamedContent += event.delta;
              setStreamStatus('');
              updateAssistant((item) => ({
                ...item,
                content: streamedContent,
              }));
              return;
            }
            if (event.event === 'done' && event.response) {
              const completed: AssistantResponse = {
                ...event.response,
                message_id:
                  event.response.message_id || serverMessageId,
                answer: streamedContent,
              };
              updateAssistant((item) => ({
                ...item,
                content: streamedContent,
                response: completed,
              }));
            }
          },
        });
      } catch (streamError) {
        if (!(streamError instanceof StreamEndpointUnavailable)) {
          throw streamError;
        }

        const { data } = await api.post<AssistantResponse>(
          '/api/market/assistant/',
          { message: cleaned, history },
        );
        streamedContent = data.answer;
        updateAssistant((item) => ({
          ...item,
          content: data.answer,
          response: data,
        }));
      }
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === 'AbortError'
      ) {
        if (!streamedContent) {
          setMessages((current) =>
            current.filter((item) => item.id !== assistantId),
          );
        }
        return;
      }
      const failure = requestError as ApiFailure;
      setError(
        failure.response?.data?.message ||
          failure.response?.data?.detail ||
          failure.message ||
          'دستیار مالی در حال حاضر پاسخ‌گو نیست.',
      );
      if (!streamedContent) {
        setMessages((current) =>
          current.filter((item) => item.id !== assistantId),
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsPending(false);
      setActiveAssistantId(null);
      setStreamStatus('');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function stopResponse() {
    abortControllerRef.current?.abort();
  }

  return (
    <section className="nv-card overflow-hidden rounded-2xl">
      <div className="border-b border-[var(--nv-border)] bg-[var(--nv-soft)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-[var(--nv-text)]">
              مشاور خبره بازار
            </h2>
            <p className="mt-1 text-sm leading-7 text-[var(--nv-muted)] sm:text-[15px]">
              گفت‌وگوی پیوسته و مستند درباره بازار ایران، رمزارز و فارکس؛ با
              درنظرگرفتن پروفایل ریسک شما.
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
                        ? 'border-[var(--nv-info-border)] bg-[var(--nv-info-soft)] text-[var(--nv-info)]'
                        : 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
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
                        ? 'border-[var(--nv-info-border)] bg-[var(--nv-info-soft)]'
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
                                className="nv-chip-active rounded-full px-2.5 py-1 text-xs font-bold"
                              >
                                {asset.symbol} ·{' '}
                                {asset.market === 'iran'
                                  ? 'بازار ایران'
                                  : asset.market === 'forex'
                                    ? 'فارکس'
                                    : 'رمزارز'}
                              </span>
                            ))}
                            {message.response.context_carried ? (
                              <span className="nv-chip rounded-full px-2.5 py-1 text-xs font-bold">
                                ادامه موضوع قبلی
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {message.content ? (
                          <div className="prose max-w-none text-[15px] leading-8 text-[var(--nv-text-soft)] prose-headings:mb-2 prose-headings:mt-5 prose-headings:text-[var(--nv-text)] prose-strong:text-[var(--nv-accent)] dark:prose-invert sm:text-base sm:leading-9">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                            {activeAssistantId === message.id ? (
                              <span
                                aria-hidden="true"
                                className="mr-1 inline-block h-5 w-1 animate-pulse rounded-full bg-[var(--nv-accent)] align-middle"
                              />
                            ) : null}
                          </div>
                        ) : activeAssistantId === message.id ? (
                          <div className="flex min-h-10 items-center gap-2 text-sm text-[var(--nv-muted)]">
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--nv-accent)]" />
                            {streamStatus || 'در حال آماده‌سازی پاسخ...'}
                          </div>
                        ) : null}

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
                                        className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-bold text-[var(--nv-accent)] transition hover:text-[var(--nv-accent-hover)]"
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

          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-dashed border-[var(--nv-border)] bg-[var(--nv-soft)] p-5 text-center">
            <MessageSquareText className="mx-auto h-8 w-8 text-[var(--nv-accent)]" />
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
              className="nv-chip min-h-10 shrink-0 rounded-full px-3 text-sm font-bold disabled:opacity-50"
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
            className="nv-field min-h-28 w-full resize-y rounded-xl px-4 py-3 text-[15px] leading-7 sm:text-base"
          />

          {error ? (
            <p className="nv-status-danger rounded-xl p-3 text-sm leading-6">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[var(--nv-muted)]">
              Enter برای ارسال · Shift+Enter برای رفتن به خط بعد
            </p>
            {isPending ? (
              <button
                type="button"
                onClick={stopResponse}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 font-bold text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-300 sm:w-auto"
              >
                <Square className="h-4 w-4 fill-current" />
                توقف پاسخ
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="nv-button-primary min-h-12 w-full gap-2 rounded-xl px-6 sm:w-auto"
              >
                <Send className="h-5 w-5" />
                ارسال برای تحلیل
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
