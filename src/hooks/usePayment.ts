import { useState, useCallback } from 'react';
import type { OnboardingData } from '../types/onboarding';
import { buildProductsArray } from '../lib/products';

const PAYMENT_WEBHOOK_URL = import.meta.env.VITE_PAYMENT_WEBHOOK_URL || '';

export interface CardData {
  ccnumber: string;
  code: string;
  expire_month: number;
  expire_year: number;
}

interface PaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}

interface UsePaymentResult {
  processPayment: (card: CardData, data: OnboardingData) => Promise<PaymentResult>;
  loading: boolean;
  error: string | null;
}

export function usePayment(): UsePaymentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(
    async (card: CardData, data: OnboardingData): Promise<PaymentResult> => {
      if (!PAYMENT_WEBHOOK_URL) {
        return { success: false, error: 'Payment is not configured' };
      }

      if (!data.vitalsync_record_id) {
        return { success: false, error: 'Missing contact record. Please go back and try again.' };
      }

      setLoading(true);
      setError(null);

      try {
        const products = buildProductsArray(data);
        const externalOrderId = `AWE-${data.vitalsync_record_id}-${Date.now()}`;

        const payload = {
          contact_id: Number(data.vitalsync_record_id),
          external_order_id: externalOrderId,
          products,
          billing: data.billing,
          payer: {
            ccnumber: card.ccnumber,
            code: card.code,
            expire_month: card.expire_month,
            expire_year: card.expire_year,
          },
        };

        const response = await fetch(PAYMENT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const msg = result.error || `Payment failed (${response.status})`;
          setError(msg);
          setLoading(false);
          return { success: false, error: msg };
        }

        setLoading(false);
        return {
          success: true,
          transaction_id: result.transaction_id || externalOrderId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment request failed';
        setError(message);
        setLoading(false);
        return { success: false, error: message };
      }
    },
    [],
  );

  return { processPayment, loading, error };
}
