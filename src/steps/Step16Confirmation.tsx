import { useState } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { Button, StepHeading } from '../components/ui';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { PLANS, BOOKING_URL } from '../lib/constants';
import { getActivePlan } from '../lib/costs';
import { buildOrderLineItems, calculateCheckoutTotals } from '../lib/products';
import { usePayment } from '../hooks/usePayment';
import { markComplete } from '../lib/api';
import { provisionAccount } from '../lib/provisioning';
import { COUNTRIES } from '../lib/countries';
import { isInquirePlan, getAffiliateConfig } from '../lib/affiliates';
import { getStepVideo } from '../lib/videos';
import { Loader2, CreditCard, Lock, MapPin, AlertCircle, ShieldCheck, RefreshCw, CheckCircle2, Calendar, Users } from 'lucide-react';
import { GettingStartedGuide } from '../components/GettingStartedGuide';

/** Format card number with spaces every 4 digits */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function Step16Confirmation() {
  const { data, update, prev } = useOnboardingStore();
  const { processPayment, loading } = usePayment();

  // Local CC state — never stored in Zustand
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');

  // Billing address state
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState(data.country || 'Australia');

  const [localError, setLocalError] = useState<string | null>(null);

  const paymentComplete = data.payment_status === 'completed';
  const activePlan = getActivePlan(data);

  // ──────────────── POST-PAYMENT CONFIRMATION ────────────────
  if (paymentComplete) {
    return <ConfirmationView />;
  }

  // ──────────────── EMBEDDED TEAM INQUIRY (affiliate "Inquire" plan) ────────────────
  if (isInquirePlan(activePlan, data.affiliate_code)) {
    return <EmbeddedInquiryView />;
  }

  // ──────────────── PRE-PAYMENT CHECKOUT ────────────────
  const lineItems = buildOrderLineItems(data);
  const { dueToday, recurring, period } = calculateCheckoutTotals(data);
  const plan = PLANS[activePlan];

  const rawDigits = cardNumber.replace(/\s/g, '');
  const isValid =
    rawDigits.length >= 13 &&
    rawDigits.length <= 19 &&
    expiryMonth !== '' &&
    expiryYear !== '' &&
    cvv.length >= 3 &&
    cvv.length <= 4 &&
    data.billing_email.trim() !== '' &&
    address.trim() !== '' &&
    city.trim() !== '' &&
    zip.trim() !== '' &&
    country !== '';

  const handlePayment = async () => {
    setLocalError(null);

    if (!isValid) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    // Look up country code from name
    const countryEntry = COUNTRIES.find((c) => c.name === country);
    const countryCode = countryEntry?.code || 'AU';

    const result = await processPayment(
      {
        ccnumber: rawDigits,
        code: cvv,
        expire_month: Number(expiryMonth),
        expire_year: Number(expiryYear),
      },
      {
        address: address.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        country: countryCode,
      },
      data,
    );

    if (result.success) {
      // Mark complete in VitalStats (fire-and-forget — don't block confirmation)
      if (data.vitalsync_record_id) {
        markComplete(data.vitalsync_record_id, data);
      }

      // Provision n8n + VitalSync account via webhook (awaited)
      const provision = await provisionAccount(data);
      if (!provision.success) {
        console.error('[Provisioning] Failed:', provision.error);
      }

      update({
        payment_status: 'completed',
        transaction_id: result.transaction_id || null,
        payment_error: null,
        completed_at: new Date().toISOString(),
      });

      // Scroll to top so user sees the confirmation screen
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLocalError(result.error || 'Payment was declined. Please try a different card.');
      update({
        payment_status: 'failed',
        payment_error: result.error || 'Payment declined',
      });
    }
  };

  // Generate month/year options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1).padStart(2, '0'),
  }));
  const currentYear = new Date().getFullYear() % 100;
  const years = Array.from({ length: 11 }, (_, i) => ({
    value: String(currentYear + i),
    label: String(currentYear + i),
  }));

  const inputClass =
    'w-full px-4 py-3 rounded-[10px] border-2 border-gray-border text-[15px] font-sans outline-none transition-all bg-white box-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,72,77,0.08)]';
  const selectClass =
    'w-full px-3 py-3 rounded-[10px] border-2 border-gray-border text-[15px] font-sans outline-none transition-all bg-white box-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(233,72,77,0.08)] appearance-none';
  const labelClass =
    'block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-[0.1em] font-sans';

  return (
    <>
      <StepHeading
        title="Complete Your Order"
        subtitle="Review your selections and enter your payment details."
      />

      {/* Order Summary */}
      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] overflow-hidden mb-5">
        {/* Plan header */}
        <div
          className="px-4 sm:px-7 py-4 sm:py-5 flex justify-between items-center"
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
          }}
        >
          <div>
            <div className="text-white/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em]">
              YOUR PLAN
            </div>
            <div className="text-white text-[18px] sm:text-[22px] font-extrabold font-heading">
              {plan.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em]">
              {data.billing === 'yearly' ? 'YEARLY' : 'MONTHLY'}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-7 py-4 sm:py-5">
          {/* Line items */}
          {lineItems.map((item, i) => (
            <div
              key={i}
              className="flex justify-between py-2.5 border-b border-gray-border last:border-0"
            >
              <span className="text-sm text-navy">{item.label}</span>
              <span className="text-sm font-bold text-navy">
                AU${item.amount.toLocaleString()}
                {item.recurring && (
                  <span className="text-gray-400 font-normal">/{item.period === 'year' ? 'yr' : 'mo'}</span>
                )}
                {!item.recurring && (
                  <span className="text-gray-400 font-normal text-xs ml-1">one-time</span>
                )}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-4 p-4 bg-gray-bg rounded-xl">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-500 text-sm">Due today</span>
              <span className="font-extrabold text-navy text-xl font-heading">
                AU${dueToday.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Then recurring</span>
              <span className="text-gray-400 text-xs font-semibold">
                AU${recurring.toLocaleString()}/{period === 'year' ? 'yr' : 'mo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-4 sm:p-7 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
            BILLING ADDRESS
          </span>
        </div>

        {/* Billing Email */}
        <div className="mb-3">
          <label className={labelClass}>
            Billing Email <span className="text-accent">*</span>
          </label>
          <input
            type="email"
            autoComplete="email"
            value={data.billing_email}
            onChange={(e) => update({ billing_email: e.target.value })}
            placeholder={data.email || 'billing@company.com'}
            className={inputClass}
          />
        </div>

        {/* Address line 1 */}
        <div className="mb-3">
          <label className={labelClass}>
            Address <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            autoComplete="address-line1"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street"
            className={inputClass}
          />
        </div>

        {/* Address line 2 */}
        <div className="mb-3">
          <label className={labelClass}>Address Line 2</label>
          <input
            type="text"
            autoComplete="address-line2"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Suite, unit, floor (optional)"
            className={inputClass}
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>
              City <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sydney"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State / Region</label>
            <input
              type="text"
              autoComplete="address-level1"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="NSW"
              className={inputClass}
            />
          </div>
        </div>

        {/* Postcode + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Postcode <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="2000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Country <span className="text-accent">*</span>
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
              className={selectClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Credit Card Form */}
      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-4 sm:p-7 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
            PAYMENT DETAILS
          </span>
        </div>

        {/* Card Number */}
        <div className="mb-4">
          <label className={labelClass}>
            Card Number <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="4444 3333 2222 1111"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Expiry + CVV row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>
              Month <span className="text-accent">*</span>
            </label>
            <select
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value)}
              autoComplete="cc-exp-month"
              className={selectClass}
            >
              <option value="">MM</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Year <span className="text-accent">*</span>
            </label>
            <select
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value)}
              autoComplete="cc-exp-year"
              className={selectClass}
            >
              <option value="">YY</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              CVV <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {localError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3 items-start">
          <AlertCircle size={18} className="text-accent mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-accent text-sm font-semibold mb-0.5">Payment Failed</div>
            <div className="text-accent/80 text-sm">{localError}</div>
          </div>
        </div>
      )}

      {/* Security & trust signals */}
      <div className="mb-5">
        {/* Eway site seal */}
        <div className="flex justify-center mb-4" id="eWAYBlock">
          <a
            href="https://www.eway.com.au/secure-site-seal?i=12&s=7&pid=7b219f54-20a0-48d5-ba3c-4180844729b3&theme=0"
            title="Eway Payment Gateway"
            target="_blank"
            rel="nofollow noreferrer"
          >
            <img
              alt="Eway Payment Gateway"
              src="https://www.eway.com.au/developer/payment-code/verified-seal.php?img=12&size=7&pid=7b219f54-20a0-48d5-ba3c-4180844729b3&theme=0"
              style={{ maxHeight: '70px' }}
            />
          </a>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="flex flex-col items-center gap-1">
            <Lock size={16} className="text-gray-400" />
            <span className="text-gray-400 text-[10px] font-semibold leading-tight">256-BIT SSL ENCRYPTION</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={16} className="text-gray-400" />
            <span className="text-gray-400 text-[10px] font-semibold leading-tight">PCI DSS COMPLIANT</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <RefreshCw size={16} className="text-gray-400" />
            <span className="text-gray-400 text-[10px] font-semibold leading-tight">CANCEL ANYTIME</span>
          </div>
        </div>

        <p className="text-center text-gray-400 text-[11px] leading-relaxed max-w-[400px] mx-auto">
          Your payment is processed securely by Eway. Your card details are encrypted and never stored on our servers. You can cancel your subscription at any time.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={prev}>
          Back
        </Button>
        <Button
          onClick={handlePayment}
          disabled={loading || !isValid}
          className="flex-1 text-[16px] py-4"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </span>
          ) : (
            `Pay AU$${dueToday.toLocaleString()} & Complete`
          )}
        </Button>
      </div>

      <CheckoutFooter />
    </>
  );
}

