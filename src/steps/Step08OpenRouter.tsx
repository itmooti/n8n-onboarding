import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, SelectionCard } from '../components/ui';
import { NavButtons } from '../components/layout';
import { getStepVideo } from '../lib/videos';

export function Step08OpenRouter() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(8);

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'What is OpenRouter?'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="Do you have an OpenRouter account?"
        subtitle="OpenRouter is like a universal key for AI — it gives your n8n workflows access to ChatGPT, Claude, Gemini and more through one account. Essential for any AI-powered automation."
      />

      <div className="flex flex-col gap-3.5">
        <SelectionCard
          selected={data.has_openrouter === true}
          onClick={() => update({ has_openrouter: true })}
          icon={<span>&#x2705;</span>}
          title="Yes, I'm all set"
          subtitle="I already have an OpenRouter account."
        />
        <SelectionCard
          selected={data.has_openrouter === false}
          onClick={() => update({ has_openrouter: false })}
          icon={<span>&#x1F511;</span>}
          title="No, what's that?"
          subtitle="I need to set one up (takes 2 minutes)."
        />
      </div>

      {data.has_openrouter === false && (
        <div className="mt-4 p-5 bg-amber-50 border border-amber-400 rounded-xl">
          <p className="m-0 text-sm text-amber-800 leading-relaxed">
            <strong>Quick setup:</strong> Click below to create your free
            OpenRouter account in a new tab, then come back here to continue.
          </p>
          <a
            href="https://openrouter.ai/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => update({ openrouter_setup_clicked: true })}
            className="inline-block mt-3 px-5 py-2.5 bg-navy text-white border-none rounded-lg font-bold cursor-pointer text-[13px] no-underline"
          >
            Open OpenRouter &#x2197;
          </a>
        </div>
      )}

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={data.has_openrouter === null}
      />
    </SplitLayout>
  );
}
