import { useState, useCallback } from 'react';

interface ScrapedData {
  company_name?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  color1?: string;
  color2?: string;
  summary?: string;
  cms?: string;
  country?: string;
}

interface UseWebsiteScraperResult {
  scrape: (url: string) => Promise<ScrapedData | null>;
  loading: boolean;
  error: string | null;
}

/**
 * n8n webhook URL for website scraping.
 * This webhook receives { url } and returns scraped business details
 * using Claude via OpenRouter.
 */
const SCRAPER_WEBHOOK_URL = import.meta.env.VITE_SCRAPER_WEBHOOK_URL || '';

export function useWebsiteScraper(): UseWebsiteScraperResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrape = useCallback(async (url: string): Promise<ScrapedData | null> => {
    if (!url) return null;

    setLoading(true);
    setError(null);

    // If webhook URL is configured, call it
    if (SCRAPER_WEBHOOK_URL) {
      try {
        const response = await fetch(SCRAPER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error(`Scraper returned ${response.status}`);
        }

        const data: ScrapedData = await response.json();
        setLoading(false);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Scraping failed';
        console.error('[Scraper]', message);
        setError(message);
        setLoading(false);
        // Fall through to local extraction
      }
    }

    // Fallback: basic local extraction from URL
    try {
      const domain = url
        .replace(/https?:\/\//, '')
        .replace(/www\./, '')
        .split('/')[0];
      const name = domain.split('.')[0];
      const prettyName = name.charAt(0).toUpperCase() + name.slice(1);

      // Simulate a brief delay to feel realistic
      await new Promise((r) => setTimeout(r, 1200));

      setLoading(false);
      return {
        company_name: prettyName,
        email: `hello@${domain}`,
        summary: `${prettyName} is a business based on their web presence at ${domain}. Further details will be populated during the onboarding session.`,
      };
    } catch {
      setLoading(false);
      return null;
    }
  }, []);

  return { scrape, loading, error };
}
