import { AddonStep } from './AddonStep';

export function Step07CredentialSetup() {
  return (
    <AddonStep
      title="Credential Setup"
      subtitle="Connecting your apps to n8n can be tricky the first time. We can do it with you."
      videoTitle="Credential Setup"
      videoDuration="0:15"
      selfLabel="I'll set them up myself"
      selfSubtitle="Access our docs and knowledge base."
      assistedLabel="Book a setup session"
      assistedSubtitle="1-hour video call — we connect all your tools together."
      field="credential_setup"
    />
  );
}
