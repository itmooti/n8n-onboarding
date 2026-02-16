import type { VitalSyncPlugin } from '../types/sdk';
import type { OnboardingData } from '../types/onboarding';
import { COUNTRIES } from './countries';
import { getAffiliateConfig, isInquirePlan } from './affiliates';
import { getActivePlan } from './costs';

/**
 * VitalStats internal model name (prefixed).
 * switchTo() requires the internal name, not the publicName.
 */
const MODEL_NAME = 'ItmootiContact';

/** Map app plan keys to VitalStats enum values */
const PLAN_MAP: Record<string, string> = {
  'essentials': 'Essentials',
  'support-plus': 'Support Plus',
  'pro': 'Pro',
  'embedded': 'Embedded',
};

const TECH_LEVEL_MAP: Record<string, string> = {
  'self-sufficient': 'Self Sufficient',
  'some-help': 'Some Help',
  'full-service': 'Full Service',
};

const WORKFLOW_VOLUME_MAP: Record<string, string> = {
  'starter': 'Starter',
  'growing': 'Growing',
  'full-engine': 'Full Engine',
  'unsure': 'Unsure',
};

const SETUP_MAP: Record<string, string> = {
  'self': 'Self',
  'assisted': 'Assisted',
};

const BILLING_MAP: Record<string, string> = {
  'monthly': 'Monthly',
  'yearly': 'Yearly',
};

const TEAM_SIZE_MAP: Record<string, string> = {
  'solo': 'Solo',
  '2-5': '2-5',
  '6-20': '6-20',
  '20+': '20+',
};

/** Convert country name to ISO alpha-2 code for the schema */
function countryToCode(name: string): string {
  return COUNTRIES.find((c) => c.name === name)?.code || 'AU';
}

/**
 * Get the VitalStats plugin from the SDK.
 * Returns null if SDK isn't ready.
 */
function getPlugin(): VitalSyncPlugin | null {
  return window.getVitalStatsPlugin?.() ?? null;
}

/**
 * Build the full field map from OnboardingData → Contact schema columns.
 * Only includes fields that have actual data (skips nulls/empty).
 */
function buildFieldMap(data: OnboardingData | Partial<OnboardingData>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // Phase 1 — Business Discovery
  if (data.website_url) fields.website = data.website_url;
  if (data.slug) fields.subdomain_slug = data.slug;
  if (data.company_trading_name) fields.company = data.company_trading_name;
  if (data.company_legal_name) fields.business_name = data.company_legal_name;
  if (data.email) fields.email = data.email;
  if (data.sms_number) fields.sms_number = data.sms_number;
  if (data.contact_first_name) fields.first_name = data.contact_first_name;
  if (data.contact_last_name) fields.last_name = data.contact_last_name;
  if (data.country) fields.country = countryToCode(data.country);
  if (data.logo_url) fields.logo_url = data.logo_url;
  if (data.color1) fields.colour_primary = data.color1;
  if (data.color2) fields.colour_other = data.color2;

  // Phase 2 — Package Fit
  if (data.initial_plan) fields.initial_plan = PLAN_MAP[data.initial_plan] || '';
  if (data.technical_level) fields.technical_level = TECH_LEVEL_MAP[data.technical_level] || '';
  if (data.workflow_volume) fields.workflow_volume = WORKFLOW_VOLUME_MAP[data.workflow_volume] || '';
  if (data.recommended_plan) fields.recommended_plan = PLAN_MAP[data.recommended_plan] || '';
  const activePlan = data.final_plan || data.recommended_plan || data.initial_plan;
  if (activePlan) fields.final_plan = PLAN_MAP[activePlan] || '';

  // Phase 3 — Add-ons
  if (data.billing) fields.billing = BILLING_MAP[data.billing] || '';
  if (data.credential_setup) fields.credential_setup = SETUP_MAP[data.credential_setup] || '';
  if (data.ai_agent_setup) fields.ai_agent_setup = SETUP_MAP[data.ai_agent_setup] || '';
  if (data.workflow_setup) fields.workflow_setup = SETUP_MAP[data.workflow_setup] || '';
  if (data.has_openrouter !== null && data.has_openrouter !== undefined) fields.has_openrouter = !!data.has_openrouter;
  if (data.local_hosting !== null && data.local_hosting !== undefined) fields.local_hosting = !!data.local_hosting;
  if (data.website_hosting !== null && data.website_hosting !== undefined) fields.website_hosting = !!data.website_hosting;
  if (data.detected_cms) fields.detected_cms = data.detected_cms;

  // Phase 4 — Business Profile
  if (data.business_summary) fields.company_description = data.business_summary;
  if (data.team_size) fields.team_size = TEAM_SIZE_MAP[data.team_size] || '';
  if (data.roles && data.roles.length > 0) fields.roles = data.roles.join(', ');
  if (data.automation_areas && data.automation_areas.length > 0) fields.automation_areas = data.automation_areas.join(', ');

  // Payment
  if (data.billing_email) fields.Billing_Email = data.billing_email;
  if (data.payment_status) fields.payment_status = data.payment_status;
  if (data.transaction_id) fields.transaction_id = data.transaction_id;

  // Affiliate
  if (data.affiliate_code) {
    fields.affiliate_code = data.affiliate_code;
    const affConfig = getAffiliateConfig(data.affiliate_code);
    if (affConfig) {
      fields.last_referrer_id = affConfig.referrerId;
    }
  }

  return fields;
}

