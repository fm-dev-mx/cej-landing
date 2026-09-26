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
  it('renders plant address and Google Maps link correctly', () => {
    render(<ServiceArea />);

    expect(screen.getByText('Ubicación y Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Nuestra Planta')).toBeInTheDocument();

    // Check address contains Turbosina 9410 and entrada por calle Aeronáutica
    expect(screen.getByText(/Turbosina 9410/i)).toBeInTheDocument();
    expect(screen.getByText(/entrada por calle Aeronáutica/i)).toBeInTheDocument();
    expect(screen.getByText(/Jardines del Aeropuerto/i)).toBeInTheDocument();
    expect(screen.getByText(/32695/i)).toBeInTheDocument();

    // Check Google Maps link
    const mapsLink = screen.getByRole('link', { name: /Abrir ubicación de la planta en Google Maps/i });
    expect(mapsLink).toBeInTheDocument();
    expect(mapsLink).toHaveAttribute('href', BUSINESS_INFO.mapsUrl);
    expect(mapsLink).toHaveAttribute('href', 'https://maps.app.goo.gl/hUPx87qXPaBWTCt19');
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('activates map interaction when overlay button is clicked', () => {
    render(<ServiceArea />);

    const overlayButton = screen.getByRole('button', { name: /Ver mapa interactivo/i });
    expect(overlayButton).toBeInTheDocument();

    fireEvent.click(overlayButton);

    expect(screen.queryByRole('button', { name: /Ver mapa interactivo/i })).not.toBeInTheDocument();
  });
});
