import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ServiceArea from './ServiceArea';
import { BUSINESS_INFO } from '@/config/business';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_PHONE: '6561234567',
    NEXT_PUBLIC_WHATSAPP_NUMBER: '526561234567',
    NEXT_PUBLIC_SITE_URL: 'https://www.concretodejuarez.com',
    NEXT_PUBLIC_BRAND_NAME: 'Concreto y Equipos de Juárez',
  },
}));

describe('ServiceArea Component', () => {
  it('separates the customer offices from the plant and their map links', () => {
    render(<ServiceArea />);

    expect(screen.getByText('Ubicación y Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Oficinas · atención a clientes')).toBeInTheDocument();
    expect(screen.getByText('Planta · no recibe clientes')).toBeInTheDocument();
    expect(screen.getByText(/Plaza Micaela, Gómez Morín 9321, local 6/i)).toBeInTheDocument();

    // Check address contains Turbosina 9410 and entrada por calle Aeronáutica
    expect(screen.getByText(/Turbosina 9410/i)).toBeInTheDocument();
    expect(screen.getByText(/entrada por calle Aeronáutica/i)).toBeInTheDocument();

    // Check Google Maps link
    const mapsLink = screen.getByRole('link', { name: /Abrir ubicación de las oficinas en Google Maps/i });
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', BUSINESS_INFO.mapsUrl);
    expect(mapsLink).toHaveAttribute('href', 'https://maps.app.goo.gl/u2BujWzBWw62vsibA');
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: /Abrir ubicación de la planta en Google Maps/i }))
      .toHaveAttribute('href', BUSINESS_INFO.plant.mapsUrl);
    expect(BUSINESS_INFO.plant.receivesCustomers).toBe(false);
  });

  it('activates map interaction when overlay button is clicked', () => {
    render(<ServiceArea />);

    const overlayButton = screen.getByRole('button', { name: /Ver mapa interactivo/i });
    expect(overlayButton).toBeInTheDocument();

    fireEvent.click(overlayButton);

    expect(screen.queryByRole('button', { name: /Ver mapa interactivo/i })).not.toBeInTheDocument();
  });
});
