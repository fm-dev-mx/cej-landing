// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Fix Zod validation error by providing required env var
process.env.NEXT_PUBLIC_PIXEL_ID = 'test-pixel-id';

// Global ResizeObserver Mock
beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
});

// Automatic cleanup after each test to avoid side effects
afterEach(() => {
    cleanup();
});
