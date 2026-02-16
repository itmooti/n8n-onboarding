import type { OnboardingData, PlanKey, CostBreakdown } from '../types/onboarding';
import { getEffectivePrice, getEffectiveYearlyPrice } from './affiliates';

export function isPaidAddon(planKey: PlanKey): boolean {
  return planKey === 'essentials' || planKey === 'support-plus';
}

export function getActivePlan(data: OnboardingData): PlanKey {
  return data.final_plan || data.recommended_plan || data.initial_plan;
}

export function calculateCosts(data: OnboardingData): CostBreakdown {
  const activePlan = getActivePlan(data);
  const affCode = data.affiliate_code;

  const monthlyPrice = getEffectivePrice(activePlan, affCode) ?? 0;
  const yearlyMonthlyPrice = getEffectiveYearlyPrice(activePlan, affCode) ?? 0;
  const planMonthly = data.billing === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  let oneTime = 0;
  let addOnMonthly = 0;

  if (data.credential_setup === 'assisted' && isPaidAddon(activePlan)) oneTime += 100;
  if (data.ai_agent_setup === 'assisted' && isPaidAddon(activePlan)) oneTime += 100;
  if (data.workflow_setup === 'assisted' && isPaidAddon(activePlan)) oneTime += 100;
  if (data.local_hosting === true) {
    oneTime += 1000;
    addOnMonthly += 50;
  }

  return {
    planMonthly,
    addOnMonthly,
    monthly: planMonthly + addOnMonthly,
    oneTime,
  };
}
