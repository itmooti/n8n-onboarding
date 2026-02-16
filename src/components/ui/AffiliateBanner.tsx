import { useOnboardingStore } from '../../store/onboarding';
import { getAffiliateConfig } from '../../lib/affiliates';

export function AffiliateBanner() {
  const affiliateCode = useOnboardingStore((s) => s.data.affiliate_code);
  const config = getAffiliateConfig(affiliateCode);
  if (!config) return null;

  return (
    <div
      className="py-2"
      style={{
        background: 'linear-gradient(135deg, #e9484d 0%, #ef9563 100%)',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-center gap-2">
        <span className="text-[11px] sm:text-[12px] font-semibold text-white tracking-wide">
          Exclusive pricing via <span className="font-extrabold">{config.name}</span>
        </span>
      </div>
    </div>
  );
}