/**
 * Create a new Contact record (called after Step 3).
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
    const fields = buildFieldMap(data);
    fields.onboarding_status = 'In Progress';
    console.log('[VitalStats] Creating contact with fields:', fields);

    const model = plugin.switchTo(MODEL_NAME);
    if (!model) {
      console.error('[VitalStats] switchTo returned undefined for', MODEL_NAME);
      return null;
    }

    const mutation = model.mutation();
    const record = mutation.createOne(fields);
    const result = await mutation.execute(true).toPromise();

    if ((result as any)?.isCancelling) {
      console.error('[VitalStats] Create mutation was cancelled');
      return null;
    }

    // Debug: inspect what createOne actually returns
    console.log('[VitalStats] record object:', record);
    console.log('[VitalStats] record type:', typeof record);
    console.log('[VitalStats] record keys:', record ? Object.keys(record) : 'null');
    console.log('[VitalStats] record.id:', (record as any)?.id);
    console.log('[VitalStats] execute result:', result);

    // Try to get ID from the record object
    let id = (record as any)?.id;

    // Fallback: query for the record we just created using a unique field
    if (!id && data.email) {
      console.log('[VitalStats] ID not on record, querying by email:', data.email);
      try {
        const queryResult = await model
          .query()
          .select(['id'])
          .where('email', '=', data.email)
          .limit(1)
          .fetchAllRecords()
          .pipe(window.toMainInstance(true))
          .toPromise();
        console.log('[VitalStats] Query result:', queryResult);
        if (queryResult) {
          const records = Object.values(queryResult);
          if (records.length > 0) {
            id = (records[0] as any)?.id;
          }
        }
      } catch (queryErr) {
        console.error('[VitalStats] Fallback query failed:', queryErr);
      }
    }

    console.log('[VitalStats] Contact created, final id:', id);
    return id ? String(id) : null;
  } catch (err) {
    console.error('[VitalStats] Failed to create record:', err);
    return null;
  }
}

/**
 * Update the Contact record with all data collected so far.
 * Called at key save points — each save is comprehensive so
 * no data is lost if an earlier save was missed.
 */
export async function updateOnboardingRecord(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) {
    console.warn('[VitalStats] SDK not ready — skipping update');
    return;
  }
  if (!recordId) {
    console.warn('[VitalStats] No record ID — skipping update');
    return;
  }

  try {
    const fields = buildFieldMap(data);
    fields.onboarding_status = 'In Progress';
    console.log('[VitalStats] Updating contact', recordId, 'with fields:', Object.keys(fields));

    const model = plugin.switchTo(MODEL_NAME);
    if (!model) {
      console.error('[VitalStats] switchTo returned undefined for', MODEL_NAME);
      return;
    }

    const mutation = model.mutation();
    mutation.update((q: any) =>
      q.where('id', '=', Number(recordId)).set(fields)
    );
    const result = await mutation.execute(true).toPromise();

    if ((result as any)?.isCancelling) {
      console.error('[VitalStats] Update mutation was cancelled for id:', recordId);
    } else {
      console.log('[VitalStats] Contact updated successfully, id:', recordId);
    }
  } catch (err) {
    console.error('[VitalStats] Failed to update record:', err);
  }
}

/**
 * Final update on completion (Step 16).
 * Saves all data + marks the record as completed.
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
    const fields = buildFieldMap(data);
    const activePlan = getActivePlan(data);
    const isEmbeddedInquiry = isInquirePlan(activePlan, data.affiliate_code);
    fields.onboarding_status = isEmbeddedInquiry ? 'Embedded Inquiry' : 'Completed';
    fields.needs_booking = needsBooking;
    fields.onboarding_completed_at = Math.floor(Date.now() / 1000);
    console.log('[VitalStats] Marking complete', recordId, 'with fields:', Object.keys(fields));

    const model = plugin.switchTo(MODEL_NAME);
    if (!model) {
      console.error('[VitalStats] switchTo returned undefined for', MODEL_NAME);
      return;
    }

    const mutation = model.mutation();
    mutation.update((q: any) =>
      q.where('id', '=', Number(recordId)).set(fields)
    );
    const result = await mutation.execute(true).toPromise();

    if ((result as any)?.isCancelling) {
      console.error('[VitalStats] Mark complete mutation was cancelled for id:', recordId);
    } else {
      console.log('[VitalStats] Contact marked complete, id:', recordId);
    }
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
      .select(['subdomain_slug'])
      .where('subdomain_slug', '=', slug)
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
