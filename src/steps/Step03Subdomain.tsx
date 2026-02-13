import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, Input } from '../components/ui';
import { NavButtons } from '../components/layout';
import { Check, X } from 'lucide-react';

export function Step03Subdomain() {
  const { data, update, next, prev } = useOnboardingStore();

  const handleSlugChange = (v: string) => {
    const cleaned = v.toLowerCase().replace(/[^a-z0-9-]/g, '');
    update({
      slug: cleaned,
      slugAvailable: cleaned.length > 2 ? true : null, // Will be replaced with real check
    });
  };

  return (
    <SplitLayout
      video={<VideoPlayer title="Your Workspace URL" duration="0:12" />}
    >
      <StepHeading
        title="Pick your workspace URL"
        subtitle="This is where you'll access your n8n instance."
      />

      {/* URL preview */}
      <div className="bg-dark-bg rounded-[14px] px-5 py-3.5 mb-5 font-mono text-base text-white flex items-center border border-accent/15">
        <span className="text-accent font-bold">
          {data.slug || 'yourname'}
        </span>
        <span className="text-white/40">.awesomate.io</span>
      </div>

      <Input
        label="Subdomain"
        value={data.slug}
        onChange={handleSlugChange}
        placeholder="yourname"
      />

      {data.slugAvailable === true && data.slug.length > 2 && (
        <div className="flex items-center gap-2 text-success text-[13px] font-semibold mb-4">
          <Check size={16} /> This one's yours!
        </div>
      )}

      {data.slugAvailable === false && (
        <div className="flex items-center gap-2 text-red-500 text-[13px] font-semibold mb-4">
          <X size={16} /> Already taken — try another
        </div>
      )}

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel="Lock It In"
        nextDisabled={!data.slug || data.slug.length < 3 || data.slugAvailable === false}
      />
    </SplitLayout>
  );
}
