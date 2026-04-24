/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 由 vite.config.ts 的 define 注入
declare const __APP_VERSION__: string
declare const __APP_NAME__: string
