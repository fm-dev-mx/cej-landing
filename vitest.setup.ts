import '@testing-library/jest-dom/vitest';
import { vi, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Next.js 'server-only' for tests
vi.mock('server-only', () => ({}));

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
