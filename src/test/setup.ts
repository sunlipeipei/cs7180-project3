import { config } from 'dotenv';
import { resolve } from 'path';
import '@testing-library/jest-dom/vitest';
import '../lib/polyfills/promiseTry';

// Load .env from project root for integration tests
config({ path: resolve(process.cwd(), '.env') });
