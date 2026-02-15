export type PlanKey = 'essentials' | 'support-plus' | 'pro' | 'embedded';
export type TechLevel = 'self-sufficient' | 'some-help' | 'full-service';
export type WorkflowVolume = 'starter' | 'growing' | 'full-engine' | 'unsure';
export type SetupChoice = 'self' | 'assisted';
export type TeamSize = 'solo' | '2-5' | '6-20' | '20+';
export type BillingFrequency = 'monthly' | 'yearly';

export interface PlanInfo {
  key: PlanKey;
  name: string;
  price: number;
  yearlyPrice: number;
  color: string;
  features: string[];
}

export interface PhaseInfo {
  label: string;
  steps: number[];
}

export interface OnboardingData {
  // Phase 1 — Business Discovery
  website_url: string;
  slug: string;
  slugAvailable: boolean | null;
  logo_url: string | null;
  color1: string;
  color2: string;
  company_trading_name: string;
  company_legal_name: string;
  email: string;
  sms_number: string;
  contact_first_name: string;
  contact_last_name: string;
  country: string;
  websiteFetched: boolean;
  websiteFetching: boolean;

  // Phase 2 — Package Fit
  initial_plan: PlanKey;
  technical_level: TechLevel | null;
  workflow_volume: WorkflowVolume | null;
  recommended_plan: PlanKey | null;
  final_plan: PlanKey | null;

  // Phase 3 — Add-ons
  billing: BillingFrequency;
  credential_setup: SetupChoice | null;
  has_openrouter: boolean | null;
  openrouter_setup_clicked: boolean;
  ai_agent_setup: SetupChoice | null;
  workflow_setup: SetupChoice | null;
  local_hosting: boolean | null;
  website_hosting: boolean | null;
  detected_cms: string | null;

  // Phase 4 — Business Profile
  business_summary: string;
  team_size: TeamSize | null;
  roles: string[];
  automation_areas: string[];

  // Payment
  payment_status: 'pending' | 'completed' | 'failed' | null;
  transaction_id: string | null;
  payment_error: string | null;

  // Meta
  vitalsync_record_id: string | null;
  completed_at: string | null;
}

export interface CostBreakdown {
  planMonthly: number;
  addOnMonthly: number;
  monthly: number;
  oneTime: number;
}
