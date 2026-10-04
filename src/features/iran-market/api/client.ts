import axios, { AxiosError } from 'axios';

import api from '@/lib/api';
import type {
  AdvisorPerformance,
  AdvisorRequest,
  AdvisorResponse,
  AdvisorSnapshotSummary,
  AssetListParams,
  IranMarketAnalysis,
  IranMarketAsset,
  IranMarketCompositeAnalysisResponse,
  IranMarketOpsHealth,
  IranMarketOverview,
  IranMarketPrice,
  PaginatedResponse,
  PriceHistoryParams,
} from '@/features/iran-market/types';

const BASE_PATH = '/api/iran-market';

type ListResponse<T> = T[] | PaginatedResponse<T> | { results: T[] };

export class IranMarketApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'IranMarketApiError';
    this.status = status;
    this.details = details;
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function encodeSymbol(symbol: string): string {
  return encodeURIComponent(normalizeSymbol(symbol));
}

function errorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;

  const record = data as Record<string, unknown>;
  for (const key of ['detail', 'message', 'error']) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key];
    }
  }
  return undefined;
}

function toApiError(error: unknown): IranMarketApiError {
  if (error instanceof IranMarketApiError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    return new IranMarketApiError(
      errorMessage(axiosError.response?.data) ||
        axiosError.message ||
        'ارتباط با سرویس بازار ایران ناموفق بود.',
      axiosError.response?.status,
      axiosError.response?.data,
    );
  }

  return new IranMarketApiError(
    error instanceof Error ? error.message : 'خطای ناشناخته در بازار ایران.',
  );
}

async function request<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toApiError(error);
  }
}

export function unwrapList<T>(payload: ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.results) ? payload.results : [];
}

export const iranMarketApi = {
  getHealth: () =>
    request(async () => {
      const { data } = await api.get<IranMarketOpsHealth>(
        `${BASE_PATH}/ops/health/`,
      );
      return data;
    }),

  getOverview: () =>
    request(async () => {
      const { data } = await api.get<IranMarketOverview>(
        `${BASE_PATH}/overview/`,
      );
      return data;
    }),

  getAssets: (params: AssetListParams = {}) =>
    request(async () => {
      const { data } = await api.get<ListResponse<IranMarketAsset>>(
        `${BASE_PATH}/assets/`,
        { params },
      );
      return unwrapList(data);
    }),

  getAsset: (symbol: string) =>
    request(async () => {
      const { data } = await api.get<IranMarketAsset>(
        `${BASE_PATH}/assets/${encodeSymbol(symbol)}/`,
      );
      return data;
    }),

  getLatestPrices: () =>
    request(async () => {
      const { data } = await api.get<ListResponse<IranMarketPrice>>(
        `${BASE_PATH}/prices/latest/`,
      );
      return unwrapList(data);
    }),

  getPriceHistory: ({ symbol, limit = 100 }: PriceHistoryParams) =>
    request(async () => {
      const { data } = await api.get<ListResponse<IranMarketPrice>>(
        `${BASE_PATH}/history/`,
        { params: { symbol: normalizeSymbol(symbol), limit } },
      );
      return unwrapList(data);
    }),

  getCompositeAnalysis: (symbol: string) =>
    request(async () => {
      const { data } = await api.get<
        IranMarketAnalysis | IranMarketCompositeAnalysisResponse
      >(
        `${BASE_PATH}/analysis/composite/${encodeSymbol(symbol)}/`,
      );
      if ('analysis' in data) {
        const composite = data.analysis.indicators?.composite ?? {};
        return {
          ...data.analysis,
          indicators: {
            ...data.analysis.indicators,
            composite: {
              ...composite,
              components: data.components ?? composite.components,
              decision_guard:
                data.decision_guard ?? composite.decision_guard,
              trade_plan: data.trade_plan ?? composite.trade_plan,
              data_quality_score:
                data.data_quality_score ?? composite.data_quality_score,
              conflict_score:
                data.conflict_score ?? composite.conflict_score,
            },
          },
        };
      }
      return data;
    }),

  generateAdvice: (payload: AdvisorRequest) =>
    request(async () => {
      const { data } = await api.post<AdvisorResponse>(
        `${BASE_PATH}/advisor/`,
        payload,
      );
      return data;
    }),

  generateSnapshot: (payload: AdvisorRequest) =>
    request(async () => {
      const { data } = await api.post<AdvisorResponse>(
        `${BASE_PATH}/advisor/snapshots/generate/`,
        payload,
      );
      return data;
    }),

  getSnapshots: () =>
    request(async () => {
      const { data } = await api.get<ListResponse<AdvisorSnapshotSummary>>(
        `${BASE_PATH}/advisor/snapshots/`,
      );
      return unwrapList(data);
    }),

  getSnapshot: (id: number) =>
    request(async () => {
      const { data } = await api.get<AdvisorResponse>(
        `${BASE_PATH}/advisor/snapshots/${id}/`,
      );
      return data;
    }),

  evaluateAdvice: () =>
    request(async () => {
      const { data } = await api.post<Record<string, unknown>>(
        `${BASE_PATH}/advisor/evaluate/`,
      );
      return data;
    }),

  getPerformance: () =>
    request(async () => {
      const { data } = await api.get<AdvisorPerformance>(
        `${BASE_PATH}/advisor/performance/`,
      );
      return data;
    }),
};
