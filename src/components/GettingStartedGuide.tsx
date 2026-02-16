import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Clock,
  Loader2,
  UserPlus,
  Gift,
  LayoutDashboard,
  Mail,
  Settings,
  KeyRound,
  BadgeCheck,
} from 'lucide-react';
import { Button } from './ui';

interface GettingStartedGuideProps {
  slug: string;
}

const PHASES = [
  {
    label: 'Create Your Account',
    steps: [
      {
        number: 1,
        title: 'Set up your owner account',
        description:
          'Enter your email, name, and choose a password (8+ characters, at least 1 number and 1 capital letter).',
        icon: UserPlus,
      },
      {
        number: 2,
        title: 'Claim your free license key',
        description:
          'A popup will offer paid features for free. Enter your email and click "Send me a free license key".',
        icon: Gift,
      },
      {
        number: 3,
        title: 'Welcome to your dashboard',
        description:
          "You'll land on the n8n home page. A notification will confirm your license key is on its way.",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Activate Your License',
    steps: [
      {
        number: 4,
        title: 'Check your email',
        description:
          'Look for an email from n8n.io containing your activation key. Copy the key.',
        icon: Mail,
      },
      {
        number: 5,
        title: 'Go to Settings \u2192 Usage and plan',
        description:
          'In the n8n sidebar, click Settings, then select "Usage and plan".',
        icon: Settings,
      },
      {
        number: 6,
        title: 'Enter your activation key',
        description:
          'Click "Enter activation key", paste the key from your email, and click "Activate".',
        icon: KeyRound,
      },
      {
        number: 7,
        title: "You're registered!",
        description:
          'The page shows a "Registered" badge. You\'re all set to start building workflows.',
        icon: BadgeCheck,
      },
    ],
  },
];

const TOTAL_STEPS = PHASES.reduce((sum, p) => sum + p.steps.length, 0);

const PROVISION_SECONDS = 60;

export function GettingStartedGuide({ slug }: GettingStartedGuideProps) {
  const workspaceUrl = `https://${slug}.awesomate.io`;
  const [secondsLeft, setSecondsLeft] = useState(PROVISION_SECONDS);
  const ready = secondsLeft <= 0;

  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <>
      {/* Hero CTA — Launch Workspace */}
      <div
        className="relative rounded-[16px] sm:rounded-[20px] p-5 sm:p-8 mb-6 text-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
        }}
      >
        <div className="text-white/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] mb-2">
          YOUR WORKSPACE
        </div>

        <div className="text-[20px] sm:text-[26px] font-extrabold font-heading mb-1">
          <span className="accent-gradient-text">
            {slug}.awesomate.io
          </span>
        </div>

        {ready ? (
          <>
            <p className="text-white/50 text-xs mb-5 flex items-center justify-center gap-1.5">
              <Clock size={12} />
              Your workspace is ready
            </p>

            <Button
              onClick={() => window.open(workspaceUrl, '_blank')}
              className="text-[16px] px-10 py-4"
            >
              <span className="flex items-center justify-center gap-2">
                Launch Your Workspace
                <ExternalLink size={16} />
              </span>
            </Button>
          </>
        ) : (
          <>
            <p className="text-white/80 text-sm mb-4 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Provisioning your workspace...
            </p>

            <div className="text-white/60 text-[15px] font-mono font-bold">
              Ready in {secondsLeft}s
            </div>
          </>
        )}
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6">
        <h3 className="text-[18px] sm:text-[20px] font-extrabold text-navy mb-1 font-heading">
          Getting Started Guide
        </h3>
        <p className="text-gray-500 text-[13px] sm:text-[14px] mb-5 leading-relaxed">
          Follow these steps after opening your workspace for the first time.
        </p>

        {PHASES.map((phase, phaseIndex) => (
          <div key={phase.label} className={phaseIndex > 0 ? 'mt-5' : ''}>
            {/* Phase label */}
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3 ml-11">
              {phase.label}
            </div>

            {/* Steps */}
            <div>
              {phase.steps.map((step) => {
                const isLast = step.number === TOTAL_STEPS;
                const Icon = step.icon;

                return (
                  <div key={step.number} className="flex gap-3 sm:gap-4">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] sm:text-[13px] font-bold text-white"
                        style={
                          step.number <= 3
                            ? {
                                background:
                                  'linear-gradient(135deg, #e9484d 0%, #ef9563 100%)',
                              }
                            : { background: '#0f1128' }
                        }
                      >
                        {step.number}
                      </div>
                      {!isLast && (
                        <div className="w-[2px] flex-1 min-h-[16px] bg-gray-border" />
                      )}
                    </div>

                    {/* Content column */}
                    <div className={isLast ? 'pb-0' : 'pb-4'}>
                      <div className="font-bold text-navy text-[14px] sm:text-[15px] leading-tight flex items-center gap-2">
                        {step.title}
                        <Icon size={14} className="text-gray-300" />
                      </div>
                      <div className="text-gray-500 text-[12px] sm:text-[13px] leading-relaxed mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
