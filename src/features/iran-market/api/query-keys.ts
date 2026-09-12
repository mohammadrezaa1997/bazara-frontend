import type { AssetListParams, PriceHistoryParams } from '../types';

export const iranMarketKeys = {
  all: ['iran-market'] as const,
  health: () => [...iranMarketKeys.all, 'health'] as const,
  overview: () => [...iranMarketKeys.all, 'overview'] as const,
  assets: () => [...iranMarketKeys.all, 'assets'] as const,
  assetList: (params: AssetListParams) =>
    [...iranMarketKeys.assets(), 'list', params] as const,
  asset: (symbol: string) =>
    [...iranMarketKeys.assets(), 'detail', symbol.trim().toUpperCase()] as const,
  prices: () => [...iranMarketKeys.all, 'prices'] as const,
  latestPrices: () => [...iranMarketKeys.prices(), 'latest'] as const,
  history: (params: PriceHistoryParams) =>
    [
      ...iranMarketKeys.prices(),
      'history',
      params.symbol.trim().toUpperCase(),
      params.limit ?? 100,
    ] as const,
  analysis: (symbol: string) =>
    [
      ...iranMarketKeys.all,
      'analysis',
      'composite',
      symbol.trim().toUpperCase(),
    ] as const,
  advisor: () => [...iranMarketKeys.all, 'advisor'] as const,
  snapshots: () => [...iranMarketKeys.advisor(), 'snapshots'] as const,
  snapshot: (id: number) => [...iranMarketKeys.snapshots(), id] as const,
  performance: () => [...iranMarketKeys.advisor(), 'performance'] as const,
};

