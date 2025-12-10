import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteDrawer from './QuoteDrawer';
import { useCejStore } from '@/store/useCejStore';

// --- Mocks ---
vi.mock('@/store/useCejStore');
// Mock Child Components
vi.mock('@/components/Calculator/modals/LeadFormModal', () => ({
    LeadFormModal: ({ isOpen }: any) => isOpen ? <div>Lead Modal Open</div> : null
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
        (useCejStore as any).mockReturnValue({
            isDrawerOpen: true,
            setDrawerOpen: mockSetDrawerOpen,
            activeTab: 'order',
            setActiveTab: vi.fn(),
            cart: [mockCartItem],
            history: [],
            removeFromCart: mockRemove,
            editCartItem: mockEdit,
            cloneCartItem: vi.fn(),
        });
    });

    it('does not render if drawer is closed', () => {
        (useCejStore as any).mockReturnValue({ isDrawerOpen: false });
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

    it('calls removeFromCart when Borrar clicked', () => {
        render(<QuoteDrawer />);
        fireEvent.click(screen.getByText('Borrar'));
        expect(mockRemove).toHaveBeenCalledWith('item-1');
    });

    it('opens lead modal on "Finalizar Pedido"', () => {
        render(<QuoteDrawer />);
        fireEvent.click(screen.getByText('Finalizar Pedido'));
        expect(screen.getByText('Lead Modal Open')).toBeDefined();
    });
});
