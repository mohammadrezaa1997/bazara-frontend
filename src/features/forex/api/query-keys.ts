import type { ForexHistoryParams } from "../types";

export const forexKeys = {
  all: ["forex"] as const,

  overview: () =>
    [...forexKeys.all, "overview"] as const,

  pairs: () =>
    [...forexKeys.all, "pairs"] as const,

  history: (params: ForexHistoryParams) =>
    [...forexKeys.all, "history", params] as const,

  analysis: (symbol: string) =>
    [...forexKeys.all, "analysis", symbol] as const,
};