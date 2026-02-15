import { useEffect } from 'react';
import { countryFromCode } from '../lib/countries';
import { useOnboardingStore } from '../store/onboarding';

/**
 * Auto-detect the user's country from their IP using ipinfo.io (free, 50k/month, no key).
 * Only updates the store if the website scraper hasn't already set a country.
 */
export function useGeoDetect() {
  const { data, update } = useOnboardingStore();

  useEffect(() => {
    // Skip if the scraper already detected a country from the website
    if (data.websiteFetched) return;

    const controller = new AbortController();

    fetch('https://ipinfo.io/json', { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { country?: string }) => {
        if (json.country) {
          const name = countryFromCode(json.country);
          if (name) {
            update({ country: name });
          }
        }
      })
      .catch(() => {
        // Silently fail — keep the default
      });

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
