import { config } from 'dotenv';
import { resolve } from 'path';
import '@testing-library/jest-dom/vitest';

// Load .env from project root for integration tests
config({ path: resolve(process.cwd(), '.env') });
