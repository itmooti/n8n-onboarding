import { useOnboardingStore } from '../store/onboarding';
import { StepHeading, SelectionCard } from '../components/ui';
import { NavButtons } from '../components/layout';

export function Step05WorkflowVolume() {
  const { data, update, next, prev } = useOnboardingStore();

  return (
    <>
      <StepHeading
        title="How many automations are you thinking?"
        subtitle="Give us a rough idea so we can size your plan right."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <SelectionCard
          selected={data.workflow_volume === 'starter'}
          onClick={() => update({ workflow_volume: 'starter' })}
          icon={<span>&#x1F331;</span>}
          title="Just Getting Started"
          subtitle="1-3 simple workflows to begin with."
        />
        <SelectionCard
          selected={data.workflow_volume === 'growing'}
          onClick={() => update({ workflow_volume: 'growing' })}
          icon={<span>&#x1F680;</span>}
          title="Growing Fast"
          subtitle="5-10 workflows, some complex logic."
        />
        <SelectionCard
          selected={data.workflow_volume === 'full-engine'}
          onClick={() => update({ workflow_volume: 'full-engine' })}
          icon={<span>&#x26A1;</span>}
          title="Full Automation Engine"
          subtitle="10+ workflows, AI agents, multi-step."
        />
        <SelectionCard
          selected={data.workflow_volume === 'unsure'}
          onClick={() => update({ workflow_volume: 'unsure' })}
          icon={<span>&#x1F914;</span>}
          title="I'm Not Sure Yet"
          subtitle="I need some guidance on what's possible."
        />
      </div>

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel="See My Recommendation"
        nextDisabled={!data.workflow_volume}
      />
    </>
  );
}
