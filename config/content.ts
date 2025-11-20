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
        title: "Construimos confianza en cada m³",
        items: [
            {
                id: "time",
                title: "Puntualidad Inglesa",
                desc: "Sabemos que el tiempo de tu cuadrilla cuesta. Llegamos a la hora pactada.",
                icon: "⏱️"
            },
            {
                id: "quality",
                title: "Resistencia Real",
                desc: "Certificamos que el f’c que compras es el que recibes. Sin mezclas rebajadas.",
                icon: "🛡️"
            },
            {
                id: "local",
                title: "Expertos Locales",
                desc: "Conocemos Ciudad Juárez, sus agregados y sus retos logísticos.",
                icon: "📍"
            }
        ] as TrustItem[]
    },
    // SECTION UPDATED: Reflecting the real process with technical visit and low down payment
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
