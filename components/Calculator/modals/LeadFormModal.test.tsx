// components/Calculator/modals/LeadFormModal.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { LeadFormModal, type LeadQuoteDetails } from './LeadFormModal';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '@/components/Calculator/types';
import { submitLead } from '@/app/actions/submitLead';

// 1. Mock de Portal (para que se renderice en el DOM de prueba)
vi.mock('react-dom', async () => {
    const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

// 2. Mock de Server Action
// Es crucial mockear el módulo que contiene la acción
vi.mock('@/app/actions/submitLead', () => ({
    submitLead: vi.fn(),
}));

// 3. Mock de Hooks y Utils
vi.mock('@/hooks/useIdentity', () => ({
    useIdentity: () => ({
        visitorId: 'test-visitor-id',
        sessionId: 'test-session-id',
    }),
}));

vi.mock('@/lib/pixel', () => ({
    trackLead: vi.fn(),
    trackContact: vi.fn(),
}));

vi.mock('@/lib/utils', async () => {
    const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils');
    return {
        ...actual,
        // Mock window.open indirectly if needed, but usually we mock window.open directly
    };
});

describe('LeadFormModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    const mockQuoteDetails: LeadQuoteDetails = {
        summary: { total: 5000, volume: 5, product: 'Concreto 200' },
        context: { work_type: 'Losa' },
    };

    // Helper para resetear el store de Zustand completamente
    const resetStore = () => {
        // FIX: Removed 'true' argument to prevent wiping out store actions like updateUserContact
        useCejStore.setState({
            user: { visitorId: 'test-vid', hasConsentedPersistence: true }, // Reset user
            cart: [],
            history: [],
            draft: { ...DEFAULT_CALCULATOR_STATE },
            isDrawerOpen: false,
            activeTab: 'order',
            viewMode: 'wizard'
        });
    };

    beforeAll(() => {
        // Polyfill básico de crypto si no existe en el entorno de test
        if (!globalThis.crypto) {
            Object.defineProperty(globalThis, 'crypto', {
                value: {
                    randomUUID: () => 'test-event-id',
                },
            });
        }
    });

    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        resetStore();
        // Mock de window.open
        vi.stubGlobal('open', vi.fn());
    });

    it('does not render when isOpen is false', () => {
        render(
            <LeadFormModal
                isOpen={false}
                onClose={mockOnClose}
                mode="lead"
                quoteDetails={mockQuoteDetails}
            />
        );

        expect(screen.queryByLabelText(/Nombre completo/i)).not.toBeInTheDocument();
    });

    it('renders form fields and privacy checkbox when open', () => {
        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                mode="lead"
                quoteDetails={mockQuoteDetails}
            />
        );

        expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();

        // Buscamos específicamente el checkbox de privacidad por su label
        expect(screen.getByLabelText(/aviso de privacidad/i)).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /Continuar a WhatsApp/i })).toBeInTheDocument();
    });

    it('submits data to Server Action and triggers onSuccess', async () => {
        // Setup del Mock exitoso
        (submitLead as any).mockResolvedValue({ success: true, id: '123' });

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                mode="lead"
                onSuccessLead={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        // Fill inputs
        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Juan Pérez' },
        });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), {
            target: { value: '6561234567' },
        });

        // Accept Privacy Policy (Crucial: Select the correct checkbox)
        const privacyCheckbox = screen.getByLabelText(/aviso de privacidad/i);
        fireEvent.click(privacyCheckbox);

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Continuar a WhatsApp/i }));

        await waitFor(() => {
            expect(submitLead).toHaveBeenCalled();
        });

        // Verificar payload
        expect(submitLead).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Juan Pérez',
            phone: '6561234567',
            privacy_accepted: true,
        }));

        expect(mockOnSuccess).toHaveBeenCalledWith('Juan Pérez', expect.any(String));
    });

    it('handles Server Action errors gracefully and still calls onSuccess (Fail-safe)', async () => {
        // Setup del Mock con error
        (submitLead as any).mockResolvedValue({ success: false, error: 'Database error' });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                mode="lead"
                onSuccessLead={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Juan Fallback' },
        });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), {
            target: { value: '6561112233' },
        });

        // Accept Privacy Policy
        const privacyCheckbox = screen.getByLabelText(/aviso de privacidad/i);
        fireEvent.click(privacyCheckbox);

        fireEvent.click(screen.getByRole('button', { name: /Continuar a WhatsApp/i }));

        await waitFor(() => {
            expect(submitLead).toHaveBeenCalled();
            // Fail-safe: user can still continue to WhatsApp even if DB fails
            expect(mockOnSuccess).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });

    it('shows validation error if privacy is not accepted', async () => {
        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                mode="lead"
                onSuccessLead={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Juan V.' },
        });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), {
            target: { value: '6561234567' },
        });

        // IMPORTANTE: NO hacemos click en el checkbox de privacidad aquí.
        // Aseguramos que esté desmarcado (por defecto debería estarlo si el store está limpio)
        const privacyCheckbox = screen.getByLabelText(/aviso de privacidad/i) as HTMLInputElement;
        expect(privacyCheckbox.checked).toBe(false);

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Continuar a WhatsApp/i }));

        // Esperamos que NO se llame a submitLead
        await waitFor(() => {
            expect(screen.getByText(/Acepta el aviso de privacidad/i)).toBeInTheDocument();
        });

        expect(submitLead).not.toHaveBeenCalled();
    });
});
