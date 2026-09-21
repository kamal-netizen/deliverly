import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json, so tests import modules by the
    // same specifier the application uses. Done by hand rather than via
    // vite-tsconfig-paths, which is ESM-only and cannot be required from a
    // CommonJS config.
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Route handlers read env when called, not at import. These keep the
    // Supabase client constructible without reaching a real project; anything
    // that would otherwise hit the network is mocked in the test itself.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NEXT_PUBLIC_APP_URL: 'https://app.test',
      WEBHOOK_URL: 'https://app.test',
      SHOPIFY_API_KEY: 'test-api-key',
      SHOPIFY_API_SECRET: 'test-api-secret',
    },
  },
});
