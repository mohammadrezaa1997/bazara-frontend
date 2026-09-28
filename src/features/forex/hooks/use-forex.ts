"use client";

import { useQuery } from "@tanstack/react-query";

import { forexApi } from "../api/client";
import { forexKeys } from "../api/query-keys";

import type {
  ForexHistoryParams,
} from "../types";

export function useForexOverview() {
  return useQuery({
    queryKey: forexKeys.overview(),
    queryFn: forexApi.getOverview,

    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useForexPairs() {
  return useQuery({
    queryKey: forexKeys.pairs(),
    queryFn: forexApi.getPairs,

    staleTime: 15 * 60_000,
  });
}

export function useForexHistory(
  params: ForexHistoryParams,
) {
  const normalized: ForexHistoryParams = {
    ...params,

    symbol: params.symbol
      .trim()
      .toUpperCase()
      .replace("/", "_"),
  };

  return useQuery({
    queryKey: forexKeys.history(normalized),

    queryFn: () =>
      forexApi.getHistory(normalized),

    enabled: Boolean(normalized.symbol),

    staleTime: 5 * 60_000,
  });
}

export function useForexAnalysis(
  symbol: string,
) {
  const normalized = symbol
    .trim()
    .toUpperCase()
    .replace("/", "_");

  return useQuery({
    queryKey: forexKeys.analysis(normalized),

    queryFn: () =>
      forexApi.getAnalysis(normalized),

    enabled: Boolean(normalized),

    staleTime: 2 * 60_000,

    retry: false,
  });
}