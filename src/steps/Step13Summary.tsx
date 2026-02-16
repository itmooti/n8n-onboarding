import { useOnboardingStore } from '../store/onboarding';
import { StepHeading } from '../components/ui';
import { NavButtons } from '../components/layout';
import { PLANS } from '../lib/constants';
import { calculateCosts, getActivePlan, isPaidAddon } from '../lib/costs';
import {
  getEffectivePrice,
  getEffectiveYearlyTotal,
  hasAffiliateDiscount,
  getStandardPrice,
  getStandardYearlyTotal,
} from '../lib/affiliates';

export function Step13Summary() {
  const { data, update, next, prev } = useOnboardingStore();

  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const costs = calculateCosts(data);
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

  const hostingRecurring = isYearly ? 500 : 50;

  // Recurring total (plan + hosting if applicable)
  let recurringTotal = planPrice;
  if (data.local_hosting) recurringTotal += hostingRecurring;

  const addons: { label: string; cost: string }[] = [];

  if (data.credential_setup === 'assisted') {
    addons.push({
      label: 'Credential setup session',
      cost: isPaidAddon(activePlan) ? 'AU$100' : 'Included \u2713',
    });
  }
  if (data.ai_agent_setup === 'assisted') {
    addons.push({
      label: 'AI agent setup session',
      cost: isPaidAddon(activePlan) ? 'AU$100' : 'Included \u2713',
    });
  }
  if (data.workflow_setup === 'assisted') {
    addons.push({
      label: 'Workflow setup session',
      cost: isPaidAddon(activePlan) ? 'AU$100' : 'Included \u2713',
    });
  }
  if (data.local_hosting) {
    addons.push({ label: 'Local hosting setup', cost: 'AU$1,000' });
    addons.push({ label: `Local hosting`, cost: `AU$${hostingRecurring}${period}` });
  }
  if (data.website_hosting) {
    addons.push({ label: 'WordPress hosting', cost: 'Free \u2713' });
  }

  return (
    <>
      <StepHeading
        title="Your Setup Summary"
        subtitle="Review everything before we move to the final step."
      />

      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] overflow-hidden">
        {/* Plan header */}
        <div
          className="px-4 sm:px-7 py-4 sm:py-6 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
          }}
        >
          <div>
            <div className="text-white/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em]">
              YOUR PLAN
            </div>
            <div className="text-white text-[18px] sm:text-[22px] font-extrabold font-heading">
              {plan.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[22px] sm:text-[28px] font-extrabold font-heading accent-gradient-text">
              {showStrike && (
                <span
                  className="text-white/30 line-through text-[0.6em] mr-2"
                  style={{ WebkitTextFillColor: 'rgba(255,255,255,0.3)' }}
                >
                  AU${standardPlanPrice.toLocaleString()}
                </span>
              )}
              AU${planPrice.toLocaleString()}
            </div>
            <div className="text-white/40 text-xs">{isYearly ? '/year' : '/month'}</div>
          </div>
        </div>

        <div className="px-4 sm:px-7 py-4 sm:py-5">
          {/* Billing toggle */}
          <div className="flex gap-2 mb-5">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => update({ billing: b })}
                className={`px-3 sm:px-5 py-2 rounded-[8px] border-none cursor-pointer font-bold text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.05em] transition-all ${
                  data.billing === b
                    ? 'bg-navy text-white'
                    : 'bg-gray-bg text-gray-500 hover:bg-gray-100'
                }`}
              >
                {b === 'monthly' ? 'Monthly' : 'Yearly (2 mo free)'}
              </button>
            ))}
          </div>

          {/* Add-ons list */}
          {addons.length > 0 && (
            <>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">
                ADD-ONS
              </div>
              {addons.map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2.5 border-b border-gray-border last:border-0"
                >
                  <span className="text-sm text-navy">{a.label}</span>
                  <span
                    className={`text-sm font-bold ${
                      a.cost.includes('Included') || a.cost.includes('Free')
                        ? 'text-success'
                        : 'text-navy'
                    }`}
                  >
                    {a.cost}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Totals */}
          <div className="mt-5 p-4 bg-gray-bg rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-500 text-sm">
                {isYearly ? 'Annual total' : 'Monthly total'}
              </span>
              <span className="font-extrabold text-navy text-xl font-heading">
                AU${recurringTotal.toLocaleString()}{period}
              </span>
            </div>
            {costs.oneTime > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-500 text-sm">
                  One-time costs
                </span>
                <span className="font-extrabold text-accent text-xl font-heading">
                  AU${costs.oneTime.toLocaleString()}
                </span>
              </div>
            )}
            <div className="text-[10px] text-gray-400 text-right mt-2">
              All prices include GST
            </div>
          </div>
        </div>
      </div>

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel="Continue to Business Profile"
      />
    </>
  );
}
