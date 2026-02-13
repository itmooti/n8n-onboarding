import { Button } from '../ui/Button';

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
  return (
    <div className="flex gap-3 mt-6">
      {showBack && onBack && (
        <Button variant="ghost" onClick={onBack}>
          &larr; Back
        </Button>
      )}
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel} &rarr;
      </Button>
    </div>
  );
}
