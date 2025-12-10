// components/Calculator/modals/LeadFormModal.test.tsx
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeadFormModal } from './LeadFormModal';
import { useCejStore } from '@/store/useCejStore';

// 1. Mock UI Components to avoid Portal issues in JSDOM
// We verify the logic inside the modal, not the Dialog implementation itself.
vi.mock('@/components/ui/ResponsiveDialog/ResponsiveDialog', () => ({
    ResponsiveDialog: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => (
        isOpen ? <div data-testid="mock-dialog">{children}</div> : null
    ),
}));

// 2. Mock the Custom Hook (Integration Point)
// We verify that the modal calls this hook correctly.
const { mockProcessOrder } = vi.hoisted(() => ({
    mockProcessOrder: vi.fn(),
}));

vi.mock('@/hooks/useCheckOutUI', () => ({
    useCheckoutUI: () => ({
        processOrder: mockProcessOrder,
        isProcessing: false,
        error: null,
    }),
}));

describe('LeadFormModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        // Reset Store
        useCejStore.setState({
            user: { visitorId: 'reset-id', hasConsentedPersistence: false },
            cart: []
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(<LeadFormModal isOpen={false} onClose={mockOnClose} />);
        expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
    });

    it('renders correctly with empty fields when open', () => {
        render(<LeadFormModal isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('input-lead-name')).toHaveValue('');
        expect(screen.getByTestId('input-lead-phone')).toHaveValue('');
        expect(screen.getByTestId('btn-submit-lead')).toBeDisabled(); // Disabled by default due to validation
    });

    it('prefills data from store if available', () => {
        useCejStore.setState({
            user: {
                name: 'Store User',
                phone: '6689990000',
                visitorId: 'test-visitor-id',
                hasConsentedPersistence: true
            }
        });

        render(<LeadFormModal isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByTestId('input-lead-name')).toHaveValue('Store User');
        expect(screen.getByTestId('input-lead-phone')).toHaveValue('6689990000');
    });

    it('enables submit button only when form is valid', async () => {
        const user = userEvent.setup();
        render(<LeadFormModal isOpen={true} onClose={mockOnClose} />);

        const submitBtn = screen.getByTestId('btn-submit-lead');
        expect(submitBtn).toBeDisabled();

        // 1. Fill Name
        await user.type(screen.getByTestId('input-lead-name'), 'Juan Test');
        expect(submitBtn).toBeDisabled();

        // 2. Fill Phone
        await user.type(screen.getByTestId('input-lead-phone'), '6681234567');
        expect(submitBtn).toBeDisabled(); // Still disabled (privacy not accepted)

        // 3. Accept Privacy
        await user.click(screen.getByTestId('checkbox-privacy'));
        expect(submitBtn).toBeEnabled();
    });

    it('calls processOrder and onSuccess when submission is successful', async () => {
        const user = userEvent.setup();
        // Setup mock to return true (success)
        mockProcessOrder.mockResolvedValue(true);

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form
        await user.type(screen.getByTestId('input-lead-name'), 'Juan Success');
        await user.type(screen.getByTestId('input-lead-phone'), '6681234567');
        await user.click(screen.getByTestId('checkbox-privacy'));

        // Submit
        await user.click(screen.getByTestId('btn-submit-lead'));

        // Assertions
        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalledTimes(1);
            expect(mockProcessOrder).toHaveBeenCalledWith(
                { name: 'Juan Success', phone: '6681234567' },
                true // default value for saveMyData
            );
        });
        expect(mockOnSuccess).toHaveBeenCalledWith('WEB-NEW', 'Juan Success');
    });

    it('does NOT call onSuccess if processOrder fails', async () => {
        const user = userEvent.setup();
        // Setup mock to return false (fail)
        mockProcessOrder.mockResolvedValue(false);

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form
        await user.type(screen.getByTestId('input-lead-name'), 'Juan Fail');
        await user.type(screen.getByTestId('input-lead-phone'), '6681234567');
        await user.click(screen.getByTestId('checkbox-privacy'));

        // Submit
        await user.click(screen.getByTestId('btn-submit-lead'));

        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalled();
        });
        // Ensure success callback was NOT triggered
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });
});
