import { useState, useEffect, useCallback } from 'react';
import type { VitalSyncPlugin } from '../types/sdk';

export type ConnectionStatus = 'loading' | 'connected' | 'error' | 'disconnected';

export interface UseVitalSyncResult {
  plugin: VitalSyncPlugin | null;
  status: ConnectionStatus;
  error: string | null;
  connect: () => Promise<void>;
}

const CONFIG = {
  slug: import.meta.env.VITE_VITALSYNC_SLUG || '',
  apiKey: import.meta.env.VITE_VITALSYNC_API_KEY || '',
  isDefault: true,
};

function waitForSDK(maxWait = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkInterval = setInterval(() => {
      if (typeof window.initVitalStatsSDK === 'function') {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checkInterval);
        reject(new Error('VitalStats SDK failed to load'));
      }
    }, 100);
  });
}

export function useVitalSync(): UseVitalSyncResult {
  const [plugin, setPlugin] = useState<VitalSyncPlugin | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!CONFIG.slug || !CONFIG.apiKey) {
      setStatus('disconnected');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await waitForSDK();

      const initResult = await window.initVitalStatsSDK({
        slug: CONFIG.slug,
        apiKey: CONFIG.apiKey,
        isDefault: CONFIG.isDefault,
      }).toPromise();

      const pluginInstance = initResult?.plugin || window.getVitalStatsPlugin?.();

      if (!pluginInstance) {
        throw new Error('Plugin not available after initialization');
      }

      setPlugin(pluginInstance);
      setStatus('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStatus('error');
      setPlugin(null);
    }
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  return { plugin, status, error, connect };
}
