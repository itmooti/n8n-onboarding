import { useState } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { Button, StepHeading } from '../components/ui';
import { PLANS, BOOKING_URL } from '../lib/constants';
import { getActivePlan } from '../lib/costs';
import { buildOrderLineItems, calculateCheckoutTotals } from '../lib/products';
import { usePayment } from '../hooks/usePayment';
import { markComplete } from '../lib/api';
import { COUNTRIES } from '../lib/countries';
import { Loader2, CreditCard, Lock, MapPin, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

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

  // ──────────────── POST-PAYMENT CONFIRMATION ────────────────
  if (paymentComplete) {
    return <ConfirmationView />;
  }

  // ──────────────── PRE-PAYMENT CHECKOUT ────────────────
  const lineItems = buildOrderLineItems(data);
  const { dueToday, recurring, period } = calculateCheckoutTotals(data);
  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];

  const rawDigits = cardNumber.replace(/\s/g, '');
  const isValid =
    rawDigits.length >= 13 &&
    rawDigits.length <= 19 &&
    expiryMonth !== '' &&
    expiryYear !== '' &&
    cvv.length >= 3 &&
    cvv.length <= 4 &&
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
      update({
        payment_status: 'completed',
        transaction_id: result.transaction_id || null,
        payment_error: null,
        completed_at: new Date().toISOString(),
      });

      // Mark complete in VitalStats
      if (data.vitalsync_record_id) {
        markComplete(data.vitalsync_record_id, {
          ...data,
          payment_status: 'completed',
          transaction_id: result.transaction_id || null,
          payment_error: null,
          completed_at: new Date().toISOString(),
        });
      }
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
        <div className="flex justify-center mb-4">
          <a
            href="http://www.eway.com.au/secure-site-seal?i=12&s=7&pid=7b219f54-20a0-48d5-ba3c-4180844729b3&theme=0"
            title="Eway Payment Gateway"
            target="_blank"
            rel="nofollow noreferrer"
          >
            <img
              alt="Eway Payment Gateway"
              src="https://www.eway.com.au/developer/payment-code/verified-seal.php?img=12&size=7&pid=7b219f54-20a0-48d5-ba3c-4180844729b3&theme=0"
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
    </>
  );
}

/** Post-payment celebration view (original Step 16 content) */
function ConfirmationView() {
  const { data } = useOnboardingStore();

  const activePlan = getActivePlan(data);
  const plan = PLANS[activePlan];
  const { recurring, period } = calculateCheckoutTotals(data);
  const needsBooking =
    data.credential_setup === 'assisted' ||
    data.ai_agent_setup === 'assisted' ||
    data.workflow_setup === 'assisted';

  const handleCTA = () => {
    window.location.href = BOOKING_URL;
  };

  return (
    <div className="text-center py-3 sm:py-5">
      <div className="text-[48px] sm:text-[64px] mb-3 sm:mb-4">&#x1F389;</div>

      <h2 className="text-[24px] sm:text-[32px] font-extrabold text-navy m-0 font-heading leading-[1.15]">
        {needsBooking
          ? "Payment successful! Let's book your first session."
          : 'Welcome to Awesomate!'}
      </h2>

      <p className="text-gray-500 text-sm sm:text-base mt-3 leading-relaxed max-w-[480px] mx-auto">
        {needsBooking
          ? `Click below to choose a time that works for you. We'll send a confirmation to ${data.email}.`
          : `Your n8n instance is being provisioned at ${data.slug}.awesomate.io — you'll receive an email when it's ready (usually within the hour).`}
      </p>

      {/* Summary card */}
      <div className="bg-white border-2 border-gray-border rounded-2xl p-4 sm:p-6 max-w-[400px] mx-auto mt-5 sm:mt-7 text-left">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Plan</span>
          <span className="font-bold text-sm text-navy">{plan.name}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">
            {period === 'year' ? 'Yearly' : 'Monthly'}
          </span>
          <span className="font-bold text-sm text-navy">
            AU${recurring.toLocaleString()}/{period === 'year' ? 'yr' : 'mo'}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[12px] uppercase tracking-[0.08em]">Workspace</span>
          <span className="font-bold text-xs sm:text-sm text-accent font-mono truncate max-w-[180px]">
            {data.slug}.awesomate.io
          </span>
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleCTA} className="text-[16px] px-12 py-4">
          {needsBooking ? 'Book My Session' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  );
}
