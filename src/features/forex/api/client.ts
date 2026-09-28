import axios, { AxiosError } from "axios";

import api from "@/lib/api";

import type {
  ForexAnalysis,
  ForexHistoryParams,
  ForexHistoryResponse,
  ForexOverview,
  ForexPair,
} from "../types";

const BASE_PATH = "/api/forex";

export class ForexApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    status?: number,
    details?: unknown,
  ) {
    super(message);

    this.name = "ForexApiError";
    this.status = status;
    this.details = details;
  }
}

function normalizeSymbol(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .replace("/", "_");
}

function errorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const record = data as Record<string, unknown>;

  for (const key of ["detail", "message", "error"]) {
    if (
      typeof record[key] === "string" &&
      record[key]
    ) {
      return record[key];
    }
  }

  return undefined;
}

function toApiError(error: unknown): ForexApiError {
  if (error instanceof ForexApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;

    return new ForexApiError(
      errorMessage(axiosError.response?.data) ||
        axiosError.message ||
        "ارتباط با سرویس فارکس ناموفق بود.",
      axiosError.response?.status,
      axiosError.response?.data,
    );
  }

  return new ForexApiError(
    error instanceof Error
      ? error.message
      : "خطای ناشناخته در سرویس فارکس.",
  );
}

async function request<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toApiError(error);
  }
}

export const forexApi = {
  getOverview: () =>
    request(async () => {
      const { data } = await api.get<ForexOverview>(
        `${BASE_PATH}/overview/`,
      );

      return data;
    }),

  getPairs: () =>
    request(async () => {
      const { data } = await api.get<ForexPair[]>(
        `${BASE_PATH}/pairs/`,
      );

      return data;
    }),

  getHistory: ({
    symbol,
    timeframe,
    limit = 500,
  }: ForexHistoryParams) =>
    request(async () => {
      const { data } =
        await api.get<ForexHistoryResponse>(
          `${BASE_PATH}/history/`,
          {
            params: {
              symbol: normalizeSymbol(symbol),
              timeframe,
              limit,
            },
          },
        );

      return data;
    }),

  getAnalysis: (symbol: string) =>
    request(async () => {
      const { data } = await api.get<ForexAnalysis>(
        `${BASE_PATH}/analysis/`,
        {
          params: {
            symbol: normalizeSymbol(symbol),
          },
        },
      );

      return data;
    }),
};