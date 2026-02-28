// components/tracking/PageViewTracker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PageViewTracker } from './PageViewTracker';

// Mock dependencies
const mockTrackPageView = vi.fn();

vi.mock('@/lib/tracking/visitor', () => ({
    trackPageView: (...args: unknown[]) => mockTrackPageView(...args),
}));

vi.mock('@/hooks/useAttribution', () => ({
    useAttribution: () => ({ getStoredUtm: () => null }),
}));

let mockPathname = '/';
vi.mock('next/navigation', () => ({
    usePathname: () => mockPathname,
    useSearchParams: () => new URLSearchParams(),
}));

describe('PageViewTracker', () => {
    beforeEach(() => {
        mockTrackPageView.mockClear();
        mockPathname = '/';
    });

    it('calls trackPageView on initial render', () => {
        render(<PageViewTracker />);
        expect(mockTrackPageView).toHaveBeenCalledTimes(1);
    });

    it('calls trackPageView again when pathname changes', () => {
        const { rerender } = render(<PageViewTracker />);
        expect(mockTrackPageView).toHaveBeenCalledTimes(1);

        // Simulate pathname change
        mockPathname = '/cotizador';
        rerender(<PageViewTracker />);
        expect(mockTrackPageView).toHaveBeenCalledTimes(2);
    });

    it('renders null (no DOM output)', () => {
        const { container } = render(<PageViewTracker />);
        expect(container.innerHTML).toBe('');
    });
});
