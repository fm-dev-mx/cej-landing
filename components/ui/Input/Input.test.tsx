// components/ui/Input/Input.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
    describe('Suffix rendering', () => {
        it('renders suffix when provided', () => {
            render(<Input label="Largo" suffix="metros" />);

            expect(screen.getByText('metros')).toBeInTheDocument();
        });

        it('does not render suffix when not provided', () => {
            render(<Input label="Largo" />);

            expect(screen.queryByText('metros')).not.toBeInTheDocument();
        });

        it('suffix has aria-hidden for accessibility', () => {
            render(<Input label="Área" suffix="m²" />);

            const suffix = screen.getByText('m²');
            expect(suffix).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('Label and error behavior', () => {
        it('renders label when provided', () => {
            render(<Input label="Volumen Total" />);

            expect(screen.getByLabelText('Volumen Total')).toBeInTheDocument();
        });

        it('renders error message with role alert', () => {
            render(<Input label="Ancho" error="Valor requerido" />);

            const errorMessage = screen.getByRole('alert');
            expect(errorMessage).toHaveTextContent('Valor requerido');
        });

        it('sets aria-invalid when error is present', () => {
            render(<Input label="Largo" error="Ingresa un valor" />);

            const input = screen.getByLabelText('Largo');
            expect(input).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('Volume input variant', () => {
        it('applies volumeInput class when isVolume is true', () => {
            render(<Input label="Volumen" isVolume data-testid="vol-input" />);

            const input = screen.getByTestId('vol-input');
            expect(input.className).toContain('volumeInput');
        });
    });
});
