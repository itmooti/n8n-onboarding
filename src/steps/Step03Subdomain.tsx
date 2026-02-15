import { useRef, useCallback, useEffect } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, Input } from '../components/ui';
import { NavButtons } from '../components/layout';
import { Check, X, Loader2 } from 'lucide-react';
import { checkSlugAvailability } from '../lib/api';
import { getStepVideo } from '../lib/videos';

export function Step03Subdomain() {
  const video = getStepVideo(3);
  const { data, update, next, prev } = useOnboardingStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runCheck = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      update({ slugAvailable: null });
      return;
    }

    update({ slugAvailable: null }); // null = checking state

    const available = await checkSlugAvailability(slug);
    // Only update if the slug hasn't changed during the check
    const currentSlug = useOnboardingStore.getState().data.slug;
    if (currentSlug === slug) {
      update({ slugAvailable: available });
    }
  }, [update]);

  const debouncedCheck = useCallback((slug: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (slug.length < 3) {
      update({ slugAvailable: null });
      return;
    }

    update({ slugAvailable: null }); // show checking state immediately

    debounceRef.current = setTimeout(() => {
      runCheck(slug);
    }, 500);
  }, [update, runCheck]);

  // Run check on mount if slug is already filled (e.g. from website scraper)
  useEffect(() => {
    if (data.slug.length >= 3 && data.slugAvailable === null) {
      runCheck(data.slug);
    }
    // Also fix stale false state from previous sessions
    if (data.slug.length >= 3 && data.slugAvailable === false) {
      runCheck(data.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSlugChange = (v: string) => {
    const cleaned = v.toLowerCase().replace(/[^a-z0-9-]/g, '');
    update({ slug: cleaned });
    debouncedCheck(cleaned);
  };

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Your Workspace URL'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="Pick your workspace URL"
        subtitle="This is where you'll access your n8n instance."
      />

      {/* URL preview */}
      <div className="bg-dark-bg rounded-[12px] sm:rounded-[14px] px-4 sm:px-5 py-3 sm:py-3.5 mb-5 font-mono text-sm sm:text-base text-white flex items-center border border-accent/15 overflow-hidden">
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

      {data.slug.length > 2 && data.slugAvailable === null && (
        <div className="flex items-center gap-2 text-gray-400 text-[13px] font-semibold mb-4">
          <Loader2 size={16} className="animate-spin" /> Checking availability...
        </div>
      )}

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
        nextDisabled={!data.slug || data.slug.length < 3 || data.slugAvailable !== true}
      />
    </SplitLayout>
  );
}
