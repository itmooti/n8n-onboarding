import type { VitalSyncPlugin } from '../types/sdk';
import type { OnboardingData } from '../types/onboarding';
import { calculateCosts, getActivePlan } from './costs';

/**
 * VitalStats model name for onboarding submissions.
 * Must match the model created in VitalStats admin.
 */
const MODEL_NAME = 'OnboardingSubmission';

/**
 * Get the VitalStats plugin from the SDK.
 * Returns null if SDK isn't ready.
 */
function getPlugin(): VitalSyncPlugin | null {
  return window.getVitalStatsPlugin?.() ?? null;
}

/**
 * Create a new onboarding record (called after Step 3).
 * Returns the record ID for future updates.
 */
export async function createOnboardingRecord(
  data: Partial<OnboardingData>,
): Promise<string | null> {
  const plugin = getPlugin();
  if (!plugin) {
    console.warn('[VitalStats] SDK not ready — skipping record creation');
    return null;
  }

  try {
    const mutation = plugin.mutation().switchTo(MODEL_NAME);
    const record = mutation.createOne({
      website_url: data.website_url || '',
      slug: data.slug || '',
      company_trading_name: data.company_trading_name || '',
      company_legal_name: data.company_legal_name || '',
      email: data.email || '',
      sms_number: data.sms_number || '',
      contact_first_name: data.contact_first_name || '',
      contact_last_name: data.contact_last_name || '',
      country: data.country || 'Australia',
      logo_url: data.logo_url || '',
      color1: data.color1 || '',
      color2: data.color2 || '',
      initial_plan: data.initial_plan || 'essentials',
      website_fetched: data.websiteFetched ? 'true' : 'false',
      status: 'in_progress',
      created_at: new Date().toISOString(),
    });

    const result = await mutation.execute(true).toPromise() as Record<string, unknown>;
    const id = (record as Record<string, unknown>)?.id || result?.id;
    return id ? String(id) : null;
  } catch (err) {
    console.error('[VitalStats] Failed to create record:', err);
    return null;
  }
}

/**
 * Update an existing onboarding record with plan/tech data (after Step 6).
 */
export async function updatePlanSelection(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  const plugin = getPlugin();
  if (!plugin || !recordId) return;

  try {
    const mutation = plugin.mutation().switchTo(MODEL_NAME);
    mutation.update({ id: recordId }, {
      technical_level: data.technical_level || '',
      workflow_volume: data.workflow_volume || '',
      recommended_plan: data.recommended_plan || '',
      final_plan: data.final_plan || data.recommended_plan || data.initial_plan,
      updated_at: new Date().toISOString(),
    });
    await mutation.execute(true).toPromise();
  } catch (err) {
    console.error('[VitalStats] Failed to update plan selection:', err);
  }
}

/**
 * Update with add-on selections and cost summary (after Step 13).
 */
export async function updateAddons(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  const plugin = getPlugin();
  if (!plugin || !recordId) return;

  const costs = calculateCosts(data);
  const activePlan = getActivePlan(data);

  try {
    const mutation = plugin.mutation().switchTo(MODEL_NAME);
    mutation.update({ id: recordId }, {
      billing: data.billing,
      credential_setup: data.credential_setup || 'self',
      ai_agent_setup: data.ai_agent_setup || 'self',
      workflow_setup: data.workflow_setup || 'self',
      has_openrouter: data.has_openrouter ? 'true' : 'false',
      local_hosting: data.local_hosting ? 'true' : 'false',
      website_hosting: data.website_hosting ? 'true' : 'false',
      detected_cms: data.detected_cms || '',
      active_plan: activePlan,
      monthly_cost: String(costs.monthly),
      onetime_cost: String(costs.oneTime),
      updated_at: new Date().toISOString(),
    });
    await mutation.execute(true).toPromise();
  } catch (err) {
    console.error('[VitalStats] Failed to update add-ons:', err);
  }
}

/**
 * Update with business profile data (after Step 15).
 */
export async function updateBusinessProfile(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  const plugin = getPlugin();
  if (!plugin || !recordId) return;

  try {
    const mutation = plugin.mutation().switchTo(MODEL_NAME);
    mutation.update({ id: recordId }, {
      business_summary: data.business_summary || '',
      team_size: data.team_size || '',
      roles: data.roles.join(', '),
      automation_areas: data.automation_areas.join(', '),
      updated_at: new Date().toISOString(),
    });
    await mutation.execute(true).toPromise();
  } catch (err) {
    console.error('[VitalStats] Failed to update business profile:', err);
  }
}

/**
 * Final update on completion (Step 16).
 */
export async function markComplete(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  const plugin = getPlugin();
  if (!plugin || !recordId) return;

  const needsBooking =
    data.credential_setup === 'assisted' ||
    data.ai_agent_setup === 'assisted' ||
    data.workflow_setup === 'assisted';

  try {
    const mutation = plugin.mutation().switchTo(MODEL_NAME);
    mutation.update({ id: recordId }, {
      status: 'completed',
      needs_booking: needsBooking ? 'true' : 'false',
      completed_at: new Date().toISOString(),
    });
    await mutation.execute(true).toPromise();
  } catch (err) {
    console.error('[VitalStats] Failed to mark complete:', err);
  }
}

/**
 * Check if a slug is already taken.
 * Returns true if available, false if taken.
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  if (!slug || slug.length < 3) return false;

  const plugin = getPlugin();
  // If SDK isn't ready, default to available so we don't block the user
  if (!plugin) return true;

  try {
    const model = plugin.switchTo(MODEL_NAME);
    const result = await model
      .query()
      .select(['slug'])
      .where('slug', '=', slug)
      .where('status', '!=', 'abandoned')
      .limit(1)
      .fetchAllRecords()
      .pipe(window.toMainInstance(true))
      .toPromise();

    // If no matching records, slug is available
    if (!result || Object.keys(result).length === 0) {
      return true;
    }
    return false;
  } catch (err) {
    console.error('[VitalStats] Slug check failed:', err);
    // Default to available on error so we don't block the user
    return true;
  }
}
