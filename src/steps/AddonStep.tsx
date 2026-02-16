import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, SelectionCard, CostTracker } from '../components/ui';
import { NavButtons } from '../components/layout';
import type { SetupChoice, PlanKey } from '../types/onboarding';
import { getActivePlan } from '../lib/costs';
import { getStepVideo } from '../lib/videos';

interface AddonStepProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  videoTitle: string;
  videoDuration: string;
  selfLabel: string;
  selfSubtitle: string;
  assistedLabel: string;
  assistedSubtitle: string;
  field: 'credential_setup' | 'ai_agent_setup' | 'workflow_setup';
}

export function AddonStep({
  stepNumber,
  title,
  subtitle,
  videoTitle,
  videoDuration,
  selfLabel,
  selfSubtitle,
  assistedLabel,
  assistedSubtitle,
  field,
}: AddonStepProps) {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(stepNumber);

  const activePlan: PlanKey = getActivePlan(data);
  const isFree = activePlan === 'pro' || activePlan === 'embedded';
  const currentValue = data[field] as SetupChoice | null;

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || videoTitle} duration={video?.duration || videoDuration} src={video?.src} />}
    >
      <StepHeading title={title} subtitle={subtitle} />

      <div className="flex flex-col gap-3.5">
        <SelectionCard
          selected={currentValue === 'self'}
          onClick={() => update({ [field]: 'self' })}
          icon={<span>&#x1F4AA;</span>}
          title={selfLabel}
          subtitle={selfSubtitle}
        />
        <SelectionCard
          selected={currentValue === 'assisted'}
          onClick={() => update({ [field]: 'assisted' })}
          icon={<span>&#x1F3AF;</span>}
          title={assistedLabel}
          subtitle={assistedSubtitle}
          badge={isFree ? 'FREE' : '+ AU$100'}
        />
      </div>

      <CostTracker />

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={!currentValue}
      />
    </SplitLayout>
  );
}
