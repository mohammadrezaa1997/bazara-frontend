'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { smartPortfolioApi } from '../api/client';

export const smartPortfolioKeys = {
  all: ['smart-portfolio'] as const,
  current: () => [...smartPortfolioKeys.all, 'current'] as const,
};

export function useCurrentSmartPortfolio() {
  return useQuery({
    queryKey: smartPortfolioKeys.current(),
    queryFn: smartPortfolioApi.getCurrent,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useGenerateSmartPortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: smartPortfolioApi.generate,
    onSuccess: (data) => {
      queryClient.setQueryData(smartPortfolioKeys.current(), {
        has_portfolio: true,
        portfolio: data.portfolio,
      });
    },
  });
}
