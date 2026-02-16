import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OnboardingData } from '../types/onboarding';
import { recommendPlan } from '../lib/plans';
import {
  createOnboardingRecord,
  updateOnboardingRecord,
} from '../lib/api';
import { getAffiliateConfig } from '../lib/affiliates';

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

  billing_email: '',
  payment_status: null,
  transaction_id: null,
  payment_error: null,

  affiliate_code: null,

  vitalsync_record_id: null,
  completed_at: null,
};

/**
 * Auto-save to VitalStats at key step transitions.
 * Runs in the background — never blocks the UI.
 */
async function autoSave(prevStep: number, nextStep: number, data: OnboardingData): Promise<string | null> {
  console.log(`[AutoSave] Step ${prevStep} → ${nextStep}, record_id: ${data.vitalsync_record_id || 'none'}`);

  // Step 2 → 3: Create record with contact/business details
  if (prevStep === 2 && nextStep === 3 && !data.vitalsync_record_id) {
    console.log('[AutoSave] Creating new contact record');
    const id = await createOnboardingRecord(data);
    return id;
  }

  if (!data.vitalsync_record_id) {
    console.log('[AutoSave] No record ID yet — skipping update');
    return null;
  }

  // Key save points: comprehensive update with all data collected so far
  // Step 6→7: after plan selection
  // Step 13→14: after add-ons
  // Step 15→16: save all data before payment screen (markComplete is called after payment succeeds in Step16)
  if (
    (prevStep === 6 && nextStep === 7) ||
    (prevStep === 13 && nextStep === 14) ||
    (prevStep === 15 && nextStep === 16)
  ) {
    console.log('[AutoSave] Updating record at key save point');
    updateOnboardingRecord(data.vitalsync_record_id, data);
  }

  return null;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      step: 1,
      data: { ...initialData },

      setStep: (step) => set({ step }),

      next: () => {
        const state = get();
        let nextStep = Math.min(state.step + 1, 16);

        // Skip Step 12 (WordPress hosting) if CMS is not confirmed WordPress
        if (nextStep === 12 && state.data.detected_cms !== 'WordPress') {
          nextStep = 13;
        }

        set({ step: nextStep });

        // Fire-and-forget auto-save
        autoSave(state.step, nextStep, state.data).then((recordId) => {
          if (recordId) {
            set((s) => ({
              data: { ...s.data, vitalsync_record_id: recordId },
            }));
          }
        });
      },

      prev: () => set((state) => {
        let prevStep = Math.max(state.step - 1, 1);

        // Skip Step 12 (WordPress hosting) if CMS is not confirmed WordPress
        if (prevStep === 12 && state.data.detected_cms !== 'WordPress') {
          prevStep = 11;
        }

        return { step: prevStep };
      }),

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

/**
 * Parse ?plan= query param on initial load.
 * Accepts numeric (1-4) or plan key names from the pricing page CTAs.
 *
 * Mapping: 1=essentials, 2=support-plus, 3=pro, 4=embedded
 */
const PLAN_NUMBER_MAP: Record<string, OnboardingData['initial_plan']> = {
  '1': 'essentials',
  '2': 'support-plus',
  '3': 'pro',
  '4': 'embedded',
};

const VALID_PLAN_KEYS = ['essentials', 'support-plus', 'pro', 'embedded'];

export function getInitialPlanFromURL(): void {
  const params = new URLSearchParams(window.location.search);

  // Only apply on fresh sessions (step 1), not mid-flow refreshes
  const store = useOnboardingStore.getState();
  if (store.step > 1) return;

  // Parse ?aff= affiliate code
  const aff = params.get('aff');
  if (aff) {
    const config = getAffiliateConfig(aff);
    if (config) {
      store.update({ affiliate_code: config.code });
    }
  }

  // Parse ?plan= (numeric 1-4 or plan key names)
  const plan = params.get('plan');
  if (!plan) return;

  // Accept numeric ?plan=1 through ?plan=4
  const mapped = PLAN_NUMBER_MAP[plan];
  if (mapped) {
    store.update({ initial_plan: mapped, final_plan: mapped });
    return;
  }

  // Also accept plan key names (?plan=pro, ?plan=essentials, etc.)
  if (VALID_PLAN_KEYS.includes(plan)) {
    store.update({
      initial_plan: plan as OnboardingData['initial_plan'],
      final_plan: plan as OnboardingData['initial_plan'],
    });
  }
}
