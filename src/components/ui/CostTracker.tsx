import { useOnboardingStore } from '../../store/onboarding';
import { getActivePlan, isPaidAddon } from '../../lib/costs';
import { PLANS } from '../../lib/constants';
import {
  getEffectivePrice,
  getEffectiveYearlyTotal,
  hasAffiliateDiscount,
  getStandardPrice,
  getStandardYearlyTotal,
} from '../../lib/affiliates';

interface LineItem {
  label: string;
  amount: string;
  strikeAmount?: string;
}

export function CostTracker() {
  const { data } = useOnboardingStore();

  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  if (!plan) return null;

  const paid = isPaidAddon(activePlan);
  const isYearly = data.billing === 'yearly';
  const period = isYearly ? '/yr' : '/mo';
  const affCode = data.affiliate_code;

  // Affiliate-aware plan pricing
  const effectiveMonthly = getEffectivePrice(activePlan, affCode) ?? 0;
  const effectiveYearlyTotal = getEffectiveYearlyTotal(activePlan, affCode) ?? 0;
  const planPrice = isYearly ? effectiveYearlyTotal : effectiveMonthly;

  // Strikethrough for discounted plans
  const showStrike = hasAffiliateDiscount(activePlan, affCode);
  const standardMonthly = getStandardPrice(activePlan);
  const standardYearlyTotal = getStandardYearlyTotal(activePlan);
  const standardPlanPrice = isYearly ? standardYearlyTotal : standardMonthly;

  const items: LineItem[] = [];

  // Plan line
  items.push({
    label: `${plan.name} plan`,
    amount: `AU$${planPrice.toLocaleString()}${period}`,
    strikeAmount: showStrike ? `AU$${standardPlanPrice.toLocaleString()}${period}` : undefined,
  });

  // Assisted setup add-ons (only show if selected)
  if (data.credential_setup === 'assisted') {
    items.push({
      label: 'Credential setup',
      amount: paid ? 'AU$100' : 'Included',
    });
  }
  if (data.ai_agent_setup === 'assisted') {
    items.push({
      label: 'AI agent setup',
      amount: paid ? 'AU$100' : 'Included',
    });
  }
  if (data.workflow_setup === 'assisted') {
    items.push({
      label: 'Workflow setup',
      amount: paid ? 'AU$100' : 'Included',
    });
  }

  // Local hosting
  if (data.local_hosting === true) {
    items.push({ label: 'Local hosting setup', amount: 'AU$1,000' });
    const hostingRecurring = isYearly ? 500 : 50;
    items.push({ label: 'Local hosting', amount: `AU$${hostingRecurring}${period}` });
  }

  // Calculate totals
  let recurringTotal = planPrice;
  let oneTimeTotal = 0;

  if (data.credential_setup === 'assisted' && paid) oneTimeTotal += 100;
  if (data.ai_agent_setup === 'assisted' && paid) oneTimeTotal += 100;
  if (data.workflow_setup === 'assisted' && paid) oneTimeTotal += 100;
  if (data.local_hosting === true) {
    oneTimeTotal += 1000;
    recurringTotal += isYearly ? 500 : 50;
  }

  const hasAddons = items.length > 1;

  return (
    <div className="mt-5 mb-1 rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-200/80">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
          Your Plan
        </span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-[13px]">
            <span className="text-gray-500">{item.label}</span>
            <span className="font-semibold text-navy">
              {item.strikeAmount && (
                <span className="text-gray-400 line-through text-[0.85em] mr-1.5">
                  {item.strikeAmount}
                </span>
              )}
              {item.amount}
            </span>
          </div>
        ))}
      </div>
      {hasAddons && (
        <div className="px-4 py-2.5 border-t border-gray-200/80 flex justify-between gap-4 text-[12px]">
          <span className="text-gray-400 font-medium">
            {isYearly ? 'Annual' : 'Monthly'}:{' '}
            <span className="text-navy font-bold">AU${recurringTotal.toLocaleString()}{period}</span>
          </span>
          {oneTimeTotal > 0 && (
            <span className="text-gray-400 font-medium">
              One-time: <span className="text-navy font-bold">AU${oneTimeTotal.toLocaleString()}</span>
            </span>
          )}
        </div>
      )}
      <div className="px-4 py-1.5 text-[10px] text-gray-300 text-right">
        All prices include GST
      </div>
    </div>
  );
}
