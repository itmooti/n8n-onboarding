/**
 * Video file mapping for each step that has a video.
 * Files are served from public/videos/ by nginx.
 */
export const STEP_VIDEOS: Record<number, { src: string; title: string; duration: string }> = {
  1: { src: '/videos/step01-welcome.mp4', title: 'Welcome to Awesomate', duration: '0:08' },
  3: { src: '/videos/step03-subdomain.mp4', title: 'Your Workspace URL', duration: '0:08' },
  4: { src: '/videos/step04-tech-level.mp4', title: 'Your Comfort Level', duration: '0:08' },
  7: { src: '/videos/step07-credentials.mp4', title: 'Credential Setup', duration: '0:08' },
  8: { src: '/videos/step08-openrouter.mp4', title: 'What is OpenRouter?', duration: '0:08' },
  9: { src: '/videos/step09-ai-agents.mp4', title: 'AI Chat Agents', duration: '0:08' },
  10: { src: '/videos/step10-workflow-setup.mp4', title: 'Workflow Templates', duration: '0:08' },
  11: { src: '/videos/step11-local-hosting.mp4', title: 'Data Sovereignty', duration: '0:08' },
  14: { src: '/videos/step14-business-profile.mp4', title: 'About Your Business', duration: '0:08' },
};

/**
 * Get video props for a step. Returns undefined if no video for that step.
 */
export function getStepVideo(step: number) {
  return STEP_VIDEOS[step];
}
