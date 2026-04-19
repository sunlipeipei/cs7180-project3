import { config } from 'dotenv';
import { resolve } from 'path';
import '@testing-library/jest-dom/vitest';
import '../lib/polyfills/promiseTry';

// Mirror Next.js's env loading: .env first (non-secret defaults), then
// .env.local (secrets + overrides win on conflict). Integration tests rely
// on DATABASE_URL which now lives in .env.local.
// dotenv silently no-ops on missing files, so CI (where .env.local isn't
// present) keeps the process env vars injected by the runner.
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });
