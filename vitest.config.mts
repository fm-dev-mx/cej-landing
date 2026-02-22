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
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Forces Vite to use the modern Sass compiler API
                // @ts-expect-error - 'api' is valid in Vite 5.4+ but Vitest types might lag behind
                api: 'modern-compiler',
            },
        },
    },
});
