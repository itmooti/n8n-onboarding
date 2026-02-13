import { useOnboardingStore } from '../store/onboarding';
import { StepHeading, Input } from '../components/ui';
import { NavButtons } from '../components/layout';

export function Step02BusinessDetails() {
  const { data, update, next, prev } = useOnboardingStore();

  return (
    <>
      <StepHeading
        title={
          data.websiteFetched
            ? "We found these details — look right?"
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
        {/* Colour swatches */}
        <div className="flex gap-3 col-span-full mb-4">
          <div
            className="w-12 h-12 rounded-[10px] border-2 border-gray-border"
            style={{ background: data.color1 }}
          />
          <div
            className="w-12 h-12 rounded-[10px] border-2 border-gray-border"
            style={{ background: data.color2 }}
          />
          <span className="self-center text-xs text-gray-500">
            Brand colours (click to edit)
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
        <Input
          label="SMS / Mobile Number"
          value={data.sms_number}
          onChange={(v) => update({ sms_number: v })}
          placeholder="+61 400 000 000"
          type="tel"
        />
      </div>

      <NavButtons
        onBack={prev}
        onNext={next}
        nextDisabled={!data.company_trading_name || !data.email}
      />
    </>
  );
}
