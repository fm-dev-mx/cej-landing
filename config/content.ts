// config/content.ts

export interface ServiceItem {
    id: string;
    title: string;
    desc: string;
    icon: string;
    ariaLabel: string;
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
                    "Aceptamos transferencias bancarias (SPEI), depósitos en efectivo y pago con tarjeta (crédito/débito) directo en nuestras oficinas o mediante enlace de pago seguro.",
            },
            {
                question: "¿Hacen visitas técnicas?",
                answer:
                    "Sí. Una vez que tienes una cotización estimada y fecha tentativa, nuestros técnicos pueden visitar la obra sin costo extra para confirmar accesos, volumetría final y tipo de bomba requerida.",
            },
        ] as FaqItem[]
    }
};
