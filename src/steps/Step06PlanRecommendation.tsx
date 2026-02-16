import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading } from '../components/ui';
import { NavButtons } from '../components/layout';
import { PLANS } from '../lib/constants';
import { Check } from 'lucide-react';
import {
  getEffectivePrice,
  hasAffiliateDiscount,
  getStandardPrice,
  isInquirePlan,
} from '../lib/affiliates';
import { getStepVideo } from '../lib/videos';
import type { PlanKey } from '../types/onboarding';

/** Render plan price with optional strikethrough for affiliate discounts */
function PlanPrice({ planKey, affCode, size = 'normal' }: {
  planKey: PlanKey;
  affCode: string | null;
  size?: 'normal' | 'large';
}) {
  const isInquiry = isInquirePlan(planKey, affCode);
  if (isInquiry) {
    const textSize = size === 'large'
      ? 'text-3xl sm:text-4xl'
      : 'text-2xl sm:text-3xl';
    return (
      <div className={`${textSize} font-extrabold mt-1 font-heading accent-gradient-text`}>
        Inquire
      </div>
    );
  }

  const showStrike = hasAffiliateDiscount(planKey, affCode);
  const effectivePrice = getEffectivePrice(planKey, affCode) ?? 0;
  const standardPrice = getStandardPrice(planKey);
  const textSize = size === 'large'
    ? 'text-3xl sm:text-4xl'
    : 'text-2xl sm:text-3xl';
  const suffixSize = size === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={`${textSize} font-extrabold mt-1 font-heading accent-gradient-text`}>
      {showStrike && (
        <span
          className="text-gray-400 line-through text-[0.65em] mr-1.5"
          style={{ WebkitTextFillColor: '#9ca3af' }}
        >
          AU${standardPrice}
        </span>
      )}
      AU${effectivePrice}
      <span className={`${suffixSize} text-gray-500 font-medium`} style={{ WebkitTextFillColor: '#6b7280' }}>/mo</span>
    </div>
  );
}

export function Step06PlanRecommendation() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(6);

  const rec = PLANS[data.recommended_plan || 'pro'];
  const initial = PLANS[data.initial_plan];
  const isDifferent = data.recommended_plan !== data.initial_plan;

  const activePlan = data.final_plan || data.recommended_plan || data.initial_plan;
  const active = PLANS[activePlan];
  const isRecommendedSelected = activePlan === (data.recommended_plan || 'pro');
  const affCode = data.affiliate_code;

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Your Recommended Plan'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading title="Your Recommended Plan" />

      {isDifferent ? (
        <>
          <p className="text-gray-500 text-[13px] leading-relaxed mb-4">
            You selected <strong>{initial.name}</strong> — based on your answers,
            we think <strong>{rec.name}</strong> is a better fit. Choose the plan
            you'd like to continue with.
          </p>

          <div className="flex flex-col gap-3 mb-5">
            {/* Recommended plan card */}
            <div
              onClick={() => update({ final_plan: data.recommended_plan })}
              className={`relative rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 cursor-pointer transition-all duration-300 ${
                isRecommendedSelected
                  ? 'bg-gradient-to-br from-accent/[0.05] to-accent-orange/[0.02] border-2 border-accent shadow-[0_8px_25px_rgba(233,72,77,0.1)]'
                  : 'bg-white border-2 border-gray-border hover:shadow-[0_6px_20px_rgba(15,17,40,0.06)]'
              }`}
            >
              <div className="absolute -top-3 left-4 sm:left-6 bg-gradient-to-br from-accent to-accent-orange text-white font-bold text-[10px] sm:text-[11px] px-3 py-1 rounded-lg tracking-[0.08em] uppercase">
                RECOMMENDED
              </div>
              {isRecommendedSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
              <h3 className="text-[20px] sm:text-[24px] font-extrabold text-navy m-0 font-heading">
                {rec.name}
              </h3>
              <PlanPrice planKey={rec.key} affCode={affCode} />
            </div>

            {/* Original plan card */}
            <div
              onClick={() => update({ final_plan: data.initial_plan })}
              className={`relative rounded-[16px] sm:rounded-[20px] p-5 sm:p-6 cursor-pointer transition-all duration-300 ${
                !isRecommendedSelected
                  ? 'bg-gradient-to-br from-accent/[0.05] to-accent-orange/[0.02] border-2 border-accent shadow-[0_8px_25px_rgba(233,72,77,0.1)]'
                  : 'bg-white border-2 border-gray-border hover:shadow-[0_6px_20px_rgba(15,17,40,0.06)]'
              }`}
            >
              <div className="absolute -top-3 left-4 sm:left-6 bg-navy/80 text-white font-bold text-[10px] sm:text-[11px] px-3 py-1 rounded-lg tracking-[0.08em] uppercase">
                YOUR ORIGINAL CHOICE
              </div>
              {!isRecommendedSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
              <h3 className="text-[20px] sm:text-[24px] font-extrabold text-navy m-0 font-heading">
                {initial.name}
              </h3>
              <PlanPrice planKey={initial.key} affCode={affCode} />
            </div>
          </div>
        </>
      ) : (
        /* Same plan — just confirm */
        <div className="relative bg-gradient-to-br from-accent/[0.04] to-accent-orange/[0.02] border-2 border-accent rounded-[16px] sm:rounded-[20px] p-5 sm:p-8 mb-5">
          <div className="absolute -top-3 left-4 sm:left-6 bg-gradient-to-br from-accent to-accent-orange text-white font-bold text-[10px] sm:text-[11px] px-3 py-1 rounded-lg tracking-[0.08em] uppercase">
            GREAT CHOICE
          </div>
          <h3 className="text-[22px] sm:text-[28px] font-extrabold text-navy m-0 font-heading">
            {rec.name}
          </h3>
          <PlanPrice planKey={rec.key} affCode={affCode} size="large" />
          <p className="text-gray-500 text-[13px] leading-relaxed mt-3">
            Based on your answers, this plan is a perfect fit for your needs.
          </p>
        </div>
      )}

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel={`Continue with ${active.name}`}
      />
    </SplitLayout>
  );
}
