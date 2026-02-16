import type { PlanKey } from '../types/onboarding';
import { PLANS } from './constants';

export interface AffiliatePlanPricing {
  /** Monthly price in AUD, or null for "Inquire" (no payment, special flow) */
  price: number | null;
  /** Yearly total (monthly × 10), or null for "Inquire" */
  yearlyTotal: number | null;
}

export interface AffiliateConfig {
  code: string;
  name: string;
  /** VitalStats contact ID for last_referrer field */
  referrerId: number;
  /** Per-plan pricing overrides. Plans not listed use standard pricing. */
  plans: Partial<Record<PlanKey, AffiliatePlanPricing>>;
}

const AFFILIATES: Record<string, AffiliateConfig> = {
  bb: {
    code: 'bb',
    name: 'Business Blueprint',
    referrerId: 6934,
    plans: {
      essentials: { price: 50, yearlyTotal: 500 },
      'support-plus': { price: 150, yearlyTotal: 1500 },
      pro: { price: 350, yearlyTotal: 3500 },
      embedded: { price: null, yearlyTotal: null },
    },
  },
};

/** Look up affiliate config by code. Returns undefined for unknown codes. */
export function getAffiliateConfig(code: string | null): AffiliateConfig | undefined {
  if (!code) return undefined;
  return AFFILIATES[code.toLowerCase()];
}

/** Get the effective monthly price for a plan, considering affiliate discount. Returns null for "Inquire" plans. */
export function getEffectivePrice(planKey: PlanKey, affiliateCode: string | null): number | null {
  const aff = getAffiliateConfig(affiliateCode);
  const override = aff?.plans[planKey];
  if (override) return override.price;
  return PLANS[planKey].price;
}

/** Get the effective yearly total (monthly × 10 pattern). Returns null for "Inquire" plans. */
export function getEffectiveYearlyTotal(planKey: PlanKey, affiliateCode: string | null): number | null {
  const aff = getAffiliateConfig(affiliateCode);
  const override = aff?.plans[planKey];
  if (override) return override.yearlyTotal;
  return PLANS[planKey].price * 10;
}

/** Get the effective per-month display price for yearly billing. Returns null for "Inquire" plans. */
export function getEffectiveYearlyPrice(planKey: PlanKey, affiliateCode: string | null): number | null {
  const total = getEffectiveYearlyTotal(planKey, affiliateCode);
  if (total === null) return null;
  return Math.ceil(total / 12);
}

/** Get the standard (non-discounted) monthly price for strikethrough display. */
export function getStandardPrice(planKey: PlanKey): number {
  return PLANS[planKey].price;
}

/** Get the standard yearly total for strikethrough display. */
export function getStandardYearlyTotal(planKey: PlanKey): number {
  return PLANS[planKey].price * 10;
}

/** Check if this affiliate+plan combination is an "Inquire" scenario (null price). */
export function isInquirePlan(planKey: PlanKey, affiliateCode: string | null): boolean {
  const aff = getAffiliateConfig(affiliateCode);
  const override = aff?.plans[planKey];
  if (!override) return false;
  return override.price === null;
}

/** Check if this affiliate has a discount for a given plan (for strikethrough display). */
export function hasAffiliateDiscount(planKey: PlanKey, affiliateCode: string | null): boolean {
  const aff = getAffiliateConfig(affiliateCode);
  const override = aff?.plans[planKey];
  if (!override || override.price === null) return false;
  return override.price < PLANS[planKey].price;
}
