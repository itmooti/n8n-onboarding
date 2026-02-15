import { useOnboardingStore } from '../store/onboarding';
import { StepHeading } from '../components/ui';
import { NavButtons } from '../components/layout';
import { PLANS } from '../lib/constants';

export function Step06PlanRecommendation() {
  const { data, update, next, prev } = useOnboardingStore();

  const rec = PLANS[data.recommended_plan || 'pro'];
  const initial = PLANS[data.initial_plan];
  const isDifferent = data.recommended_plan !== data.initial_plan;

  return (
    <>
      <StepHeading title="Your Recommended Plan" />

      {/* Recommended plan card */}
      <div className="relative bg-gradient-to-br from-accent/[0.04] to-accent-orange/[0.02] border-2 border-accent rounded-[16px] sm:rounded-[20px] p-5 sm:p-8 mb-5">
        <div className="absolute -top-3 left-4 sm:left-6 bg-gradient-to-br from-accent to-accent-orange text-white font-bold text-[10px] sm:text-[11px] px-3 py-1 rounded-lg tracking-[0.08em] uppercase">
          RECOMMENDED FOR YOU
        </div>
        <h3 className="text-[22px] sm:text-[28px] font-extrabold text-navy m-0 font-heading">
          {rec.name}
        </h3>
        <div className="text-3xl sm:text-4xl font-extrabold mt-2 font-heading accent-gradient-text">
          AU${rec.price}
          <span className="text-base text-gray-500 font-medium" style={{ WebkitTextFillColor: '#6b7280' }}>/mo</span>
        </div>
        {isDifferent && (
          <p className="text-gray-500 text-[13px] leading-relaxed mt-3">
            You originally selected <strong>{initial.name}</strong> — based on
            your answers, we think <strong>{rec.name}</strong> is a better fit
            for your needs.
          </p>
        )}
      </div>

      {isDifferent && (
        <button
          onClick={() => update({ final_plan: data.initial_plan })}
          className="bg-transparent border-none text-gray-500 cursor-pointer text-[13px] underline mb-4 font-sans hover:text-accent transition-colors"
        >
          Keep my original choice ({initial.name}) instead
        </button>
      )}

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel={`Continue with ${rec.name}`}
      />
    </>
  );
}
