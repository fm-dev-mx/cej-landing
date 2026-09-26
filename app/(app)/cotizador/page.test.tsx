import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CALCULATOR_STATE } from '@/components/Calculator/types';
import { calcQuote } from '@/lib/pricing';
import { useCejStore } from '@/store/useCejStore';
import CotizadorPage from './page';

function saveQuote() {
    useCejStore.getState().updateDraft({ mode: 'knownM3', m3: '2' });
    useCejStore.getState().addToCart(calcQuote(2, '200', 'direct'));
    useCejStore.getState().setDrawerOpen(false);
}

describe('cotizador saved quotes access', () => {
    beforeEach(() => {
        localStorage.clear();
        useCejStore.setState({
            viewMode: 'wizard',
            currentDraft: { ...DEFAULT_CALCULATOR_STATE },
            cart: [],
            history: [],
            isDrawerOpen: false,
            activeTab: 'order',
            user: { visitorId: 'test-id', hasConsentedPersistence: true },
        });
    });

    it('opens and reopens a persisted order, even when the previous tab was history', async () => {
        saveQuote();
        const persisted = localStorage.getItem('cej-pro-storage');
        expect(persisted).not.toBeNull();
        useCejStore.setState({ cart: [], history: [], activeTab: 'history' });
        localStorage.setItem('cej-pro-storage', persisted!);
        await useCejStore.persist.rehydrate();

        render(<CotizadorPage />);
        const openOrder = await screen.findByRole('button', { name: 'Ver pedido (1)' });
        expect(openOrder).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

        fireEvent.click(openOrder);
        const drawer = within(screen.getByRole('complementary'));
        expect(drawer.getByText('Concreto f’c 200 kg/cm²')).toBeInTheDocument();
        expect(drawer.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
        expect(drawer.getByRole('button', { name: 'Finalizar Pedido por WhatsApp' })).toBeInTheDocument();
        expect(openOrder).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(drawer.getByRole('button', { name: '×' }));
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
        fireEvent.click(openOrder);
        expect(within(screen.getByRole('complementary')).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });

    it('opens history when there is no current order', async () => {
        saveQuote();
        useCejStore.getState().clearCart();

        render(<CotizadorPage />);
        fireEvent.click(await screen.findByRole('button', { name: 'Mis obras' }));

        const drawer = within(screen.getByRole('complementary'));
        expect(drawer.getByText('Concreto f’c 200 kg/cm²')).toBeInTheDocument();
        expect(drawer.getByRole('button', { name: /Cotizar de nuevo/i })).toBeInTheDocument();
        expect(drawer.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
        expect(drawer.queryByRole('button', { name: 'Finalizar Pedido por WhatsApp' })).not.toBeInTheDocument();
    });

    it('keeps history accessible after removing the last order item', async () => {
        saveQuote();
        render(<CotizadorPage />);
        fireEvent.click(await screen.findByRole('button', { name: 'Ver pedido (1)' }));

        const drawer = within(screen.getByRole('complementary'));
        fireEvent.click(drawer.getByRole('button', { name: 'Eliminar' }));
        fireEvent.click(drawer.getByRole('button', { name: '×' }));
        fireEvent.click(screen.getByRole('button', { name: 'Mis obras' }));

        expect(within(screen.getByRole('complementary')).getByRole('button', { name: /Cotizar de nuevo/i })).toBeInTheDocument();
    });

    it('omits the saved-quotes button when both order and history are empty', async () => {
        render(<CotizadorPage />);
        await screen.findByRole('button', { name: 'Cambiar a modo Experto' });

        expect(screen.queryByRole('button', { name: /^Ver pedido \(\d+\)$|^Mis obras$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
});
