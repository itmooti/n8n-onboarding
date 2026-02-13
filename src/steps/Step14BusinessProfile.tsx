import { useOnboardingStore } from '../store/onboarding';
import { SplitLayout } from '../components/layout/SplitLayout';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { StepHeading } from '../components/ui';
import { NavButtons } from '../components/layout';
import { ROLES } from '../lib/constants';
import { getStepVideo } from '../lib/videos';

export function Step14BusinessProfile() {
  const { data, update, next, prev } = useOnboardingStore();
  const video = getStepVideo(14);

  const toggleRole = (role: string) => {
    const newRoles = data.roles.includes(role)
      ? data.roles.filter((r: string) => r !== role)
      : [...data.roles, role];
    update({ roles: newRoles });
  };

  return (
    <SplitLayout
      video={<VideoPlayer title={video?.title || 'About Your Business'} duration={video?.duration || '0:08'} src={video?.src} />}
    >
      <StepHeading
        title="Tell us about your business"
        subtitle={
          data.business_summary
            ? "We put together a summary from your website — edit anything that's off."
            : 'A brief description helps us recommend the right automations.'
        }
      />

      {/* Business summary */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em] font-sans">
          BUSINESS SUMMARY
        </label>
        <textarea
          value={data.business_summary}
          onChange={(e) => update({ business_summary: e.target.value })}
          rows={4}
          placeholder="What does your business do? Who are your customers?"
          className="w-full px-4 py-3 rounded-[10px] border-2 border-gray-border text-sm font-sans resize-y bg-white outline-none box-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,72,77,0.08)] transition-all"
        />
      </div>

      {/* Team size */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-[0.1em] font-sans">
          TEAM SIZE
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'solo' as const, l: 'Just me' },
            { v: '2-5' as const, l: '2-5' },
            { v: '6-20' as const, l: '6-20' },
            { v: '20+' as const, l: '20+' },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => update({ team_size: o.v })}
              className={`px-5 py-2.5 rounded-[10px] border-2 font-bold text-sm cursor-pointer text-navy font-sans transition-all ${
                data.team_size === o.v
                  ? 'border-accent bg-accent/[0.04] shadow-[0_0_0_3px_rgba(233,72,77,0.06)]'
                  : 'border-gray-border bg-white hover:border-gray-300'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-[0.1em] font-sans">
          ROLES NEEDING AUTOMATION
        </label>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className={`px-4 py-2 rounded-[8px] border-2 font-semibold text-[13px] cursor-pointer text-navy transition-all ${
                data.roles.includes(r)
                  ? 'border-accent bg-accent/[0.04] shadow-[0_0_0_3px_rgba(233,72,77,0.06)]'
                  : 'border-gray-border bg-white hover:border-gray-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <NavButtons onBack={prev} onNext={next} />
    </SplitLayout>
  );
}
