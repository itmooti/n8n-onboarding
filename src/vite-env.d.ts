/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VITALSYNC_API_KEY: string;
  readonly VITE_VITALSYNC_SLUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
