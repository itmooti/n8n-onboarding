import { useState } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { StepHeading, Input, Select, ColorPicker } from '../components/ui';
import { NavButtons } from '../components/layout';
import { useGeoDetect } from '../hooks/useGeoDetect';
import { COUNTRIES, getPhonePrefix, isOnlyPrefix } from '../lib/countries';
import { createOnboardingRecord } from '../lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

const countryOptions = COUNTRIES.map((c) => ({
  value: c.name,
  label: `${c.flag}  ${c.name}`,
}));

export function Step02BusinessDetails() {
  const { data, update, next, prev } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect country from IP (skips if website scraper already set it)
  useGeoDetect();

  const handleCountryChange = (country: string) => {
    const newPrefix = getPhonePrefix(country);
    // Auto-update phone prefix if the field is empty or only contains a prefix
    if (isOnlyPrefix(data.sms_number)) {
      update({ country, sms_number: newPrefix + ' ' });
    } else {
      update({ country });
    }
  };

  const handleNext = async () => {
    // If we already have a record ID (e.g. user went back), just advance
    if (data.vitalsync_record_id) {
      next();
      return;
    }

    setSaving(true);
    setError(null);

    const id = await createOnboardingRecord(data);

    if (id) {
      update({ vitalsync_record_id: id });
      setSaving(false);
      next();
    } else {
      setSaving(false);
      setError('We couldn\u2019t save your details. Please check your connection and try again.');
    }
  };

  const phonePlaceholder = `${getPhonePrefix(data.country)} 400 000 000`;

  const formValid = !!(
    data.company_trading_name &&
    data.email &&
    data.country &&
    data.sms_number &&
    !isOnlyPrefix(data.sms_number)
  );

  return (
    <>
      <StepHeading
        title={
          data.websiteFetched
            ? "We found these details \u2014 look right?"
            : 'Tell us about your business'
        }
        subtitle={
          data.websiteFetched
            ? "Everything's editable if something's off."
            : 'Fill in your basic business details below.'
        }
      />

      {data.websiteFetched && (
        <div className="flex gap-4 items-center p-4 bg-gradient-to-br from-success/[0.06] to-success/[0.02] rounded-xl border border-success/20 mb-6">
          <span className="text-xl">&#x2705;</span>
          <span className="text-green-800 text-sm font-semibold">
            Auto-filled from your website
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-0">
        {/* Brand colour pickers */}
        <div className="flex gap-4 items-end col-span-full mb-5">
          <ColorPicker
            color={data.color1}
            onChange={(c) => update({ color1: c })}
            label="Primary"
          />
          <ColorPicker
            color={data.color2}
            onChange={(c) => update({ color2: c })}
            label="Secondary"
          />
          <span className="self-center text-[11px] text-gray-400 font-medium pb-1">
            Brand colours
          </span>
        </div>

        <Input
          label="Company Trading Name"
          value={data.company_trading_name}
          onChange={(v) => update({ company_trading_name: v })}
          placeholder="Acme Corp"
          required
        />
        <Input
          label="Company Legal Name"
          value={data.company_legal_name}
          onChange={(v) => update({ company_legal_name: v })}
          placeholder="Acme Corp Pty Ltd (optional)"
        />
        <Input
          label="Contact First Name"
          value={data.contact_first_name}
          onChange={(v) => update({ contact_first_name: v })}
          placeholder="Jane"
          required
        />
        <Input
          label="Contact Last Name"
          value={data.contact_last_name}
          onChange={(v) => update({ contact_last_name: v })}
          placeholder="Smith"
          required
        />
        <Input
          label="Email Address"
          value={data.email}
          onChange={(v) => update({ email: v })}
          placeholder="jane@acmecorp.com"
          type="email"
          required
        />
        <Select
          label="Country"
          value={data.country}
          onChange={handleCountryChange}
          options={countryOptions}
        />
        <Input
          label="SMS / Mobile Number"
          value={data.sms_number}
          onChange={(v) => update({ sms_number: v })}
          placeholder={phonePlaceholder}
          type="tel"
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 flex gap-3 items-start">
          <AlertCircle size={18} className="text-accent mt-0.5 flex-shrink-0" />
          <div className="text-accent/80 text-sm">{error}</div>
        </div>
      )}

      <NavButtons
        onBack={prev}
        onNext={handleNext}
        nextLabel={saving ? undefined : 'Continue'}
        nextDisabled={!formValid || saving}
      />

      {saving && (
        <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Saving your details...
        </div>
      )}
    </>
  );
}
