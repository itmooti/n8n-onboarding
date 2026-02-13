import { PHASES } from '../../lib/constants';

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const currentPhase = PHASES.findIndex((p) => p.steps.includes(currentStep));

  return (
    <div className="px-8">
      <div className="max-w-[800px] mx-auto pt-5">
        <div className="flex gap-1.5 mb-2.5">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                i <= currentPhase
                  ? 'bg-gradient-to-r from-accent to-accent-orange'
                  : 'bg-[rgba(15,17,40,0.06)]'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {PHASES.map((p, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
                i <= currentPhase ? 'text-accent' : 'text-gray-300'
              }`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
