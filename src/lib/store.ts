import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;

  isProfileComplete: boolean;

  budget: number;
  riskProfile: string;
  overallRiskScore: number | null;
  investmentHorizon: string;

  setTokens: (
    access: string,
    refresh: string,
    isProfileComplete?: boolean
  ) => void;

  updateUserStats: (
    newBudget: number,
    newRiskProfile: string,
    newRiskScore?: number | null,
    newInvestmentHorizon?: string
  ) => void;

  setProfileComplete: (isComplete: boolean) => void;

  clearProfile: () => void;

  logout: () => void;
}

const initialProfileState = {
  isProfileComplete: false,
  budget: 0,
  riskProfile: 'در حال ارزیابی...',
  overallRiskScore: null,
  investmentHorizon: '',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,

      ...initialProfileState,

      setTokens: (
        access,
        refresh,
        isProfileComplete = false
      ) => {
        set({
          accessToken: access,
          refreshToken: refresh,
          isProfileComplete,
        });
      },

      updateUserStats: (
        newBudget,
        newRiskProfile,
        newRiskScore = null,
        newInvestmentHorizon = ''
      ) => {
        set({
          budget: Number(newBudget) || 0,
          riskProfile:
            newRiskProfile || 'در حال ارزیابی...',
          overallRiskScore: newRiskScore,
          investmentHorizon: newInvestmentHorizon,
          isProfileComplete: true,
        });
      },

      setProfileComplete: (isComplete) => {
        set({
          isProfileComplete: isComplete,
        });
      },

      clearProfile: () => {
        set({
          ...initialProfileState,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          ...initialProfileState,
        });
      },
    }),
    {
      name: 'neurovest-auth-storage',

      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isProfileComplete: state.isProfileComplete,
        budget: state.budget,
        riskProfile: state.riskProfile,
        overallRiskScore: state.overallRiskScore,
        investmentHorizon: state.investmentHorizon,
      }),
    }
  )
);