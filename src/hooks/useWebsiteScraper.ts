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
 * n8n webhook URL for website scraping (production).
 * When configured, calls n8n webhook which uses Claude via OpenRouter.
 */
const SCRAPER_WEBHOOK_URL = import.meta.env.VITE_SCRAPER_WEBHOOK_URL || '';

/**
 * In dev mode, Vite serves a /api/scrape proxy that fetches URLs server-side.
 * See vite.config.ts scraperProxy plugin.
 */
const isDev = import.meta.env.DEV;

/**
 * Extract business details from raw HTML string.
 */
function parseHtml(html: string, url: string): ScrapedData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Company name: prefer og:site_name > og:title > <title>
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const titleTag = doc.querySelector('title')?.textContent;
  let companyName = ogSiteName || ogTitle || titleTag || '';
  // Clean taglines / suffixes after separators (e.g. "MCG Quantity Surveyors - We do depreciation differently")
  // og:site_name is usually clean already; title tags almost always use "Name - Tagline" format
  companyName = companyName
    .replace(/\s*[|]\s*.+$/, '')       // "Name | Tagline"
    .replace(/\s*[–—]\s*.+$/, '')      // "Name – Tagline" or "Name — Tagline"
    .replace(/\s+-\s+.+$/, '')         // "Name - Tagline" (space-dash-space to avoid "T-Mobile")
    .trim();

  // Email: look for mailto: links, then scan text
  const mailtoLink = doc.querySelector('a[href^="mailto:"]');
  let email = '';
  if (mailtoLink) {
    email = mailtoLink.getAttribute('href')?.replace('mailto:', '').split('?')[0] || '';
  }
  if (!email) {
    const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  // Phone: look for tel: links
  const telLink = doc.querySelector('a[href^="tel:"]');
  let phone = '';
  if (telLink) {
    phone = telLink.getAttribute('href')?.replace('tel:', '') || '';
  }

  // Logo: prefer og:image, then first <img> with "logo" in class/src/alt
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const logoImg = doc.querySelector('img[class*="logo"], img[src*="logo"], img[alt*="logo" i]');
  const logoUrl = ogImage || logoImg?.getAttribute('src') || null;

  // Resolve relative logo URL
  let resolvedLogo: string | null = null;
  if (logoUrl) {
    try {
      resolvedLogo = new URL(logoUrl, url).href;
    } catch {
      resolvedLogo = logoUrl;
    }
  }

  // Colors: extract from CSS custom properties and inline styles
  const colors = extractColors(html);

  // Summary: prefer meta description
  const metaDesc =
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    '';

  // CMS detection
  const cms = detectCMS(html, doc);

  // Country detection from HTML lang, meta, or content
  const country = detectCountry(html, doc, url);

  return {
    company_name: companyName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    logo_url: resolvedLogo || undefined,
    color1: colors[0] || undefined,
    color2: colors[1] || undefined,
    summary: metaDesc || undefined,
    cms: cms || undefined,
    country: country || undefined,
  };
}

/**
 * Extract prominent hex colors from HTML/CSS.
 */
function extractColors(html: string): string[] {
  const colorMap = new Map<string, number>();

  // Match hex colors in CSS
  const hexRegex = /#([0-9a-fA-F]{6})\b/g;
  let match;
  while ((match = hexRegex.exec(html)) !== null) {
    const hex = `#${match[1].toLowerCase()}`;
    if (isInterestingColor(hex)) {
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }
  }

  // Sort by frequency and return top 2
  return [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([hex]) => hex);
}

function isInterestingColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Skip very dark (< 20) or very light (> 235)
  if (brightness < 20 || brightness > 235) return false;

  // Skip grays (low saturation)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 30) return false;

  return true;
}