/** Embedded Team inquiry view — shown when affiliate plan has null pricing */
function EmbeddedInquiryView() {
  const { data, update, prev } = useOnboardingStore();
  const [submitting, setSubmitting] = useState(false);
  const affConfig = getAffiliateConfig(data.affiliate_code);

  const submitted = !!data.completed_at;

  const handleSubmit = async () => {
    setSubmitting(true);

    const now = new Date().toISOString();
    update({ completed_at: now });

    // Save to VitalStats as embedded inquiry
    if (data.vitalsync_record_id) {
      await markComplete(data.vitalsync_record_id, {
        ...data,
        completed_at: now,
      });
    }

    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="py-3 sm:py-5">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6 text-center">
          <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-3" />
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-navy m-0 font-heading leading-[1.15]">
            Request Submitted!
          </h2>
          <p className="text-blue-700 text-sm mt-2 font-medium">
            Our team will reach out to you shortly to discuss your Embedded Team setup.
          </p>
        </div>

        <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6">
          <h3 className="text-[16px] font-bold text-navy mb-3 font-heading">What happens next?</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">1</span>
              <span>You'll start on the <strong>Automations Pro</strong> plan so you can begin using n8n right away.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">2</span>
              <span>Our team will reach out to discuss your specific Embedded Team requirements.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">3</span>
              <span>Once confirmed, we'll transition your account to the full Embedded Team plan.</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            We'll send details to <strong>{data.email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StepHeading
        title="Embedded Team Plan"
        subtitle={affConfig ? `Exclusive offer via ${affConfig.name}` : undefined}
      />

      <div
        className="rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-5 text-center"
        style={{
          background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
        }}
      >
        <Users size={40} className="text-white/70 mx-auto mb-3" />
        <h3 className="text-[20px] sm:text-[24px] font-extrabold text-white mb-2 font-heading">
          Embedded Team
        </h3>
        <p className="text-white/60 text-sm leading-relaxed max-w-[420px] mx-auto">
          A dedicated automation architect embedded in your business. Custom-built workflows, continuous optimisation, and advanced AI features.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-5">
        <h3 className="text-[16px] font-bold text-navy mb-3 font-heading">Here's what happens next</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">1</span>
            <span>Submit your interest and our team will reach out to discuss your specific requirements.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">2</span>
            <span>You'll start on the <strong>Automations Pro</strong> plan immediately — no payment required now.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-orange text-white text-xs font-bold flex items-center justify-center">3</span>
            <span>Once your Embedded Team setup is confirmed, we'll transition your account and arrange billing.</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={prev}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 text-[16px] py-4"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit Embedded Team Request'
          )}
        </Button>
      </div>

      <CheckoutFooter />
    </>
  );
}

