import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
    it('renders and triggers confirm', async () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        const user = userEvent.setup();

        render(
            <ConfirmDialog
                open
                title="Eliminar"
                description="Seguro"
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Confirmar' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