function detectCMS(html: string, doc: Document): string | null {
  if (html.includes('wp-content') || html.includes('wp-includes')) return 'WordPress';
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) return 'Shopify';
  if (html.includes('wix.com') || html.includes('X-Wix')) return 'Wix';
  if (html.includes('squarespace.com') || html.includes('sqs-')) return 'Squarespace';
  if (html.includes('webflow.com') || html.includes('w-nav')) return 'Webflow';
  if (html.includes('__next') || doc.getElementById('__next')) return 'Next.js';
  if (html.includes('framer.com') || html.includes('framer-')) return 'Framer';
  return null;
}

function detectCountry(_html: string, doc: Document, url: string): string | null {
  // Domain TLD is the most reliable indicator — check first.
  // HTML lang is often a CMS default (WordPress always uses en-US).
  if (url.includes('.com.au') || url.includes('.au/')) return 'Australia';
  if (url.includes('.co.nz') || url.includes('.nz/')) return 'New Zealand';
  if (url.includes('.co.uk') || url.includes('.uk/')) return 'United Kingdom';
  if (url.includes('.ca/')) return 'Canada';
  if (url.includes('.com.sg') || url.includes('.sg/')) return 'Singapore';
  if (url.includes('.in/') || url.includes('.co.in')) return 'India';
  if (url.includes('.de/')) return 'Germany';

  // Fall back to HTML lang attribute (less reliable)
  const lang = doc.documentElement.getAttribute('lang')?.toLowerCase() || '';
  if (lang.includes('en-au')) return 'Australia';
  if (lang.includes('en-gb')) return 'United Kingdom';
  if (lang.includes('en-nz')) return 'New Zealand';
  // Skip en-us — too many sites use it as a default regardless of location

  return null;
}

/**
 * Fetch raw HTML from a URL. Uses different strategies:
 * 1. Production: n8n webhook (VITE_SCRAPER_WEBHOOK_URL)
 * 2. Dev: Vite server-side proxy (/api/scrape)
 * 3. Fallback: basic domain name extraction
 */
async function fetchHtml(url: string): Promise<string> {
  // Dev mode: use Vite server-side proxy (no CORS issues)
  if (isDev) {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Proxy returned ${response.status}`);
    }

    const data = await response.json();
    return data.html;
  }

  // Production with webhook: let the webhook do AI-powered extraction
  // (returns structured data, not raw HTML)
  throw new Error('No scraping method available');
}

export function useWebsiteScraper(): UseWebsiteScraperResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrape = useCallback(async (url: string): Promise<ScrapedData | null> => {
    if (!url) return null;

    // Ensure URL has protocol
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `https://${fullUrl}`;
    }

    setLoading(true);
    setError(null);

    // Path 1: n8n webhook (production — returns structured AI-extracted data)
    if (SCRAPER_WEBHOOK_URL) {
      try {
        const response = await fetch(SCRAPER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fullUrl }),
        });

        if (!response.ok) {
          throw new Error(`Scraper returned ${response.status}`);
        }

        const data: ScrapedData = await response.json();
        setLoading(false);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Scraping failed';
        console.error('[Scraper webhook]', message);
        // Fall through to HTML parsing
      }
    }

    // Path 2: fetch raw HTML and parse client-side
    try {
      const html = await fetchHtml(fullUrl);
      const result = parseHtml(html, fullUrl);

      // If we couldn't extract a company name, use the domain
      if (!result.company_name) {
        const domain = fullUrl
          .replace(/https?:\/\//, '')
          .replace(/www\./, '')
          .split('/')[0]
          .split('.')[0];
        result.company_name = domain.charAt(0).toUpperCase() + domain.slice(1);
      }

      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch website';
      console.error('[Scraper]', message);
      setError(message);

      // Path 3: basic domain extraction (always works)
      const domain = fullUrl
        .replace(/https?:\/\//, '')
        .replace(/www\./, '')
        .split('/')[0];
      const name = domain.split('.')[0];
      const prettyName = name.charAt(0).toUpperCase() + name.slice(1);

      setLoading(false);
      return {
        company_name: prettyName,
        email: `hello@${domain}`,
        summary: `${prettyName} — further details will be populated during the onboarding session.`,
      };
    }
  }, []);

  return { scrape, loading, error };
}
