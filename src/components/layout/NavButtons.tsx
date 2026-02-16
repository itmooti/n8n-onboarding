import { Button } from '../ui/Button';
import { useOnboardingStore } from '../../store/onboarding';

interface NavButtonsProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  showBack = true,
}: NavButtonsProps) {
  const reset = useOnboardingStore((s) => s.reset);

  const handleStartOver = () => {
    if (window.confirm('Start over? All your progress will be cleared.')) {
      reset();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex gap-3">
        {showBack && onBack && (
          <Button variant="ghost" onClick={onBack}>
            &larr; Back
          </Button>
        )}
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel} &rarr;
        </Button>
      </div>
      {onBack && (
        <button
          onClick={handleStartOver}
          className="mt-3 text-gray-300 hover:text-gray-500 text-[11px] font-medium bg-transparent border-none cursor-pointer transition-colors"
        >
          Start over
        </button>
      )}
    </div>
  );
}
