import type { OnboardingData, PlanKey } from '../types/onboarding';
import { PLANS } from './constants';
import { getActivePlan, isPaidAddon } from './costs';

/** Ontraport product IDs */
export const ONTRAPORT_PRODUCTS: Record<string, number> = {
  // Plan subscriptions
  essentials: 171,
  'support-plus': 172,
  pro: 173,
  embedded: 174,
  // One-time setup add-ons
  credential_setup: 175,
  ai_agent_setup: 176,
  workflow_setup: 177,
  local_hosting_setup: 178,
  // Recurring add-ons
  local_hosting_monthly: 179,
};

/** Annual totals for yearly billing (yearlyPrice × 12) */
const YEARLY_TOTALS: Record<PlanKey, number> = {
  essentials: 756,
  'support-plus': 1500,
  pro: 3696,
  embedded: 35004,
};

export interface OntraportProduct {
  id: number;
  quantity: number;
  total: number;
  shipping: boolean;
  tax: boolean;
  taxable: boolean;
  type: 'subscription' | 'one_time';
  price: Array<{ price: number; unit: 'month' | 'year'; id: number }>;
}

function makeSubscription(id: number, price: number, unit: 'month' | 'year'): OntraportProduct {
  return {
    id,
    quantity: 1,
    total: price,
    shipping: false,
    tax: false,
    taxable: false,
    type: 'subscription',
    price: [{ price, unit, id }],
  };
}

function makeOneTime(id: number, price: number): OntraportProduct {
  return {
    id,
    quantity: 1,
    total: price,
    shipping: false,
    tax: false,
    taxable: false,
    type: 'one_time',
    price: [{ price, unit: 'month', id }],
  };
}

/**
 * Build the Ontraport products array from user selections.
 * Used in the payment webhook payload.
 */
export function buildProductsArray(data: OnboardingData): OntraportProduct[] {
  const products: OntraportProduct[] = [];
  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const isYearly = data.billing === 'yearly';

  // Plan subscription
  const planPrice = isYearly ? YEARLY_TOTALS[activePlan] : plan.price;
  const planUnit = isYearly ? 'year' : 'month';
  products.push(makeSubscription(ONTRAPORT_PRODUCTS[activePlan], planPrice, planUnit));

  // One-time setup add-ons (only for lower-tier plans)
  if (data.credential_setup === 'assisted' && isPaidAddon(activePlan)) {
    products.push(makeOneTime(ONTRAPORT_PRODUCTS.credential_setup, 100));
  }
  if (data.ai_agent_setup === 'assisted' && isPaidAddon(activePlan)) {
    products.push(makeOneTime(ONTRAPORT_PRODUCTS.ai_agent_setup, 100));
  }
  if (data.workflow_setup === 'assisted' && isPaidAddon(activePlan)) {
    products.push(makeOneTime(ONTRAPORT_PRODUCTS.workflow_setup, 100));
  }

  // Local hosting
  if (data.local_hosting) {
    products.push(makeOneTime(ONTRAPORT_PRODUCTS.local_hosting_setup, 1000));
    products.push(makeSubscription(ONTRAPORT_PRODUCTS.local_hosting_monthly, 50, 'month'));
  }

  return products;
}

/** Human-readable line item for the order summary UI */
export interface OrderLineItem {
  label: string;
  amount: number;
  recurring: boolean;
  period?: 'month' | 'year';
}

/**
 * Build display-friendly line items for the checkout summary.
 */
export function buildOrderLineItems(data: OnboardingData): OrderLineItem[] {
  const items: OrderLineItem[] = [];
  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const isYearly = data.billing === 'yearly';

  // Plan
  items.push({
    label: `${plan.name} Plan`,
    amount: isYearly ? YEARLY_TOTALS[activePlan] : plan.price,
    recurring: true,
    period: isYearly ? 'year' : 'month',
  });

  // One-time add-ons
  if (data.credential_setup === 'assisted' && isPaidAddon(activePlan)) {
    items.push({ label: 'Credential Setup', amount: 100, recurring: false });
  }
  if (data.ai_agent_setup === 'assisted' && isPaidAddon(activePlan)) {
    items.push({ label: 'AI Agent Setup', amount: 100, recurring: false });
  }
  if (data.workflow_setup === 'assisted' && isPaidAddon(activePlan)) {
    items.push({ label: 'Workflow Setup', amount: 100, recurring: false });
  }
  if (data.local_hosting) {
    items.push({ label: 'Local Hosting Setup', amount: 1000, recurring: false });
    items.push({ label: 'Local Hosting', amount: 50, recurring: true, period: 'month' });
  }

  return items;
}

/**
 * Calculate checkout totals for the payment summary.
 */
export function calculateCheckoutTotals(data: OnboardingData) {
  const items = buildOrderLineItems(data);

  // Due today = first period of all subscriptions + all one-time costs
  const dueToday = items.reduce((sum, item) => sum + item.amount, 0);

  // Ongoing recurring = just the subscriptions
  const recurring = items
    .filter((i) => i.recurring)
    .reduce((sum, item) => sum + item.amount, 0);

  const period = data.billing === 'yearly' ? 'year' : 'month';

  return { dueToday, recurring, period };
}