/** Post-payment confirmation view */
function ConfirmationView() {
  const { data } = useOnboardingStore();
  const video = getStepVideo(16);

  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const { dueToday, recurring, period } = calculateCheckoutTotals(data);

  // Show booking CTA if they purchased any $100 assisted setup add-on
  const hasAssistedSetup =
    data.credential_setup === 'assisted' ||
    data.ai_agent_setup === 'assisted' ||
    data.workflow_setup === 'assisted';

  // Build list of purchased add-ons for display
  const setupAddons: string[] = [];
  if (data.credential_setup === 'assisted') setupAddons.push('Credential Setup');
  if (data.ai_agent_setup === 'assisted') setupAddons.push('AI Agent Setup');
  if (data.workflow_setup === 'assisted') setupAddons.push('Workflow Setup');

  return (
    <div className="py-3 sm:py-5">
      {/* Confirmation video */}
      <div className="mb-6">
        <VideoPlayer title={video?.title || "You're All Set!"} duration={video?.duration || '0:08'} src={video?.src} />
      </div>

      {/* Success banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6 text-center">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
        <h2 className="text-[22px] sm:text-[28px] font-extrabold text-navy m-0 font-heading leading-[1.15]">
          Payment Successful!
        </h2>
        <p className="text-green-700 text-sm mt-2 font-medium">
          Your payment of AU${dueToday.toLocaleString()} has been processed successfully.
        </p>
        {data.transaction_id && (
          <p className="text-gray-400 text-xs mt-1 font-mono">
            Transaction ID: {data.transaction_id}
          </p>
        )}
      </div>

      {/* Workspace launch CTA + Getting Started Guide */}
      <GettingStartedGuide slug={data.slug} />

      {/* Order summary */}
      <div className="bg-white border-2 border-gray-border rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6">
        <h3 className="text-[16px] font-bold text-navy mb-3 font-heading">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Plan</span>
            <span className="font-bold text-sm text-navy">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Billing</span>
            <span className="font-bold text-sm text-navy">
              AU${recurring.toLocaleString()}/{period === 'year' ? 'yr' : 'mo'}
            </span>
          </div>
          {setupAddons.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Add-ons</span>
              <span className="font-bold text-sm text-navy">{setupAddons.join(', ')}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-border">
            <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Paid Today</span>
            <span className="font-extrabold text-navy font-heading">AU${dueToday.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Booking CTA for assisted setup add-ons */}
      {hasAssistedSetup && (
        <div
          className="rounded-[16px] sm:rounded-[20px] p-5 sm:p-7 mb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1128 60%, #161a38 100%)',
          }}
        >
          <Calendar size={32} className="text-white/80 mx-auto mb-3" />
          <h3 className="text-[18px] sm:text-[20px] font-bold text-white mb-2 font-heading">
            Book Your Setup Session
          </h3>
          <p className="text-white/60 text-sm mb-4 max-w-[380px] mx-auto">
            You've purchased {setupAddons.length === 1 ? setupAddons[0] : `${setupAddons.length} setup add-ons`}.
            Book a time with our team to get everything configured for you.
          </p>
          <Button
            onClick={() => { window.location.href = BOOKING_URL; }}
            className="text-[16px] px-10 py-4"
          >
            Book My Session
          </Button>
        </div>
      )}

      {/* Non-booking fallback CTA */}
      {!hasAssistedSetup && (
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Follow the guide above to set up your account. We'll also send a confirmation email to <strong>{data.email}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

/** Checkout page footer with logo, copyright, and legal links */
function CheckoutFooter() {
  return (
    <footer className="mt-10 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-6 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <img
          src="/awesomate-logo.svg"
          alt="Awesomate"
          className="w-[130px] h-auto grayscale opacity-30"
        />
        <div className="text-gray-300 text-[11px] sm:text-[12px]">
          &copy; {new Date().getFullYear()} Awesomate.ai. All rights reserved.
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://awesomate.ai/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-gray-600 text-[12px] font-medium transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://awesomate.ai/terms"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-gray-600 text-[12px] font-medium transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
