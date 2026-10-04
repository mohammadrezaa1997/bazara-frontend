import axios from 'axios';

import api from '@/lib/api';
import type {
  CurrentSmartPortfolioResponse,
  GenerateSmartPortfolioResponse,
} from '../types';

const BASE_PATH = '/api/portfolio';

export const smartPortfolioApi = {
  getCurrent: async (): Promise<CurrentSmartPortfolioResponse> => {
    try {
      const { data } = await api.get<CurrentSmartPortfolioResponse>(
        `${BASE_PATH}/current/`,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return error.response.data as CurrentSmartPortfolioResponse;
      }
      throw error;
    }
  },

  generate: async (budgetToman: number) => {
    const { data } = await api.post<GenerateSmartPortfolioResponse>(
      `${BASE_PATH}/generate/`,
      { budget_toman: budgetToman, force: false },
    );
    return data;
  },
};
