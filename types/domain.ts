// File: types/domain.ts
import { z } from 'zod';
import type { PricingRules, VolumeTier } from '@/lib/schemas/pricing';
import {
    ConcreteTypeEnum,
    StrengthEnum
} from '@/lib/schemas/pricing';

// --- 1. Core Primitives ---
export type Strength = z.infer<typeof StrengthEnum>;
export type ConcreteType = z.infer<typeof ConcreteTypeEnum>;

export type CalculatorMode = 'knownM3' | 'assistM3';
export type AssistVolumeMode = 'dimensions' | 'area';
export type CofferedSize = '7' | '10' | '15';

export type WorkTypeId =
    | 'slab'
    | 'lightInteriorFloor'
    | 'vehicleFloor'
    | 'footings'
    | 'walls';

export type WorkTypeConfig = {
    id: WorkTypeId;
    label: string;
    description: string;
    recommendedStrength: Strength;
    icon?: string;
};

// --- 2. Calculator State ---
export type CalculatorState = {
    mode: CalculatorMode;
    volumeMode: AssistVolumeMode;
    strength: Strength | null;
    type: ConcreteType | null;
    m3: string;
    workType: WorkTypeId | null;
    length: string;
    width: string;
    thicknessByDims: string;
    area: string;
    thicknessByArea: string;
    hasCoffered: 'yes' | 'no';
    cofferedSize: CofferedSize | null;

    // Phase 2: Expert Fields
    additives: string[];
    showExpertOptions: boolean;
};

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    mode: 'knownM3',
    volumeMode: 'dimensions',
    strength: null, // Force user selection
    type: null,     // Force user selection
    m3: '',
    workType: null,
    length: '',
    width: '',
    thicknessByDims: '10',
    area: '',
    thicknessByArea: '10',
    hasCoffered: 'no',
    cofferedSize: '7',
    additives: [],
    showExpertOptions: false,
};

// --- 3. Pricing & Quotes ---
export type { PricingRules, VolumeTier };

export type NormalizedVolume = {
    requestedM3: number;
    roundedM3: number;
    minM3ForType: number;
    billedM3: number;
    isBelowMinimum: boolean;
};

export type QuoteLineItem = {
    label: string;
    value: number; // Formatted currency
    type: 'base' | 'additive' | 'surcharge';
};

export type PricingSnapshot = {
    rules_version: number;
    timestamp: number;
    rules_applied: PricingRules;
};

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: Strength;
    concreteType: ConcreteType;

    // Financials
    unitPricePerM3: number;
    baseSubtotal: number;
    additivesSubtotal: number;
    subtotal: number;
    vat: number;
    total: number;

    // Metadata
    breakdownLines: QuoteLineItem[];
    calculationDetails?: {
        formula: string;
        factorUsed?: number;
    };
    pricingSnapshot?: PricingSnapshot; // New for Snapshot Pattern
};

export type QuoteWarning =
    | {
        code: 'BELOW_MINIMUM';
        minM3: number;
        billedM3: number;
        typeLabel: string;
    }
    | {
        code: 'ROUNDING_POLICY';
        requestedM3: number;
        billedM3: number;
    }
    | {
        code: 'ROUNDING_ADJUSTMENT';
        billedM3: number;
    }
    | null;

// --- 4. OMS Entities & Domain ---

export type OrderStatus =
    | 'Pendiente volumetría'
    | 'Confirmado'
    | 'En Proceso'
    | 'Finalizado'
    | 'Cancelado';

export type PaymentStatus =
    | 'Pendiente de Pago'
    | 'Parcial'
    | 'Pagado'
    | 'Cancelado';

export type Client = {
    id: string;
    type: 'individual' | 'business';
    legalName: string; // Razón Social o Nombre Completo
    rfc?: string;
    phone: string;
    email: string;
    billingAddress?: {
        street: string;
        exteriorNumber: string;
        interiorNumber?: string;
        colony: string;
        city: string;
        state: string;
        zipCode: string;
    };
};

export type Location = {
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
};

export type Seller = {
    id: string;
    name: string;
    email?: string;
};

export type OrderFinancials = {
    subtotal: number;
    vat: number;
    total: number;
    deposit: number; // Anticipo
    balance: number; // Saldo Pendiente
    currency: string;
};

export type OrderItem = {
    id: string;
    product_id: string;
    label: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    snapshot: {
        inputs: CalculatorState;
        results: QuoteBreakdown;
    };
};

export type Order = {
    id: string;
    folio: string;
    createdAt: number;
    updatedAt: number;
    scheduledDate?: string;
    client: Client;
    deliveryLocation: Location;
    seller?: Seller;
    items: OrderItem[];
    financials: OrderFinancials;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    notes?: string;
};

// --- 5. Catalog Abstraction ---

export type ProductType = 'concrete' | 'additive' | 'service';

export type Product = {
    id: string;
    type: ProductType;
    label: string;
    description?: string;
    active: boolean;
    metadata?: Record<string, unknown>;
};

// --- 6. Legacy / Compatibility ---

export type CartItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: {
        label: string;
    };
    customer?: CustomerInfo;
    folio?: string;
};

export type CustomerInfo = {
    name: string;
    phone: string;
    visitorId?: string;
    email?: string;
};

export type OrderPayload = {
    folio: string;
    customer: CustomerInfo;
    items: {
        id: string;
        label: string;
        volume: number;
        service: string;
        subtotal: number;
        additives?: string[];
    }[];
    financials: {
        total: number;
        currency: string;
    };
    metadata: {
        source: 'web_calculator';
        pricing_version?: number;
        utm_source?: string;
        utm_medium?: string;
        userAgent?: string;
        // Scheduling Details
        deliveryAddress?: string;
        deliveryDate?: string;
        deliveryTime?: string;
        notes?: string;
    };
};

// --- 7. Meta CAPI ---

/**
 * Structure for Meta CAPI User Data.
 */
export interface CapiUserData {
    em?: string; // Hashed Email
    ph?: string; // Hashed Phone
    client_ip_address: string;
    client_user_agent: string;
    fbc?: string;
    fbp?: string;
}

/**
 * Structure for Meta CAPI Events.
 */
export interface CapiEvent {
    event_name: string;
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: 'website';
    user_data: CapiUserData;
    custom_data?: Record<string, unknown>;
}
