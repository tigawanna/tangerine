/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_BETTER_AUTH_URL?: string;
  readonly MAIN_VITE_SIGN_IN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
