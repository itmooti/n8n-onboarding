/**
 * Video file mapping for each step that has a video.
 * Files are served from public/videos/ by nginx.
 * Build-time cache buster ensures fresh videos on each deploy.
 */
const CACHE_BUST = `?v=${Date.now()}`;

export const STEP_VIDEOS: Record<number, { src: string; title: string; duration: string }> = {
  1: { src: `/videos/step01-welcome-v1.mp4${CACHE_BUST}`, title: 'Welcome to Awesomate', duration: '0:08' },
  3: { src: `/videos/step03-subdomain-v1.mp4${CACHE_BUST}`, title: 'Your Workspace URL', duration: '0:08' },
  4: { src: `/videos/step04-tech-level-v1.mp4${CACHE_BUST}`, title: 'Your Comfort Level', duration: '0:08' },
  5: { src: `/videos/step05-workflow-volume-v1.mp4${CACHE_BUST}`, title: 'Workflow Volume', duration: '0:08' },
  6: { src: `/videos/step06-plan-recommendation-v1.mp4${CACHE_BUST}`, title: 'Your Recommended Plan', duration: '0:08' },
  7: { src: `/videos/step08-openrouter-v1.mp4${CACHE_BUST}`, title: 'What is OpenRouter?', duration: '0:08' },
  8: { src: `/videos/step07-credentials-v1.mp4${CACHE_BUST}`, title: 'Credential Setup', duration: '0:08' },
  9: { src: `/videos/step09-ai-agents-v1.mp4${CACHE_BUST}`, title: 'AI Chat Agents', duration: '0:08' },
  10: { src: `/videos/step10-workflow-setup-v1.mp4${CACHE_BUST}`, title: 'Workflow Templates', duration: '0:08' },
  11: { src: `/videos/step11-local-hosting-v1.mp4${CACHE_BUST}`, title: 'Data Sovereignty', duration: '0:08' },
  12: { src: `/videos/step12-website-hosting-v1.mp4${CACHE_BUST}`, title: 'Website Hosting', duration: '0:08' },
  14: { src: `/videos/step14-business-profile-v1.mp4${CACHE_BUST}`, title: 'About Your Business', duration: '0:08' },
  16: { src: `/videos/step16-confirmation-v1.mp4${CACHE_BUST}`, title: 'You\'re All Set!', duration: '0:08' },
};

/**
 * Get video props for a step. Returns undefined if no video for that step.
 */
export function getStepVideo(step: number) {
  return STEP_VIDEOS[step];
}
