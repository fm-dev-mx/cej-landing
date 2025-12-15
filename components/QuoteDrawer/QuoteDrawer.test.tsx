import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteDrawer from './QuoteDrawer';
import { useCejStore } from '@/store/useCejStore';

// --- Mocks ---
vi.mock('@/store/useCejStore');
// Mock Child Components
vi.mock('@/components/Calculator/modals/LeadFormModal', () => ({
    LeadFormModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Lead Modal Open</div> : null
}));

describe('QuoteDrawer', () => {
    const mockRemove = vi.fn();
    const mockEdit = vi.fn();
    const mockSetDrawerOpen = vi.fn();

    const mockCartItem = {
        id: 'item-1',
        timestamp: Date.now(),
        config: { label: 'Losa 5m3' },
        results: {
            total: 10000,
            volume: { billedM3: 5 },
            concreteType: 'pumped'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            isDrawerOpen: true,
            setDrawerOpen: mockSetDrawerOpen,
            activeTab: 'order',
            setActiveTab: vi.fn(),
            // Phase 0 Bugfix: Add new properties
            isProcessingOrder: false,
            submittedQuote: null,
            cart: [mockCartItem],
            history: [],
            removeFromCart: mockRemove,
            editCartItem: mockEdit,
            cloneCartItem: vi.fn(),
            loadQuote: vi.fn(),
        });
    });

    it('does not render if drawer is closed', () => {
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isDrawerOpen: false });
        const { container } = render(<QuoteDrawer />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders cart items and total', () => {
        render(<QuoteDrawer />);
        expect(screen.getByText('Losa 5m3')).toBeDefined();
        expect(screen.getByText('Bomba')).toBeDefined(); // concreteType label
        // Check for total (formatting mocked or naive check)
        // We look for parts of the formatted string or just existence
        expect(screen.getByText(/Total Estimado/i)).toBeDefined();
    });

    it('calls editCartItem when Edit clicked', () => {
        render(<QuoteDrawer />);
        fireEvent.click(screen.getByText('Editar'));
        expect(mockEdit).toHaveBeenCalledWith('item-1');
    });

    it('calls removeFromCart when Borrar clicked and confirmed', () => {
        render(<QuoteDrawer />);

        // 1. Click "Borrar"
        const deleteBtn = screen.getByText('Borrar');
        fireEvent.click(deleteBtn);

        // 2. Check for confirmation UI
        expect(screen.getByText('¿Seguro?')).toBeDefined();
        const confirmBtn = screen.getByText('Sí');

        // 3. Click "Sí"
        fireEvent.click(confirmBtn);

        expect(mockRemove).toHaveBeenCalledWith('item-1');
    });

    it('does not call removeFromCart when Borrar is cancelled', () => {
        render(<QuoteDrawer />);

        // 1. Click "Borrar"
        const deleteBtn = screen.getByText('Borrar');
        fireEvent.click(deleteBtn);

        // 2. Click "No" (Cancel)
        const cancelBtn = screen.getByText('No');
        fireEvent.click(cancelBtn);

        expect(mockRemove).not.toHaveBeenCalled();

        // 3. UI should reset (Borrar button visible again)
        expect(screen.getByText('Borrar')).toBeDefined();
        expect(screen.queryByText('¿Seguro?')).toBeNull();
    });

    it('opens lead modal on "Finalizar Pedido"', () => {
        render(<QuoteDrawer />);
        fireEvent.click(screen.getByText('Finalizar Pedido'));
        expect(screen.getByText('Lead Modal Open')).toBeDefined();
    });
});
