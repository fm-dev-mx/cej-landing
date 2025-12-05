// components/Calculator/modals/LeadFormModal.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    describe,
    it,
    expect,
    vi,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
} from 'vitest';
import { LeadFormModal, type LeadQuoteDetails } from './LeadFormModal';

// Mock portal so the modal renders into the normal test DOM tree
vi.mock('react-dom', async () => {
    const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

// Mock useIdentity hook
vi.mock('@/hooks/useIdentity', () => ({
    useIdentity: () => ({
        visitorId: 'test-visitor-id',
        sessionId: 'test-session-id'
    }),
}));

let randomUUIDSpy: ReturnType<typeof vi.spyOn> | undefined;

describe('LeadFormModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    const mockQuoteDetails: LeadQuoteDetails = {
        summary: { total: 5000, volume: 5, product: 'Concreto 200' },
        context: { work_type: 'Losa' },
    };

    let originalFetch: typeof global.fetch | undefined;

    beforeAll(() => {
        const cryptoAny = globalThis.crypto as any;

        if (cryptoAny && typeof cryptoAny.randomUUID === 'function') {
            randomUUIDSpy = vi
                .spyOn(cryptoAny, 'randomUUID')
                .mockReturnValue('test-event-id');
        } else if (cryptoAny) {
            cryptoAny.randomUUID = vi.fn(() => 'test-event-id');
        }
    });

    afterAll(() => {
        if (randomUUIDSpy) {
            randomUUIDSpy.mockRestore();
        }
    });

    beforeEach(() => {
        vi.clearAllMocks();
        originalFetch = global.fetch;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.fetch = vi.fn() as any;
    });

    afterEach(() => {
        if (originalFetch) {
            global.fetch = originalFetch;
        }
    });

    it('does not render when isOpen is false', () => {
        render(
            <LeadFormModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />,
        );

        expect(screen.queryByLabelText(/Nombre completo/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Teléfono/i)).not.toBeInTheDocument();
    });

    it('renders form fields and privacy checkbox when open', () => {
        render(
            <LeadFormModal
                isOpen
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />,
        );

        expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
        expect(screen.getByText(/Aviso de Privacidad/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Continuar a WhatsApp/i }),
        ).toBeInTheDocument();
    });

    it('submits data to API and triggers onSuccess with event id', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(
            <LeadFormModal
                isOpen
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />,
        );

        // Fill inputs
        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Juan Pérez' },
        });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), {
            target: { value: '6561234567' },
        });

        // Accept Privacy Policy
        const privacyCheckbox = screen.getByRole('checkbox');
        fireEvent.click(privacyCheckbox);

        // Submit
        fireEvent.click(
            screen.getByRole('button', { name: /Continuar a WhatsApp/i }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalledWith('Juan Pérez', 'test-event-id');
        });

        const mock = global.fetch as any;
        const [url, options] = mock.mock.calls[0] as [string, RequestInit];

        expect(url).toBe('/api/leads');
        expect(options.method).toBe('POST');
        expect(options.headers).toMatchObject({
            'Content-Type': 'application/json',
        });

        const parsedBody = JSON.parse(options.body as string);
        expect(parsedBody).toMatchObject({
            name: 'Juan Pérez',
            phone: '6561234567',
            quote: mockQuoteDetails,
            fb_event_id: 'test-event-id',
            privacy_accepted: true,
            visitor_id: 'test-visitor-id',
            session_id: 'test-session-id', // New session ID assertion
        });
    });

    it('handles API errors gracefully and still calls onSuccess', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal Server Error' }),
        });

        const consoleSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);

        render(
            <LeadFormModal
                isOpen
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />,
        );

        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Juan Error' },
        });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), {
            target: { value: '6561112233' },
        });

        // Accept Privacy Policy
        const privacyCheckbox = screen.getByRole('checkbox');
        fireEvent.click(privacyCheckbox);

        fireEvent.click(
            screen.getByRole('button', { name: /Continuar a WhatsApp/i }),
        );

        await waitFor(() => {
            // Fail-safe: user can still continue to WhatsApp even if API fails
            expect(mockOnSuccess).toHaveBeenCalledWith(
                'Juan Error',
                'test-event-id',
            );
        });

        consoleSpy.mockRestore();
    });
});
