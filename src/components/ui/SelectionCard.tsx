import { Check } from 'lucide-react';

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}

export function SelectionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  badge,
}: SelectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
        selected
          ? 'bg-gradient-to-br from-accent/[0.05] to-accent-orange/[0.02] border-2 border-accent shadow-[0_8px_25px_rgba(233,72,77,0.1)] -translate-y-0.5'
          : 'bg-white border-2 border-gray-border shadow-[0_1px_4px_rgba(15,17,40,0.03)] hover:shadow-[0_6px_20px_rgba(15,17,40,0.06)] hover:-translate-y-[2px]'
      }`}
    >
      {badge && !selected && (
        <span
          className={`absolute top-3 right-3 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wide uppercase ${
            badge === 'FREE' || badge.includes('Included')
              ? 'bg-success'
              : 'bg-gradient-to-br from-accent to-accent-orange'
          }`}
        >
          {badge}
        </span>
      )}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange flex items-center justify-center">
          <Check size={14} className="text-white" strokeWidth={3} />
        </div>
      )}
      <div className="text-[22px] sm:text-[28px] mb-2">{icon}</div>
      <div className="font-bold text-navy text-base mb-1.5 font-sans">
        {title}
      </div>
      <div className="text-gray-500 text-[13px] leading-relaxed">{subtitle}</div>
    </div>
  );
}
