import { z } from 'zod';

// Primitivos para validación de claves
export const ConcreteTypeEnum = z.enum(['direct', 'pumped']);
export const StrengthEnum = z.enum(['100', '150', '200', '250', '300']);

// Esquema de Niveles de Precio (Volumen)
export const VolumeTierSchema = z.object({
    minM3: z.number().min(0),
    maxM3: z.number().optional(), // Si es undefined, es infinito (ej. > 10m3)
    pricePerM3Cents: z.number().int().positive(), // Siempre en centavos para precisión
});

// Esquema de Aditivos (NUEVO)
export const AdditiveSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    priceCents: z.number().int().nonnegative(),
    pricingModel: z.enum(['per_m3', 'fixed_per_load']), // Lógica de cobro
    active: z.boolean().default(true),
});

// Esquema Maestro de Reglas de Precio
export const PricingRulesSchema = z.object({
    version: z.number(),
    lastUpdated: z.string().datetime(),

    // Matriz de Precios Base: Tipo -> Resistencia -> Tiers
    base: z.record(
        ConcreteTypeEnum,
        z.record(
            StrengthEnum,
            z.array(VolumeTierSchema)
        )
    ),

    // Catálogo de Aditivos
    additives: z.array(AdditiveSchema).default([]),

    // Configuración Global
    vatRate: z.number().min(0).max(1), // ej. 0.08 o 0.16
    currency: z.string().default('MXN'),
    minOrderQuantity: z.record(ConcreteTypeEnum, z.number()),
});

export type PricingRules = z.infer<typeof PricingRulesSchema>;
export type Additive = z.infer<typeof AdditiveSchema>;
