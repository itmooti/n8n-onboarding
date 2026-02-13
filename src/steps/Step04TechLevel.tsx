import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, SelectionCard } from '../components/ui';
import { NavButtons } from '../components/layout';
import { getStepVideo } from '../lib/videos';

export function Step04TechLevel() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(4);

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Your Comfort Level'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="How technical are you?"
        subtitle="No wrong answer — this helps us match you with the right support level."
      />

      <div className="flex flex-col gap-3.5">
        <SelectionCard
          selected={data.technical_level === 'self-sufficient'}
          onClick={() => update({ technical_level: 'self-sufficient' })}
          icon={<span>&#x1F6E0;&#xFE0F;</span>}
          title="I've Got This"
          subtitle="I'm technical (or have a tech team) and comfortable managing n8n myself."
        />
        <SelectionCard
          selected={data.technical_level === 'some-help'}
          onClick={() => update({ technical_level: 'some-help' })}
          icon={<span>&#x1F91D;</span>}
          title="Some Help Please"
          subtitle="I can handle most things but want expert backup when I get stuck."
        />
        <SelectionCard
          selected={data.technical_level === 'full-service'}
          onClick={() => update({ technical_level: 'full-service' })}
          icon={<span>&#x2728;</span>}
          title="Handle It For Me"
          subtitle="I'm not technical and want the Awesomate team to manage everything."
        />
      </div>

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={!data.technical_level}
      />
    </SplitLayout>
  );
}
