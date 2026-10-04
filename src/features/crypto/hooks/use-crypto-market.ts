'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cryptoMarketApi } from '../api/client';

export const cryptoMarketKeys = {
  all: ['crypto-market'] as const,
  report: () => [...cryptoMarketKeys.all, 'report'] as const,
  prices: () => [...cryptoMarketKeys.all, 'prices'] as const,
};

export function useCryptoMarketReport() {
  return useQuery({
    queryKey: cryptoMarketKeys.report(),
    queryFn: cryptoMarketApi.getReport,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 5_000 : false,
  });
}

export function useRequestCryptoRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cryptoMarketApi.requestRefresh,
    onSuccess: () => {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: cryptoMarketKeys.report() });
      }, 2_000);
    },
  });
}
