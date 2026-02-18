import { useRef, useCallback, useEffect, useState } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading, Input } from '../components/ui';
import { NavButtons } from '../components/layout';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { checkSlugAvailability } from '../lib/api';
import { getStepVideo } from '../lib/videos';

const MAX_SLUG_LENGTH = 20;

function generateSlugCandidates(businessName: string): string[] {
  if (!businessName || businessName.trim().length < 2) return [];

  const words = businessName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length === 0) return [];

  // Remove common filler words for shorter variants
  const stopWords = new Set(['the', 'and', 'or', 'of', 'for', 'a', 'an', 'in', 'on', 'at', 'to', 'by', 'pty', 'ltd', 'inc', 'llc', 'co', 'company', 'services', 'solutions', 'group', 'enterprise', 'enterprises']);
  const coreWords = words.filter(w => !stopWords.has(w));
  const useful = coreWords.length > 0 ? coreWords : words;

  const candidates: string[] = [];

  // Initials only (e.g. "East Coast Injury Lawyers" → "ecil")
  if (useful.length > 1) {
    const initials = useful.map(w => w[0]).join('');
    candidates.push(initials);
  }

  // Full name concatenated
  candidates.push(useful.join(''));

  // First word only (if multi-word)
  if (useful.length > 1) {
    candidates.push(useful[0]);
  }

  // First + last word
  if (useful.length > 2) {
    candidates.push(`${useful[0]}${useful[useful.length - 1]}`);
  }

  // Deduplicate, enforce max length, must start with letter, filter min length
  const seen = new Set<string>();
  return candidates
    .map(s => s.replace(/[^a-z0-9]/g, '').slice(0, MAX_SLUG_LENGTH))
    .filter(s => {
      if (s.length < 3 || seen.has(s) || !/^[a-z]/.test(s)) return false;
      seen.add(s);
      return true;
    })
    .slice(0, 4);
}

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
    const cleaned = v.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, MAX_SLUG_LENGTH);
    update({ slug: cleaned });
    debouncedCheck(cleaned);
  };

  const startsWithLetter = data.slug.length === 0 || /^[a-z]/.test(data.slug);

  const [suggestions, setSuggestions] = useState<{ slug: string; available: boolean }[]>([]);

  // Generate candidates and check availability for each
  useEffect(() => {
    const candidates = generateSlugCandidates(data.company_trading_name);
    if (candidates.length === 0) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const results: { slug: string; available: boolean }[] = [];
      for (const c of candidates) {
        const ok = await checkSlugAvailability(c);
        if (cancelled) return;
        results.push({ slug: c, available: ok });
      }
      if (!cancelled) setSuggestions(results);
    })();

    return () => { cancelled = true; };
  }, [data.company_trading_name]);

  const slugValid = data.slug.length >= 3 && startsWithLetter && data.slugAvailable === true;

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

      <div>
        <Input
          label="Subdomain"
          value={data.slug}
          onChange={handleSlugChange}
          placeholder="yourname"
        />
        <div className="flex justify-end -mt-3 mb-3">
          <span className={`text-[12px] font-mono ${data.slug.length >= MAX_SLUG_LENGTH ? 'text-red-500' : 'text-navy/30'}`}>
            {data.slug.length}/{MAX_SLUG_LENGTH}
          </span>
        </div>
      </div>

      {/* Slug suggestions from business name */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-navy/50 text-[12px] font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-accent-orange" /> Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(({ slug, available }) => (
              <button
                key={slug}
                type="button"
                onClick={() => { handleSlugChange(slug); }}
                disabled={!available}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-mono transition-colors ${
                  !available
                    ? 'bg-navy/5 border border-navy/10 text-navy/30 line-through cursor-not-allowed'
                    : data.slug === slug
                      ? 'bg-accent/10 border border-accent text-accent cursor-pointer'
                      : 'bg-navy/5 border border-navy/15 text-navy/70 hover:border-accent hover:text-accent cursor-pointer'
                }`}
              >
                {slug}
              </button>
            ))}
          </div>
        </div>
      )}

      {!startsWithLetter && data.slug.length > 0 && (
        <div className="flex items-center gap-2 text-red-500 text-[13px] font-semibold mb-4">
          <X size={16} /> Must start with a letter
        </div>
      )}

      {startsWithLetter && data.slug.length > 2 && data.slugAvailable === null && (
        <div className="flex items-center gap-2 text-gray-400 text-[13px] font-semibold mb-4">
          <Loader2 size={16} className="animate-spin" /> Checking availability...
        </div>
      )}

      {startsWithLetter && data.slugAvailable === true && data.slug.length > 2 && (
        <div className="flex items-center gap-2 text-success text-[13px] font-semibold mb-4">
          <Check size={16} /> This one's yours!
        </div>
      )}

      {startsWithLetter && data.slugAvailable === false && (
        <div className="flex items-center gap-2 text-red-500 text-[13px] font-semibold mb-4">
          <X size={16} /> Already taken — try another
        </div>
      )}

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel="Lock It In"
        nextDisabled={!slugValid}
      />
    </SplitLayout>
  );
}
