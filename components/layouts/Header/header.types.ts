// components/layouts/header/header.types.ts

export type NavItem = {
    href: string;
    label: string;
};

export type PhoneMeta = {
    href: string;
    display: string;
};

export const PRIMARY_NAV: NavItem[] = [
    { href: "#calculator", label: "Cotizar" },
    { href: "#services", label: "Servicios" },
    { href: "#projects", label: "Proyectos" },
    { href: "#service-area", label: "Cobertura" },
    { href: "#faq", label: "FAQ" },
];
