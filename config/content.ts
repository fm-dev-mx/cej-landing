// config/content.ts

export interface ServiceItem {
    id: string;
    title: string;
    desc: string;
    icon: string;
    ariaLabel: string;
}

export interface TrustItem {
    id: string;
    title: string;
    desc: string;
    icon: string;
}

export interface ProcessStep {
    id: string;
    title: string;
    desc: string;
    icon: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface WorkItem {
    id: string;
    title: string;
    location: string;
    category: string;
    imageAlt: string;
    imageUrl: string;
}

export interface TestimonialItem {
    id: string;
    quote: string;
    author: string;
    role: string;
    type: 'contractor' | 'individual';
}

export interface StatItem {
    id: string;
    value: string;
    label: string;
}

// --- SEO Configuration ---
export const SEO_CONTENT = {
    title: "Concreto en Ciudad Juárez | Venta y Suministro Inmediato",
    description: "Cotiza concreto premezclado en Ciudad Juárez al mejor precio. Suministro puntual, renta de bombas y cálculo de material gratis. Resistencias f'c 150 a 300.",
    siteName: "Concreto y Equipos de Juárez",
    keywords: [
        "concreto juarez",
        "concreto premezclado precio",
        "renta de bomba de concreto",
        "cementera ciudad juarez",
        "colado de losas juarez",
        "concreto f'c 200"
    ],
    ogImage: "/og-image.jpg",
};

export const LANDING_CONTENT = {
    hero: {
        badge: "Servicio en todo Ciudad Juárez y zonas aledañas",
        title: {
            line1: "Concreto premezclado",
            highlight: "con entrega puntual."
        },
        // SEO: Include main keywords naturally in the lead text (H2 or p context)
        lead: "Suministro confiable de <strong>concreto y servicio de bombeo</strong> para contratistas y particulares. Evita desperdicios con nuestro cálculo de volumetría exacto.",
        features: [
            {
                text: "Cotización inmediata",
                highlight: "GRATIS"
            },
            {
                text: "Resistencias certificadas",
                highlight: "(f’c)"
            },
            {
                text: "Flotilla moderna",
                highlight: null
            }
        ],
        cta: {
            primary: "Cotizar Concreto Ahora",
            secondary: "Hablar con un experto"
        }
    },
    trust: {
        title: "Tu obra segura con CEJ",
        items: [
            {
                id: "time",
                title: "Tiempo es Dinero",
                desc: "Entendemos que una cuadrilla parada cuesta. Nuestra logística en Juárez garantiza que el camión llegue cuando se programó.",
                icon: "⏱️"
            },
            {
                id: "quality",
                title: "Calidad Normativa",
                desc: "Mezclas diseñadas bajo norma. Si pides f’c 200 para una losa, recibes exactamente esa resistencia garantizada.",
                icon: "🛡️"
            },
            {
                id: "local",
                title: "Expertos Locales",
                desc: "Conocemos los agregados de la región y las condiciones climáticas de Juárez para ajustar la mezcla ideal.",
                icon: "📍"
            }
        ] as TrustItem[]
    },
    socialProof: {
        title: "Proyectos en Ciudad Juárez",
        subtitle: "Desde ampliaciones residenciales hasta naves industriales. Resultados reales en obras locales.",
        stats: [
            { id: "s1", value: "+4,500", label: "Obras Suministradas" },
            { id: "s2", value: "95%", label: "Puntualidad Record" },
            { id: "s3", value: "100%", label: "Juarenses" }
        ] as StatItem[],
        works: [
            {
                id: "work1",
                title: "Piso Industrial - Eje Juan Gabriel",
                location: "Zona Industrial",
                category: "Piso Pulido",
                imageAlt: "Colado de piso de concreto industrial con bomba pluma en nave maquiladora",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673428/maquila_culguq.jpg"
            },
            {
                id: "work2",
                title: "Cimentación Residencial",
                location: "Valle del Sol",
                category: "Zapatas y Losas",
                imageAlt: "Camión revolvedora vertiendo concreto en cimentación de casa habitación",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673427/complejo_residencial_q3dxfu.jpg"
            },
            {
                id: "work3",
                title: "Estacionamiento Comercial",
                location: "Av. Las Torres",
                category: "Concreto Estampado",
                imageAlt: "Preparación de armado para colado de estacionamiento comercial en Ciudad Juárez",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673428/zona_industrial_gu16sr.jpg"
            }
        ] as WorkItem[],
        testimonials: [
            {
                id: "t1",
                quote: "Necesitaba una bomba para una losa en un segundo piso de difícil acceso en la Col. Melchor Ocampo. Llegaron a tiempo y el operador fue muy hábil.",
                author: "Arq. Luis Morales",
                role: "Constructora LM",
                type: "contractor"
            },
            {
                id: "t2",
                quote: "Soy particular y no sabía qué resistencia pedir para mi cochera. Me asesoraron por WhatsApp y el cálculo fue exacto, no desperdicié nada.",
                author: "Sr. Roberto Méndez",
                role: "Cliente Particular",
                type: "individual"
            },
            {
                id: "t3",
                quote: "Proveedores serios. La consistencia del concreto f'c 250 siempre es la misma, lo que nos ayuda a mantener la calidad en nuestros acabados.",
                author: "Ing. Sofía Durán",
                role: "Supervisora de Obra",
                type: "contractor"
            }
        ] as TestimonialItem[]
    },
    process: {
        title: "Tu colado en 4 pasos",
        subtitle: "Simplificamos la logística para que tú solo te preocupes por construir.",
        steps: [
            {
                id: "calc",
                title: "1. Cotiza y Calcula",
                desc: "Usa nuestra calculadora online para estimar el volumen y precio al instante, o mándanos tus medidas.",
                icon: "Tp" // Tp maps to calculator/phone conceptually
            },
            {
                id: "book",
                title: "2. Programa tu Pedido",
                desc: "Aparta fecha y hora con un anticipo mínimo ($1,000 MXN). Asegura tu lugar en la agenda.",
                icon: "Cal"
            },
            {
                id: "verify",
                title: "3. Visita Técnica",
                desc: "Un experto va a tu obra (sin costo) para verificar accesos y rectificar medidas para evitar errores.",
                icon: "Eng"
            },
            {
                id: "pay",
                title: "4. Recibe y Construye",
                desc: "La olla llega puntual. Liquidación contra entrega y soporte durante el vaciado.",
                icon: "Truck"
            }
        ] as ProcessStep[]
    },
    // SEO STRATEGY: Expanded descriptions for semantic ranking
    services: {
        title: "Soluciones en Concreto",
        titleHighlight: "para toda necesidad.",
        subtitle: "Desde pequeñas ampliaciones hasta grandes desarrollos en Ciudad Juárez. Tenemos el equipo y la mezcla correcta.",
        items: [
            {
                id: "concreto",
                title: "Venta de Concreto Premezclado",
                desc: "Suministro de concreto convencional y estructural (f’c 150, 200, 250, 300 kg/cm²). Ideal para losas, firmes, banquetas, cimentaciones y muros. Garantizamos la resistencia y trabajabilidad que tu obra exige.",
                icon: "🏗️",
                ariaLabel: "Camión revolvedora de concreto",
            },
            {
                id: "bomba",
                title: "Servicio de Bombeo (Pluma y Estacionaria)",
                desc: "Renta de bombas de concreto para alcanzar cualquier distancia o altura. Contamos con bombas pluma (telescópicas) para losas altas y bombas estacionarias (tubería) para interiores o patios traseros de difícil acceso.",
                icon: "🚛",
                ariaLabel: "Bomba de concreto",
            },
            {
                id: "asesoria",
                title: "Asesoría Técnica y Volumetría",
                desc: "No arriesgues tu dinero. Nuestros técnicos realizan visitas a obra para calcular los metros cúbicos exactos y recomendarte la resistencia (f'c) adecuada según el uso final de tu construcción.",
                icon: "👷",
                ariaLabel: "Ingeniero civil asesorando",
            },
        ] as ServiceItem[]
    },
    faq: {
        title: "Preguntas Frecuentes",
        subtitle: "Dudas comunes sobre el suministro de concreto en Juárez.",
        items: [
            {
                question: "¿Cuál es el pedido mínimo de concreto?",
                answer:
                    "Para tiro directo el mínimo es de 2 m³, y para servicio con bomba es de 3 m³. Si requieres menos cantidad, contáctanos para evaluar la disponibilidad y el cargo por 'falso flete' correspondiente.",
            },
            {
                question: "¿Con cuánto tiempo debo pedir el concreto?",
                answer:
                    "Recomendamos realizar tu pedido con 24 a 48 horas de anticipación para asegurar el horario de colado que prefieras, especialmente para colados en sábado por la mañana.",
            },
            {
                question: "¿Qué resistencia (f'c) necesito para una losa de casa?",
                answer:
                    "Lo estándar para una losa de entrepiso o azotea residencial es f'c 200 kg/cm² o f'c 250 kg/cm². Si tienes dudas, usa nuestra calculadora o llámanos para asesorarte gratis.",
            },
            {
                question: "¿Aceptan pagos con tarjeta?",
                answer:
                    "Sí, aceptamos transferencias (SPEI), efectivo y tarjetas de crédito/débito. Puedes apartar con un anticipo y liquidar el resto al llegar la unidad a tu obra.",
            },
        ] as FaqItem[]
    }
};
