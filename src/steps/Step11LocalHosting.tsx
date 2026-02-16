import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, SelectionCard, CostTracker } from '../components/ui';
import { NavButtons } from '../components/layout';
import { getStepVideo } from '../lib/videos';

export function Step11LocalHosting() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(11);

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Data Sovereignty'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title={`Do you need hosting in ${data.country || 'your country'}?`}
        subtitle="By default, your instance runs on our secure cloud. For compliance or preference, we can host locally."
      />

      <div className="flex flex-col gap-3.5">
        <SelectionCard
          selected={data.local_hosting === false}
          onClick={() => update({ local_hosting: false })}
          icon={<span>&#x2601;&#xFE0F;</span>}
          title="Standard hosting is fine"
          subtitle="Secure cloud infrastructure — great for most businesses."
        />
        <SelectionCard
          selected={data.local_hosting === true}
          onClick={() => update({ local_hosting: true })}
          icon={<span>&#x1F3E0;</span>}
          title={`Yes, host in ${data.country || 'my country'}`}
          subtitle="Dedicated local instance for compliance needs."
        />
      </div>

      {data.local_hosting === true && (
        <div className="mt-4 p-5 bg-accent/[0.03] border border-accent/15 rounded-xl">
          <p className="m-0 text-sm text-navy leading-relaxed">
            <strong>Local hosting:</strong> AU$1,000 one-time setup + AU$50/month
            additional. Includes dedicated infrastructure provisioning and
            ongoing management.
          </p>
        </div>
      )}

      <CostTracker />

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={data.local_hosting === null}
      />
    </SplitLayout>
  );
}
