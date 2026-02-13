import { useOnboardingStore } from '../store/onboarding';
import { Button } from '../components/ui';
import { PLANS, BOOKING_URL } from '../lib/constants';
import { calculateCosts, getActivePlan } from '../lib/costs';

export function Step16Confirmation() {
  const { data } = useOnboardingStore();

  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const costs = calculateCosts(data);
  const needsBooking =
    data.credential_setup === 'assisted' ||
    data.ai_agent_setup === 'assisted' ||
    data.workflow_setup === 'assisted';

  const handleCTA = () => {
    if (needsBooking) {
      window.location.href = BOOKING_URL;
    } else {
      // Redirect to thank you / dashboard
      window.location.href = BOOKING_URL;
    }
  };

  return (
    <div className="text-center py-5">
      <div className="text-[64px] mb-4">&#x1F389;</div>

      <h2 className="text-[32px] font-extrabold text-navy m-0 font-heading leading-[1.15]">
        {needsBooking
          ? "You're all set! Let's book your first session."
          : 'Welcome to Awesomate!'}
      </h2>

      <p className="text-gray-500 text-base mt-3 leading-relaxed max-w-[480px] mx-auto">
        {needsBooking
          ? `Click below to choose a time that works for you. We'll send a confirmation to ${data.email}.`
          : `Your n8n instance is being provisioned at ${data.slug}.awesomate.io — you'll receive an email when it's ready (usually within the hour).`}
      </p>

      {/* Summary card */}
      <div className="bg-white border-2 border-gray-border rounded-2xl p-6 max-w-[400px] mx-auto mt-7 text-left">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Plan</span>
          <span className="font-bold text-sm text-navy">{plan.name}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Monthly</span>
          <span className="font-bold text-sm text-navy">
            AU${costs.monthly}/mo
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Workspace</span>
          <span className="font-bold text-sm text-accent font-mono">
            {data.slug}.awesomate.io
          </span>
        </div>
        {costs.oneTime > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">One-time</span>
            <span className="font-bold text-sm text-navy">
              AU${costs.oneTime.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button onClick={handleCTA} className="text-[16px] px-12 py-4">
          {needsBooking ? 'Book My Session' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  );
}
