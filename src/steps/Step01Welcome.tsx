import { useOnboardingStore } from '../store/onboarding';
import { useWebsiteScraper } from '../hooks/useWebsiteScraper';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, Input, Button } from '../components/ui';
import { getStepVideo } from '../lib/videos';

export function Step01Welcome() {
  const video = getStepVideo(1);
  const { data, update, next } = useOnboardingStore();
  const { scrape, loading, error } = useWebsiteScraper();

  const handleFetch = async () => {
    if (!data.website_url) return;

    // Ensure URL has protocol
    let url = data.website_url;
    if (!url.startsWith('http')) {
      url = `https://${url}`;
      update({ website_url: url });
    }

    update({ websiteFetching: true });

    const result = await scrape(url);

    if (result) {
      const domain = data.website_url
        .replace(/https?:\/\//, '')
        .replace(/www\./, '')
        .split('/')[0]
        .split('.')[0];

      update({
        company_trading_name: result.company_name || '',
        email: result.email || '',
        slug: domain.toLowerCase(),
        slugAvailable: null, // Will be checked on Step 3
        color1: result.color1 || '#e9484d',
        color2: result.color2 || '#0f1128',
        logo_url: result.logo_url || null,
        business_summary: result.summary || '',
        detected_cms: result.cms || null,
        country: result.country || 'Australia',
        websiteFetched: true,
        websiteFetching: false,
      });
      next();
    } else {
      update({ websiteFetching: false });
    }
  };

  const handleSkip = () => {
    update({ websiteFetched: false });
    next();
  };

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'Welcome to Awesomate'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="Let's start with your website"
        subtitle="We'll use this to auto-fill your business details so you don't have to type everything out."
      />
      <Input
        label="Website URL"
        value={data.website_url}
        onChange={(v) => update({ website_url: v })}
        placeholder="https://yourbusiness.com"
      />
      <div className="flex gap-3 mt-2">
        <Button
          onClick={handleFetch}
          disabled={loading || data.websiteFetching || !data.website_url}
        >
          {loading || data.websiteFetching ? 'Fetching...' : 'Fetch My Details'}
        </Button>
      </div>
      {error && (
        <p className="text-amber-600 text-[13px] mt-2 font-medium">
          Couldn't fully scrape that site — we'll fill in what we can. You can edit everything on the next step.
        </p>
      )}
      <button
        onClick={handleSkip}
        className="mt-4 text-accent text-[13px] font-semibold font-sans underline underline-offset-[3px] bg-transparent border-none cursor-pointer hover:text-accent-orange transition-colors"
      >
        I don't have a website yet
      </button>
    </SplitLayout>
  );
}
