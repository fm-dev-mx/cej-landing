"use client";

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SpecsForm } from '@/components/Calculator/Forms/SpecsForm';
import { useCejStore } from '@/store/useCejStore'

describe('SpecsForm', () => {
    beforeEach(() => {
        useCejStore.getState().resetDraft();
    });

    it('renders strength and service selectors', () => {
        render(<SpecsForm />);
        expect(screen.getByLabelText(/Resistencia/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Servicio/i)).toBeInTheDocument();
    });

    it('updates store on strength change', () => {
        render(<SpecsForm />);
        const trigger = screen.getByLabelText(/Resistencia/i);
        fireEvent.click(trigger);
        const option = screen.getByRole('option', { name: /250 kg\/cm²/i });
        fireEvent.click(option);

        expect(useCejStore.getState().draft.strength).toBe('250');
    });

    it('updates store on service type change', () => {
        render(<SpecsForm />);
        const trigger = screen.getByLabelText(/Servicio/i);
        fireEvent.click(trigger);
        const option = screen.getByRole('option', { name: /Bomba/i });
        fireEvent.click(option);

        expect(useCejStore.getState().draft.type).toBe('pumped');
    });
});
