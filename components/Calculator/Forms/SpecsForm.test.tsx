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
        const select = screen.getByLabelText(/Resistencia/i) as HTMLSelectElement;

        fireEvent.change(select, { target: { value: '250' } });

        expect(useCejStore.getState().draft.strength).toBe('250');
    });

    it('updates store on service type change', () => {
        render(<SpecsForm />);
        const select = screen.getByLabelText(/Servicio/i) as HTMLSelectElement;

        fireEvent.change(select, { target: { value: 'pumped' } });

        expect(useCejStore.getState().draft.type).toBe('pumped');
    });
});
