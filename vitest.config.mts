import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            // EXCLUSIONES ESTRATÉGICAS
            exclude: [
                '**/node_modules/**',
                '**/.next/**',
                '**/*.d.ts',
                '**/*.config.*',
                '**/app/layout.tsx',      // Root layouts difíciles de testear unitariamente
                '**/app/**/page.tsx',     // Las páginas se testean mejor con E2E (Playwright)
                '**/app/**/layout.tsx',
                '**/scripts/**',          // Scripts de mantenimiento
                '**/types/**',            // Archivos de solo tipos
                '**/config/**',           // Constantes estáticas
            ]
        },
    },
    css: {
        preprocessorOptions: {
            scss: { api: 'modern-compiler' },
        },
    },
});
