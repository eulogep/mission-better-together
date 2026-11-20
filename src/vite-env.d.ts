/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'test' | 'production';
  readonly VITE_ENABLE_SW: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
