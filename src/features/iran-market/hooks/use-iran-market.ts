'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { iranMarketApi } from '../api/client';
import { iranMarketKeys } from '../api/query-keys';
import type {
  AdvisorRequest,
  AssetListParams,
  PriceHistoryParams,
} from '../types';

const PRICE_REFETCH_MS = 60_000;

export function useIranMarketHealth() {
  return useQuery({
    queryKey: iranMarketKeys.health(),
    queryFn: iranMarketApi.getHealth,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useIranMarketOverview() {
  return useQuery({
    queryKey: iranMarketKeys.overview(),
    queryFn: iranMarketApi.getOverview,
    staleTime: PRICE_REFETCH_MS,
    refetchInterval: PRICE_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
}

export function useIranMarketAssets(params: AssetListParams = {}) {
  return useQuery({
    queryKey: iranMarketKeys.assetList(params),
    queryFn: () => iranMarketApi.getAssets(params),
    staleTime: 5 * 60_000,
  });
}

export function useIranMarketAsset(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return useQuery({
    queryKey: iranMarketKeys.asset(normalized),
    queryFn: () => iranMarketApi.getAsset(normalized),
    enabled: Boolean(normalized),
    staleTime: 5 * 60_000,
  });
}

export function useIranMarketLatestPrices() {
  return useQuery({
    queryKey: iranMarketKeys.latestPrices(),
    queryFn: iranMarketApi.getLatestPrices,
    staleTime: 30_000,
    refetchInterval: PRICE_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
}

export function useIranMarketPriceHistory(params: PriceHistoryParams) {
  const normalized = params.symbol.trim().toUpperCase();
  const normalizedParams = { ...params, symbol: normalized };
  return useQuery({
    queryKey: iranMarketKeys.history(normalizedParams),
    queryFn: () => iranMarketApi.getPriceHistory(normalizedParams),
    enabled: Boolean(normalized),
    staleTime: PRICE_REFETCH_MS,
  });
}

export function useCompositeAnalysis(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return useQuery({
    queryKey: iranMarketKeys.analysis(normalized),
    queryFn: () => iranMarketApi.getCompositeAnalysis(normalized),
    enabled: Boolean(normalized),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useGenerateIranMarketAdvice() {
  return useMutation({
    mutationFn: (payload: AdvisorRequest) =>
      iranMarketApi.generateAdvice(payload),
  });
}

export function useGenerateAdvisorSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdvisorRequest) =>
      iranMarketApi.generateSnapshot(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: iranMarketKeys.snapshots(),
      });
    },
  });
}

export function useAdvisorSnapshots() {
  return useQuery({
    queryKey: iranMarketKeys.snapshots(),
    queryFn: iranMarketApi.getSnapshots,
    staleTime: PRICE_REFETCH_MS,
  });
}

export function useAdvisorSnapshot(id: number | null) {
  return useQuery({
    queryKey: iranMarketKeys.snapshot(id ?? 0),
    queryFn: () => iranMarketApi.getSnapshot(id as number),
    enabled: id !== null && id > 0,
  });
}

export function useEvaluateAdvice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: iranMarketApi.evaluateAdvice,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: iranMarketKeys.performance(),
      });
      void queryClient.invalidateQueries({
        queryKey: iranMarketKeys.snapshots(),
      });
    },
  });
}

export function useAdvisorPerformance() {
  return useQuery({
    queryKey: iranMarketKeys.performance(),
    queryFn: iranMarketApi.getPerformance,
    staleTime: 5 * 60_000,
  });
}

