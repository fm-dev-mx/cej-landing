import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    interactiveWidget: "resizes-content", // Key for SmartBottomBar with keyboard
};

export const metadata: Metadata = {
    title: "CEJ Pro | Cotizador",
    description: "Herramienta profesional de cálculo de concreto.",
    robots: "noindex, nofollow", // Keep app internal
};

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
