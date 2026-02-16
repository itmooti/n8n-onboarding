import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, SelectionCard, CostTracker } from '../components/ui';
import { NavButtons } from '../components/layout';
import { getStepVideo } from '../lib/videos';

export function Step12WebsiteHosting() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(12);

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Website Hosting'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="Want us to host your website too?"
        subtitle="If you're running WordPress, we can host it alongside your n8n instance at no extra cost."
      />

      {/* Free offer banner */}
      <div className="bg-gradient-to-br from-success/[0.05] to-success/[0.02] border border-success/20 rounded-[14px] p-6 mb-5 flex items-center gap-4">
        <span className="text-[32px]">&#x1F381;</span>
        <div>
          <div className="font-bold text-green-800 text-base">
            No extra cost
          </div>
          <div className="text-gray-500 text-[13px]">
            WordPress sites hosted free with any plan.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <SelectionCard
          selected={data.website_hosting === true}
          onClick={() => update({ website_hosting: true })}
          icon={<span>&#x2705;</span>}
          title="Yes, I'm interested!"
          subtitle={
            data.website_url
              ? `We'll check ${data.website_url}`
              : "We'll check your site's platform."
          }
        />
        <SelectionCard
          selected={data.website_hosting === false}
          onClick={() => update({ website_hosting: false })}
          icon={<span>&#x23ED;&#xFE0F;</span>}
          title="No thanks"
          subtitle="I'll keep my current hosting."
        />
      </div>

      {data.website_hosting === true && data.detected_cms === 'WordPress' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
          <p className="m-0 text-sm text-green-800">
            &#x2705; <strong>Great news!</strong> Your site appears to be
            WordPress — we can host it for you. We'll arrange the migration
            after setup.
          </p>
        </div>
      )}

      <CostTracker />

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={data.website_hosting === null}
      />
    </SplitLayout>
  );
}
