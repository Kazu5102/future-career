// Reference to vite/client removed to fix "Cannot find type definition file" error
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly BASE_URL: string;
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
