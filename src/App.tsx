import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from './store/onboarding';
import { useVitalSync } from './hooks/useVitalSync';
import { ProgressBar } from './components/layout/ProgressBar';
import { AffiliateBanner } from './components/ui/AffiliateBanner';
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
  7: Step08OpenRouter,
  8: Step07CredentialSetup,
  9: Step09AiAgents,
  10: Step10WorkflowSetup,
  11: Step11LocalHosting,
  12: Step12WebsiteHosting,
  13: Step13Summary,
  14: Step14BusinessProfile,
  15: Step15AutomationAreas,
  16: Step16Confirmation,
};

/* Awesomate logo SVG — exact copy from main site Header.tsx */
function AwesomateLogo() {
  return (
    <svg height="26" viewBox="568 478 762 125" xmlns="http://www.w3.org/2000/svg" style={{ width: 'auto' }}>
      <defs>
        <linearGradient id="ob-logo-grad" x1="595" y1="590" x2="725" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fe3346" />
          <stop offset="1" stopColor="#ff9257" />
        </linearGradient>
      </defs>
      {/* Molecular logo mark */}
      <path fill="url(#ob-logo-grad)" d="M618.27,518.66c0,3.6.54,7.07,1.55,10.33h0,0c.78,2.52,1.83,4.92,3.13,7.16h0s4.55,7.86,4.55,7.86l2.8,4.85c.32-.03.65-.05.98-.05,5.82,0,10.54,4.72,10.54,10.54s-4.72,10.55-10.54,10.55-10.54-4.72-10.54-10.55c0-2.18.66-4.2,1.79-5.88l-12.39-20.62c-10.02,5.94-16.74,16.86-16.74,29.36,0,18.84,15.27,34.1,34.1,34.1,13.7,0,25.51-8.08,30.93-19.73h0l6.79-11.69c-1.02-1.62-1.62-3.55-1.62-5.61,0-5.82,4.72-10.54,10.54-10.54s10.54,4.72,10.54,10.54-4.72,10.54-10.54,10.54c-.21,0-.43,0-.64-.02l-13.15,22.32c4.85,2.65,10.41,4.15,16.32,4.15,18.83,0,34.1-15.27,34.1-34.1,0-18.83-15.27-34.1-34.1-34.1h-13.91c-1.7,3.55-5.32,6-9.52,6-5.82,0-10.54-4.72-10.54-10.54s4.72-10.54,10.54-10.54c4.06,0,7.58,2.3,9.34,5.66h25.65c0-19.33-15.67-34.99-34.99-34.99-19.32,0-34.99,15.66-34.99,34.99" />
      {/* AWESOMATE wordmark */}
      <path fill="#0f112a" d="M770.28,509.49h14.93l30.46,79.96h-15.53l-6.14-16.86h-33.35l-6.02,16.86h-14.57l30.22-79.96ZM764.86,560.79h24.93l-12.52-34.8-12.4,34.8Z" />
      <polygon fill="#0f112a" points="845.58 530.44 859.31 530.44 869.79 571.99 878.58 530.44 893.03 530.44 877.01 589.45 864.37 589.45 852.45 546.1 840.64 589.45 828 589.45 811.99 530.44 826.44 530.44 835.23 571.99 845.58 530.44" />
      <path fill="#0f112a" d="M892.87,560.06c0-18.18,11.68-30.83,29.14-30.83,18.78,0,29.74,14.33,28.66,34.8h-44.31c.24,9.75,6.74,16.14,15.77,16.14,8.43,0,12.64-3.97,14.69-9.27l12.89,1.69c-2.77,8.79-11.32,18.3-27.34,18.3-19.63,0-29.5-13.61-29.5-30.83M906.35,554.16h30.71c-.36-9.03-6.86-14.69-14.93-14.69s-15.29,4.46-15.77,14.69" />
      <path fill="#0f112a" d="M994.99,548.62c-1.33-5.78-6.62-9.27-14.09-9.27-6.02,0-11.08,2.17-11.08,6.14,0,3.73,3.61,5.78,9.15,6.98l6.99,1.45c12.04,2.65,22.28,6.02,22.28,17.58,0,12.52-11.8,19.39-25.77,19.39-15.53,0-25.53-8.79-26.73-19.51l13.01-1.93c1.08,6.38,5.66,11.32,14.21,11.32,7.35,0,12.16-2.65,12.16-7.47s-5.18-6.5-11.32-7.83l-7.83-1.69c-10.36-2.17-18.79-6.38-18.79-17.46s11.2-17.1,24.69-17.1c12.4,0,23.36,6.14,25.65,17.7l-12.52,1.68Z" />
      <path fill="#0f112a" d="M1067.12,542.38l-7.54,7.52c-1.63,1.63-2.34,3.91-2.1,6.2.13,1.25.2,2.58.2,3.99,0,13.36-6.15,20.1-15.17,20.1-2.14,0-4.12-.4-5.9-1.18-2.65-1.16-5.76-.36-7.81,1.68l-4.45,4.45c5.07,3.9,11.47,5.76,18.15,5.76,15.17,0,28.9-9.63,28.9-30.82,0-7.21-1.59-13.11-4.29-17.71M1027.34,560.09c0-13.39,6.26-20.13,15.17-20.13,2.16,0,4.16.38,5.95,1.16,2.65,1.15,5.75.33,7.79-1.71l4.38-4.38c-5.07-3.93-11.47-5.79-18.12-5.79-15.17,0-28.9,9.63-28.9,30.85,0,7.21,1.59,13.06,4.29,17.68l7.56-7.56c1.62-1.62,2.33-3.89,2.08-6.17-.13-1.24-.2-2.56-.2-3.95" />
      <path fill="#0f112a" d="M1077.41,530.44h13.37v7.35c3.25-5.42,9.03-8.55,17.34-8.55,9.99,0,14.45,4.46,17.1,9.63,4.58-6.38,10.72-9.63,20.11-9.63,6.74,0,12.04,2.29,15.17,6.02,3.25,3.85,4.7,9.39,4.7,17.7v36.49h-13.37v-33.6c0-5.66-.6-9.63-2.53-12.04-1.69-2.29-4.33-3.49-8.55-3.49-9.75,0-12.76,7.95-12.76,18.3v30.83h-13.37v-33.6c0-5.78-.6-9.75-2.53-12.16-1.81-2.17-4.46-3.37-8.43-3.37-9.87,0-12.88,7.95-12.88,18.3v30.83h-13.37v-59Z" />
      <path fill="#0f112a" d="M1176.41,548.38c.84-11.68,10.36-19.39,25.89-19.39,17.1,0,24.44,6.14,24.44,22.64,0,3.85-.24,13.73-.24,16.98,0,7.59.36,13.73,1.2,20.83h-12.52l-.36-7.1c-3.73,5.54-9.51,8.55-19.15,8.55-13.61,0-21.31-9.15-21.31-19.27,0-5.78,2.65-10.11,6.5-12.76,5.3-3.61,12.52-5.06,21.56-6.14l11.08-1.2v-2.05c0-8.07-4.82-10.48-11.92-10.48-7.59,0-12.16,3.49-12.76,9.75l-12.4-.36ZM1213.98,561.27l-11.2,1.2c-10.11,1.08-14.57,3.85-14.57,9.27,0,5.06,3.97,8.67,10.36,8.67,7.83,0,15.41-4.46,15.41-15.53v-3.61Z" />
      <path fill="#0f112a" d="M1239.51,513.34h13.37v17.1h12.04v10.23h-12.04v30.59c0,6.14,1.44,7.58,7.1,7.58h4.82v10.6h-9.75c-12.88,0-15.53-3.49-15.53-15.77v-32.99h-8.91v-10.23h8.91v-17.1Z" />
      <path fill="#0f112a" d="M1268.73,560.06c0-18.18,11.68-30.83,29.14-30.83,18.79,0,29.74,14.33,28.66,34.8h-44.31c.24,9.75,6.74,16.14,15.77,16.14,8.43,0,12.64-3.97,14.69-9.27l12.89,1.69c-2.77,8.79-11.32,18.3-27.34,18.3-19.63,0-29.5-13.61-29.5-30.83M1282.22,554.16h30.71c-.36-9.03-6.86-14.69-14.93-14.69s-15.29,4.46-15.77,14.69" />
    </svg>
  );
}

function App() {
  const { step } = useOnboardingStore();
  const [direction, setDirection] = useState(0);
  const [prevStep, setPrevStep] = useState(step);

  // Initialize VitalStats SDK connection
  useVitalSync();

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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-[60px] sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AwesomateLogo />
            <span className="hidden sm:inline text-gray-400 text-[12px] font-semibold uppercase tracking-[0.1em] ml-2">
              n8n Setup
            </span>
          </div>
          <div className="text-[12px] text-gray-400 font-semibold uppercase tracking-[0.08em]">
            Step {step} of {TOTAL_STEPS}
          </div>
        </div>
      </div>

      {/* Affiliate co-branding banner (only visible with ?aff= param) */}
      <AffiliateBanner />

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Main content with animation */}
      <div className="relative max-w-[800px] mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-16 sm:pb-20">
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

      {/* Global footer */}
      <footer className="border-t border-gray-200 bg-white/60">
        <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-gray-300 text-[13px]">
            &copy; {new Date().getFullYear()} Awesomate.ai. All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            <a
              href="https://awesomate.ai/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://awesomate.ai/terms-of-service"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
