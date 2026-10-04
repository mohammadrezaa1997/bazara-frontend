import api from '@/lib/api';

import type { CryptoMarketReport } from '../types';

export const cryptoMarketApi = {
  getReport: async () => {
    const { data } = await api.get<CryptoMarketReport>('/api/market/portfolio/');
    return data;
  },

  requestRefresh: async () => {
    const { data } = await api.post<CryptoMarketReport>('/api/market/portfolio/', {
      force: false,
    });
    return data;
  },
};
