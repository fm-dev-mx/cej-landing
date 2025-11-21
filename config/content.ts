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

// NEW: Interface for Social Proof / Works
export interface WorkItem {
    id: string;
    title: string;
    location: string;
    category: string;
    imageAlt: string;
    // In a real app, this would be a local path like '/images/works/nave.jpg'
    // Using placeholders for demonstration
    imageUrl: string;
}

export const LANDING_CONTENT = {
    hero: {
        badge: "Calidad y Tiempo en Ciudad Juárez",
        title: {
            line1: "Tu obra no se detiene,",
            highlight: "nosotros tampoco."
        },
        lead: "Suministro de concreto premezclado con <strong>acompañamiento experto</strong> desde el inicio. Evita desperdicios y retrasos.",
        features: [
            {
                text: "Cálculo de volumetría",
                highlight: "GRATIS"
            },
            {
                text: "Entregas puntuales garantizadas",
                highlight: null
            },
            {
                text: "Asesoría técnica incluida",
                highlight: null
            }
        ],
        cta: {
            primary: "Cotizar ahora",
            secondary: "Hablar con un experto"
        }
    },
    trust: {
        title: "Más que concreto, entregamos certidumbre",
        items: [
            {
                id: "time",
                title: "Puntualidad Inglesa",
                desc: "Respetamos el tiempo de tu cuadrilla. Si decimos a las 8:00 AM, el camión está ahí.",
                icon: "⏱️"
            },
            {
                id: "quality",
                title: "Resistencia Certificada",
                desc: "Garantía de f’c real. Lo que pides es exactamente lo que colamos en tu obra.",
                icon: "🛡️"
            },
            {
                id: "local",
                title: "ADN Juarense",
                desc: "Conocemos los retos de la ciudad, el tráfico y los agregados locales mejor que nadie.",
                icon: "📍"
            }
        ] as TrustItem[]
    },
    // NEW SECTION: Social Proof / Works
    socialProof: {
        title: "Nuestra huella en Juárez",
        subtitle: "Desde ampliaciones residenciales hasta naves industriales. La confianza se construye m³ a m³.",
        works: [
            {
                id: "work1",
                title: "Nave Industrial Eje Juan Gabriel",
                location: "Zona Industrial",
                category: "Piso Industrial",
                imageAlt: "Interior de nave industrial mostrando el colado de piso de concreto con bomba pluma bajo estructura metálica",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673428/maquila_culguq.jpg"
            },
            {
                id: "work2",
                title: "Complejo Residencial Sendero",
                location: "Valle del Sol",
                category: "Cimentación y Zapatas",
                imageAlt: "Bomba de concreto vertiendo mezcla sobre zapatas corridas y cimentación en terreno de obra residencial",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673427/complejo_residencial_q3dxfu.jpg"
            },
            {
                id: "work3",
                title: "Estacionamiento Comercial",
                location: "Av. Las Torres",
                category: "Concreto Estampado",
                imageAlt: "Armado de acero con silletas y cimbra de madera listos para recibir el colado de concreto en estacionamiento",
                imageUrl: "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673428/zona_industrial_gu16sr.jpg"
            }
        ] as WorkItem[]
    },
    process: {
        title: "¿Cómo trabajamos?",
        subtitle: "Tu concreto en obra, sin errores y sin riesgos.",
        steps: [
            {
                id: "calc",
                title: "Cotiza",
                desc: "Usa la calculadora o contáctanos para obtener tu presupuesto al instante.",
                icon: "📲"
            },
            {
                id: "book",
                title: "Aparta",
                desc: "Bloquea tu horario con un anticipo de solo $1,000 MXN.",
                icon: "📅"
            },
            {
                id: "verify",
                title: "Verificamos",
                desc: "Visitamos tu obra para confirmar la cantidad exacta y accesos.",
                icon: "👷"
            },
            {
                id: "pay",
                title: "Recibe y Liquida",
                desc: "Llegamos puntuales. Pagas el resto al recibir tu concreto.",
                icon: "🤝"
            }
        ] as ProcessStep[]
    },
    services: {
        title: "Todo lo que necesitas,",
        titleHighlight: "en un solo lugar.",
        subtitle: "Soluciones integrales de concreto para contratistas y constructores en Ciudad Juárez.",
        items: [
            {
                id: "concreto",
                title: "Concreto Premezclado",
                desc: "Desde f’c 100 hasta 350 kg/cm². Calidad controlada y mezclas especiales para losas, pisos y estructuras.",
                icon: "🏗️",
                ariaLabel: "Grúa de construcción",
            },
            {
                id: "bomba",
                title: "Servicio de Bombeo",
                desc: "Bombas pluma y estacionarias para llegar a cualquier rincón de tu obra. Eficiencia y limpieza garantizada.",
                icon: "🚛",
                ariaLabel: "Camión de transporte",
            },
            {
                id: "asesoria",
                title: "Asesoría Técnica",
                desc: "No adivines. Nuestros expertos te ayudan a calcular volúmenes y elegir la resistencia adecuada sin costo.",
                icon: "👷",
                ariaLabel: "Trabajador de construcción",
            },
        ] as ServiceItem[]
    },
    faq: {
        title: "Preguntas Frecuentes",
        subtitle: "Resolvemos tus dudas sobre tiempos de entrega, pagos y logística.",
        items: [
            {
                question: "¿Cuál es el pedido mínimo de concreto?",
                answer:
                    "Para tiro directo el mínimo es de 2 m³, y para servicio con bomba es de 3 m³. Si requieres menos cantidad, contáctanos para evaluar la disponibilidad y el cargo por 'falso flete' correspondiente.",
            },
            {
                question: "¿Con cuánto tiempo de anticipación debo hacer mi pedido?",
                answer:
                    "Recomendamos realizar tu pedido con 24 a 48 horas de anticipación para asegurar el horario de colado que prefieras. Para fines de semana, sugerimos reservar con 3 días de antelación.",
            },
            {
                question: "¿Qué formas de pago aceptan?",
                answer:
                    "Aceptamos transferencias bancarias (SPEI), depósitos en efectivo y pago con tarjeta (crédito/débito). Recuerda que puedes apartar con $1,000 y liquidar contra entrega.",
            },
            {
                question: "¿Hacen visitas técnicas?",
                answer:
                    "Sí, es parte de nuestro proceso estándar. Una vez apartado el pedido, un técnico visita tu obra para validar accesos y volumetría final para evitar que te falte o sobre material.",
            },
        ] as FaqItem[]
    }
};
