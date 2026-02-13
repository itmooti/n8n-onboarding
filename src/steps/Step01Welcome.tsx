import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, Input, Button } from '../components/ui';

export function Step01Welcome() {
  const { data, update, next } = useOnboardingStore();

  const handleFetch = () => {
    if (data.website_url) {
      update({ websiteFetching: true });
      // Simulate website fetch for now — will be replaced with n8n webhook
      const domain = data.website_url
        .replace(/https?:\/\//, '')
        .replace(/www\./, '')
        .split('/')[0]
        .split('.')[0];
      const name = domain.charAt(0).toUpperCase() + domain.slice(1);
      setTimeout(() => {
        update({
          company_trading_name: name + ' Co',
          email: 'hello@' + domain + '.com',
          slug: domain.toLowerCase(),
          slugAvailable: true,
          color1: '#e9484d',
          color2: '#0f1128',
          business_summary: `${name} Co is a business that provides professional services. Based on their website, they appear to offer solutions to their customers with a focus on quality and reliability.`,
          websiteFetched: true,
          websiteFetching: false,
        });
        next();
      }, 1500);
    }
  };

  const handleSkip = () => {
    update({ websiteFetched: false });
    next();
  };

  return (
    <SplitLayout
      video={<VideoPlayer title="Welcome to Awesomate" duration="0:15" />}
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
          disabled={data.websiteFetching}
        >
          {data.websiteFetching ? 'Fetching...' : 'Fetch My Details'}
        </Button>
      </div>
      <button
        onClick={handleSkip}
        className="mt-4 text-accent text-[13px] font-semibold font-sans underline underline-offset-[3px] bg-transparent border-none cursor-pointer hover:text-accent-orange transition-colors"
      >
        I don't have a website yet
      </button>
    </SplitLayout>
  );
}
