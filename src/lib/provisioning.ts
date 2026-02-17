import type { OnboardingData } from '../types/onboarding';

const PROVISIONING_URL = import.meta.env.VITE_PROVISIONING_WEBHOOK_URL || '';

/**
 * Convert browser IANA timezone to the format expected by the provisioning webhook.
 * e.g., "Australia/Perth" → "(GMT +08:00) Perth"
 */
function formatTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g., "Australia/Perth"
    const offsetMinutes = -new Date().getTimezoneOffset(); // positive = east of UTC
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const mins = String(absMinutes % 60).padStart(2, '0');
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || 'UTC';
    return `(GMT ${sign}${hours}:${mins}) ${city}`;
  } catch {
    return '(GMT +00:00) UTC';
  }
}

/**
 * Provision the user's n8n + VitalSync account via webhook.
 * Called after successful payment — awaited so we can log failures.
 */
export async function provisionAccount(
  data: OnboardingData,
): Promise<{ success: boolean; error?: string }> {
  if (!PROVISIONING_URL) {
    console.warn('[Provisioning] No webhook URL configured — skipping');
    return { success: false, error: 'Provisioning webhook not configured' };
  }

  const payload = {
    n8n: 'Yes',
    vitalsync: 'Yes',
    business_name: data.company_trading_name || data.company_legal_name || '',
    business_description: data.business_summary || '',
    timezone: formatTimezone(),
    user: {
      first_name: data.contact_first_name || '',
      last_name: data.contact_last_name || '',
      email: data.email || '',
      password: `${data.slug}!123ABC`,
      phone: data.sms_number || '',
    },
    subdomain: data.slug || '',
    props: {
      n8n: {
        hostname: 'awesomate.ai',
      },
      branding: {
        logo_url: data.logo_url || '',
        theme_color: data.color1 || '#e9484d',
        theme_color2: data.color2 || '#0f1128',
      },
    },
  };

  console.log('[Provisioning] Sending payload for subdomain:', payload.subdomain);

  try {
    const res = await fetch(PROVISIONING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(text);
    } catch {
      // Response may not be JSON
    }

    if (!res.ok) {
      const msg = (result.error as string) || `Provisioning failed (${res.status})`;
      console.error('[Provisioning] Error:', msg, text);
      return { success: false, error: msg };
    }

    console.log('[Provisioning] Account created successfully:', text);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Provisioning request failed';
    console.error('[Provisioning] Request failed:', message);
    return { success: false, error: message };
  }
}
