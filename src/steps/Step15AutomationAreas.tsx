import { useOnboardingStore } from '../store/onboarding';
import { StepHeading } from '../components/ui';
import { NavButtons } from '../components/layout';
import { AUTOMATION_AREAS } from '../lib/constants';
import {
  Mail, Smartphone, Bot, BarChart3, DollarSign, Users,
  FileText, RefreshCw, Calendar, ShoppingCart, Target, Phone,
  UserCheck, Lock, Package, Brain, Link, MessageSquare,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Mail, Smartphone, Bot, BarChart3, DollarSign, Users,
  FileText, RefreshCw, Calendar, ShoppingCart, Target, Phone,
  UserCheck, Lock, Package, Brain, Link, MessageSquare,
};

export function Step15AutomationAreas() {
  const { data, update, next, prev } = useOnboardingStore();

  const toggleArea = (label: string) => {
    const newAreas = data.automation_areas.includes(label)
      ? data.automation_areas.filter((a: string) => a !== label)
      : [...data.automation_areas, label];
    update({ automation_areas: newAreas });
  };

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent size={18} className="text-navy/70" /> : null;
  };

  return (
    <>
      <StepHeading
        title="What areas could use some automation?"
        subtitle="Select all that apply — this helps us prioritise your setup and recommend the right templates."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {AUTOMATION_AREAS.map((a) => {
          const sel = data.automation_areas.includes(a.label);
          return (
            <button
              key={a.label}
              onClick={() => toggleArea(a.label)}
              className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-center gap-2 transition-all ${
                sel
                  ? 'border-accent bg-accent/[0.04] scale-[1.02] shadow-[0_0_0_3px_rgba(233,72,77,0.06)]'
                  : 'border-gray-border bg-white hover:border-gray-300 hover:-translate-y-[1px]'
              }`}
            >
              {getIcon(a.icon)}
              <span className="text-xs font-semibold text-navy text-left leading-tight">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      <NavButtons
        onBack={prev}
        onNext={next}
        nextLabel="Finish Setup"
      />
    </>
  );
}
