declare global {
  interface Window {
    initVitalStatsSDK: (options: {
      slug: string;
      apiKey: string;
      isDefault?: boolean;
    }) => { toPromise: () => Promise<{ plugin?: VitalSyncPlugin }> };
    getVitalStatsPlugin: () => VitalSyncPlugin | undefined;
    toMainInstance: (flag: boolean) => <T>(source: T) => T;
  }
}

export interface VitalSyncPlugin {
  switchTo: (modelName: string) => VitalSyncModel;
  mutation: () => VitalSyncMutation;
  getSession: () => unknown;
}

export interface VitalSyncModel {
  query: () => VitalSyncQuery;
  mutation: () => VitalSyncMutation;
  subscribe: (callback: (model: unknown) => void) => { unsubscribe: () => void };
}

export interface VitalSyncQuery {
  select: (fields: string[]) => VitalSyncQuery;
  where: (field: string | ((q: VitalSyncQuery) => VitalSyncQuery), operatorOrValue?: string | unknown, value?: unknown) => VitalSyncQuery;
  orWhere: (field: string | ((q: VitalSyncQuery) => VitalSyncQuery), operatorOrValue?: string | unknown, value?: unknown) => VitalSyncQuery;
  andWhere: (field: string | ((q: VitalSyncQuery) => VitalSyncQuery), operatorOrValue?: string | unknown, value?: unknown) => VitalSyncQuery;
  limit: (count: number | string) => VitalSyncQuery;
  offset: (count: number | string) => VitalSyncQuery;
  noDestroy: () => VitalSyncQuery;
  destroy: () => void;
  fromGraphql: (graphql: string) => VitalSyncQuery;
  field: (path: string | string[], alias: string) => VitalSyncQuery;
  fetchAllRecords: () => {
    pipe: <T>(fn: T) => { toPromise: () => Promise<Record<string, unknown> | null> };
  };
  fetchOneRecord: () => {
    pipe: <T>(fn: T) => { toPromise: () => Promise<unknown | null> };
  };
  fetchDirect: () => { toPromise: () => Promise<unknown> };
  fetch: (options?: { variables?: Record<string, unknown> }) => {
    pipe: <T>(fn: T) => { toPromise: () => Promise<unknown> };
    toPromise: () => Promise<unknown>;
  };
  subscribe: () => {
    subscribe: (callback: (payload: unknown) => void) => { unsubscribe: () => void };
  };
}

export interface VitalSyncMutation {
  switchTo: (modelName: string) => VitalSyncMutation;
  createOne: (data: Record<string, unknown>) => unknown;
  update: (queryOrRecord: unknown, data?: Record<string, unknown>) => VitalSyncMutation;
  delete: (queryOrRecord: unknown) => VitalSyncMutation;
  execute: (commit: boolean) => { toPromise: () => Promise<unknown> };
}
