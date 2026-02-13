# Awesomate n8n Onboarding Wizard

## What This Is
Standalone 16-step onboarding wizard for Awesomate's n8n Hosting service. Lives at `onboarding.awesomate.ai`. NOT an Ontraport block builder — this is a deployed React app.

## Tech Stack
- React 18 + TypeScript 5 + Vite 7
- Tailwind CSS via CDN (configured in index.html, not installed locally)
- Zustand state management with sessionStorage persistence
- Framer Motion for step transitions
- VitalStats SDK (CDN-loaded) for data persistence
- Lucide React for icons

## Brand Design
Must match awesomate.ai exactly:
- **Navy:** #0f1128 (primary text, dark backgrounds)
- **Red:** #e9484d (accent, CTAs)
- **Orange:** #ef9563 (gradient endpoint)
- **Blue:** #1e63e9 (links)
- **Gradient:** `linear-gradient(135deg, #e9484d 0%, #ef9563 100%)`
- **Fonts:** Inter (body), Bricolage Grotesque (headings), JetBrains Mono (code)
- **Tailwind classes:** `text-navy`, `text-accent`, `text-accent-orange`, `bg-dark-bg`, `border-gray-border`

## Architecture
```
src/
├── App.tsx              # WizardShell with frosted glass header + step routing
├── store/onboarding.ts  # Zustand store, auto-saves to VitalStats at key transitions
├── steps/Step01-16.tsx  # One file per step, uses shared UI/layout components
├── steps/AddonStep.tsx  # Reusable pattern for Steps 7, 9, 10
├── components/ui/       # Button, Input, SelectionCard, StepHeading
├── components/layout/   # ProgressBar, SplitLayout, NavButtons
├── components/video/    # VideoPlayer (MP4 + placeholder)
├── hooks/               # useVitalSync (SDK), useWebsiteScraper (n8n webhook)
├── lib/                 # constants, costs, plans (recommendation engine), api (VitalStats)
└── types/               # OnboardingData interface, SDK types
```

## VitalStats Save Points
Records are created/updated at these step transitions:
1. Step 3→4: Create record (business details + slug + contact)
2. Step 6→7: Update (plan selection + tech level + workflow volume)
3. Step 13→14: Update (add-ons + costs + billing)
4. Step 15→16: Update (business profile + automation areas)
5. Step 16: Mark complete (timestamp + needs_booking flag)

## Dev Commands
```bash
npm run dev    # Port 3050
npm run build  # TypeScript + Vite production build
```

## Deployment
- Docker (nginx alpine) on port 3050
- GitHub Actions SSH deploy to 10.65.65.15
- Domain: onboarding.awesomate.ai

## Video Generation
```bash
export GEMINI_API_KEY="..."
python scripts/generate_videos.py --list    # See all prompts
python scripts/generate_videos.py --all     # Generate all (~$42)
python scripts/generate_videos.py --video 1 # Generate specific step
```
Videos go to `public/videos/` and are served by nginx.
