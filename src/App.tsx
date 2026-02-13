import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from './store/onboarding';
import { ProgressBar } from './components/layout/ProgressBar';
import { TOTAL_STEPS } from './lib/constants';

import { Step01Welcome } from './steps/Step01Welcome';
import { Step02BusinessDetails } from './steps/Step02BusinessDetails';
import { Step03Subdomain } from './steps/Step03Subdomain';
import { Step04TechLevel } from './steps/Step04TechLevel';
import { Step05WorkflowVolume } from './steps/Step05WorkflowVolume';
import { Step06PlanRecommendation } from './steps/Step06PlanRecommendation';
import { Step07CredentialSetup } from './steps/Step07CredentialSetup';
import { Step08OpenRouter } from './steps/Step08OpenRouter';
import { Step09AiAgents } from './steps/Step09AiAgents';
import { Step10WorkflowSetup } from './steps/Step10WorkflowSetup';
import { Step11LocalHosting } from './steps/Step11LocalHosting';
import { Step12WebsiteHosting } from './steps/Step12WebsiteHosting';
import { Step13Summary } from './steps/Step13Summary';
import { Step14BusinessProfile } from './steps/Step14BusinessProfile';
import { Step15AutomationAreas } from './steps/Step15AutomationAreas';
import { Step16Confirmation } from './steps/Step16Confirmation';

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step01Welcome,
  2: Step02BusinessDetails,
  3: Step03Subdomain,
  4: Step04TechLevel,
  5: Step05WorkflowVolume,
  6: Step06PlanRecommendation,
  7: Step07CredentialSetup,
  8: Step08OpenRouter,
  9: Step09AiAgents,
  10: Step10WorkflowSetup,
  11: Step11LocalHosting,
  12: Step12WebsiteHosting,
  13: Step13Summary,
  14: Step14BusinessProfile,
  15: Step15AutomationAreas,
  16: Step16Confirmation,
};

/* Awesomate logo SVG — matches main site exactly */
function AwesomateLogo() {
  return (
    <svg height="32" viewBox="0 0 180 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gradient icon mark */}
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e9484d" />
          <stop offset="100%" stopColor="#ef9563" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" y="2" fill="url(#logo-grad)" />
      <text x="10" y="24" fill="white" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="20">A</text>
      {/* Wordmark */}
      <text x="40" y="25" fill="#0f1128" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="700" fontSize="18">awesomate</text>
    </svg>
  );
}

function App() {
  const { step } = useOnboardingStore();
  const [direction, setDirection] = useState(0);
  const [prevStep, setPrevStep] = useState(step);

  useEffect(() => {
    setDirection(step > prevStep ? 1 : -1);
    setPrevStep(step);
  }, [step, prevStep]);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="min-h-screen bg-gray-bg font-sans">
      {/* Subtle dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none" />

      {/* Frosted glass header — matches awesomate.ai */}
      <div
        className="sticky top-0 z-50 border-b border-gray-100/80"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AwesomateLogo />
            <span className="text-gray-400 text-[12px] font-semibold uppercase tracking-[0.1em] ml-2">
              n8n Setup
            </span>
          </div>
          <div className="text-[12px] text-gray-400 font-semibold uppercase tracking-[0.08em]">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Main content with animation */}
      <div className="relative max-w-[800px] mx-auto px-8 pt-8 pb-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {StepComponent && <StepComponent />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
