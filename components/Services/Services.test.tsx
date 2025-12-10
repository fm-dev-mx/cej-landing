// File: components/Services/Services.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Services from './Services';

// --- Content Config Mock ---
// This is vital so the test doesn't depend on actual copy changes
vi.mock('@/config/content', () => ({
    LANDING_CONTENT: {
        services: {
            title: 'Servicios Test',
            titleHighlight: 'Premium',
            subtitle: 'Subtítulo de prueba',
            items: [
                {
                    id: 's1',
                    title: 'Servicio 1',
                    desc: 'Descripción 1',
                    icon: '🏗️',
                    ariaLabel: 'icon-1'
                },
                {
                    id: 's2',
                    title: 'Servicio 2',
                    desc: 'Descripción 2',
                    icon: '🚛',
                    ariaLabel: 'icon-2'
                }
            ]
        }
    }
}));

// Mock UI Card component to simplify the render tree
vi.mock('@/components/ui/Card/Card', () => ({
    Card: {
        Root: ({ children, className }: any) => <div data-testid="service-card" className={className}>{children}</div>,
        Body: ({ children }: any) => <div>{children}</div>
    }
}));

describe('Services Component', () => {
    it('renders title and subtitle from configuration', () => {
        render(<Services />);

        // Verify header texts
        expect(screen.getByText(/Servicios Test/i)).toBeDefined();
        expect(screen.getByText(/Premium/i)).toBeDefined();
        expect(screen.getByText(/Subtítulo de prueba/i)).toBeDefined();
    });

    it('renders the correct list of service cards', () => {
        render(<Services />);

        // There should be 2 cards according to our mock
        const cards = screen.getAllByTestId('service-card');
        expect(cards).toHaveLength(2);

        // Verify content of a card
        expect(screen.getByText('Servicio 1')).toBeDefined();
        expect(screen.getByText('Descripción 1')).toBeDefined();
    });
});
