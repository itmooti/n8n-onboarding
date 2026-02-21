import type { OnboardingData } from '../types/onboarding';
import { COUNTRIES } from './countries';

/** GraphQL endpoint and API key for direct HTTP calls */
const GQL_URL = 'https://itmooti.vitalstats.app/api/v1/graphql';
const GQL_KEY = import.meta.env.VITE_VITALSYNC_API_KEY || '';

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
 * Execute a GraphQL mutation/query against the VitalStats API.
 */
async function gql<T = any>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Api-Key': GQL_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    const msgs = json.errors.map((e: any) => e.message || JSON.stringify(e));
    console.error('[VitalStats GQL] Errors:', msgs);
    return null;
  }
  return json.data;
}

/**
 * Build the full field map from OnboardingData → Contact schema columns.
 * Only includes fields that have actual data (skips nulls/empty).
 *
 * NOTE: last_referrer_id is excluded — setting FK relationship fields via
 * createOne/GraphQL causes a 500 error. The referrer must be set separately.
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

  // Affiliate code
  if (data.affiliate_code) fields.aff_code = data.affiliate_code;

  return fields;
}

/**
 * Look up an existing contact by email.
 * Returns the numeric ID if found, null otherwise.
 */
async function findContactByEmail(email: string): Promise<string | null> {
  if (!email) return null;

  try {
    // CRITICAL: use getContacts (plural) with inline query — see MEMORY.md
    const result = await gql<{ getContacts: { id: number }[] }>(
      `query getContacts {
        getContacts(query: [{ where: { email: "${email}", _OPERATOR_: eq } }], limit: 1) { id }
      }`,
      {},
    );

    const contact = result?.getContacts?.[0];
    if (contact?.id) {
      console.log('[VitalStats] Found existing contact by email, id:', contact.id);
      return String(contact.id);
    }
    return null;
  } catch (err) {
    console.error('[VitalStats] Email lookup failed:', err);
    return null;
  }
}

/**
 * Create a new Contact record via GraphQL.
 * If the contact already exists (e.g. duplicate email → 400 error),
 * falls back to looking up the existing contact and updating it.
 * Returns the server-assigned numeric ID.
 */
export async function createOnboardingRecord(
  data: Partial<OnboardingData>,
): Promise<string | null> {
  try {
    const fields = buildFieldMap(data);
    fields.onboarding_status = 'In Progress';
    console.log('[VitalStats] Creating contact with fields:', Object.keys(fields));

    const result = await gql<{ createContact: { id: number; email: string } }>(
      `mutation createContact($payload: ContactCreateInput) {
        createContact(payload: $payload) { id email }
      }`,
      { payload: fields },
    );

    if (result?.createContact?.id) {
      const id = String(result.createContact.id);
      console.log('[VitalStats] Contact created, id:', id);
      return id;
    }

    // Create failed (likely duplicate email) — look up the existing contact
    // and return their ID so subsequent save points can update them
    console.warn('[VitalStats] Create returned no ID — looking up existing contact by email');
    const existingId = await findContactByEmail(data.email || '');
    if (existingId) {
      console.log('[VitalStats] Using existing contact, id:', existingId);
      return existingId;
    }

    console.error('[VitalStats] Create failed and no existing contact found');
    return null;
  } catch (err) {
    console.error('[VitalStats] Failed to create record:', err);
    return null;
  }
}

/**
 * Update the Contact record via GraphQL with all data collected so far.
 * Called at key save points — each save is comprehensive so
 * no data is lost if an earlier save was missed.
 */
export async function updateOnboardingRecord(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  if (!recordId) {
    console.warn('[VitalStats] No record ID — skipping update');
    return;
  }

  try {
    const fields = buildFieldMap(data);
    // Don't set onboarding_status here — it's set to 'In Progress' at creation
    // and only markComplete should change it to 'Completed'. Setting it here
    // causes a race condition where a late-arriving update overwrites 'Completed'.
    console.log('[VitalStats] Updating contact', recordId, 'with fields:', Object.keys(fields));

    // CRITICAL: query must be inline (not a $variable) with _OPERATOR_ — passing
    // query as a GraphQL variable silently ignores the where clause and updates
    // all contacts instead of the targeted one.
    const numericId = Number(recordId);
    const result = await gql<{ updateContact: { id: number } }>(
      `mutation updateContact($payload: ContactUpdateInput) {
        updateContact(payload: $payload, query: [{ where: { id: ${numericId}, _OPERATOR_: eq } }]) { id }
      }`,
      { payload: fields },
    );

    if (result?.updateContact) {
      if (result.updateContact.id !== numericId) {
        console.error('[VitalStats] TARGETING ERROR: requested', numericId, 'but API updated', result.updateContact.id);
        return;
      }
      console.log('[VitalStats] Contact updated successfully, id:', result.updateContact.id);
    } else {
      console.error('[VitalStats] Update returned no result for id:', recordId);
    }
  } catch (err) {
    console.error('[VitalStats] Failed to update record:', err);
  }
}

/**
 * Final update on completion (Step 16).
 * Uses the same comprehensive payload as updateOnboardingRecord
 * (which correctly targets a single contact) plus completion fields.
 */
export async function markComplete(
  recordId: string,
  data: OnboardingData,
): Promise<void> {
  if (!recordId) return;

  const needsBooking =
    data.credential_setup === 'assisted' ||
    data.ai_agent_setup === 'assisted' ||
    data.workflow_setup === 'assisted';

  try {
    // Use the full field map (same as updateOnboardingRecord) plus completion fields
    const fields = buildFieldMap(data);
    fields.onboarding_status = 'Completed';
    fields.needs_booking = needsBooking;
    fields.onboarding_completed_at = Math.floor(Date.now() / 1000);

    console.log('[VitalStats] Marking complete', recordId, 'with fields:', Object.keys(fields));

    // CRITICAL: query must be inline (not a $variable) with _OPERATOR_ — passing
    // query as a GraphQL variable silently ignores the where clause.
    const numericId = Number(recordId);
    const result = await gql<{ updateContact: { id: number } }>(
      `mutation updateContact($payload: ContactUpdateInput) {
        updateContact(payload: $payload, query: [{ where: { id: ${numericId}, _OPERATOR_: eq } }]) { id }
      }`,
      { payload: fields },
    );

    if (result?.updateContact) {
      if (result.updateContact.id !== numericId) {
        console.error('[VitalStats] TARGETING ERROR: requested', numericId, 'but API updated', result.updateContact.id);
        return;
      }
      console.log('[VitalStats] Contact marked complete, id:', result.updateContact.id);
    } else {
      console.error('[VitalStats] Mark complete returned no result for id:', recordId);
    }
  } catch (err) {
    console.error('[VitalStats] Failed to mark complete:', err);
  }
}

const SLUG_CHECK_URL = 'https://vitalstats.app/api/v1/graphql?puid=koYcEWvTIBHAgYsWEnLC1';
const SLUG_API_KEY = 'XiEU9ISzcMp8xDMIVDwt0';

/**
 * Check if a slug is already taken via VitalStats API.
 * Returns true if available, false if taken.
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  if (!slug || slug.length < 3) return false;

  try {
    const response = await fetch(`${SLUG_CHECK_URL}&slug=${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Api-Key': SLUG_API_KEY },
    });

    const json = await response.json();
    // If data array has a match, slug is taken
    return !json?.data?.length;
  } catch (err) {
    console.error('[VitalStats] Slug check failed:', err);
    // Default to available on error so we don't block the user
    return true;
  }
}
