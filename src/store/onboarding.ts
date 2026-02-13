import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OnboardingData } from '../types/onboarding';
import { recommendPlan } from '../lib/plans';

interface OnboardingStore {
  step: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  next: () => void;
  prev: () => void;
  update: (fields: Partial<OnboardingData>) => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  website_url: '',
  slug: '',
  slugAvailable: null,
  logo_url: null,
  color1: '#e9484d',
  color2: '#0f1128',
  company_trading_name: '',
  company_legal_name: '',
  email: '',
  sms_number: '',
  contact_first_name: '',
  contact_last_name: '',
  country: 'Australia',
  websiteFetched: false,
  websiteFetching: false,

  initial_plan: 'pro',
  technical_level: null,
  workflow_volume: null,
  recommended_plan: null,
  final_plan: null,

  billing: 'monthly',
  credential_setup: null,
  has_openrouter: null,
  openrouter_setup_clicked: false,
  ai_agent_setup: null,
  workflow_setup: null,
  local_hosting: null,
  website_hosting: null,
  detected_cms: null,

  business_summary: '',
  team_size: null,
  roles: [],
  automation_areas: [],

  vitalsync_record_id: null,
  completed_at: null,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 1,
      data: { ...initialData },

      setStep: (step) => set({ step }),

      next: () => set((state) => ({ step: Math.min(state.step + 1, 16) })),

      prev: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

      update: (fields) =>
        set((state) => {
          const newData = { ...state.data, ...fields };

          // Auto-calculate plan recommendation when both fields are set
          if (newData.technical_level && newData.workflow_volume) {
            const rec = recommendPlan(newData.technical_level, newData.workflow_volume);
            newData.recommended_plan = rec;
            if (!newData.final_plan) {
              newData.final_plan = rec;
            }
          }

          return { data: newData };
        }),

      reset: () => set({ step: 1, data: { ...initialData } }),
    }),
    {
      name: 'awesomate-onboarding',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Parse ?plan= query param on initial load
export function getInitialPlanFromURL(): void {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  if (plan && ['essentials', 'support-plus', 'pro', 'embedded'].includes(plan)) {
    useOnboardingStore.getState().update({
      initial_plan: plan as OnboardingData['initial_plan'],
    });
  }
}
