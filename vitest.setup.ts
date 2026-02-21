// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Fix Zod validation error by providing required env var
process.env.NEXT_PUBLIC_PIXEL_ID = 'test-pixel-id';

// Automatic cleanup after each test to avoid side effects
afterEach(() => {
    cleanup();
});
