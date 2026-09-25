import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 6 config for GigCruite web.
 *
 * Port 4001 is deliberate — the 3000-3008 / 5173 range is owned by another
 * local app on the dev machine. See MEMORY.md > "Local Port Conventions".
 */
export default defineConfig(({ mode }) => {
  // Pull in root-level .env.development (monorepo root, 3 levels up)
  const rootEnv = loadEnv(mode, fileURLToPath(new URL('../../', import.meta.url)), '');
  const webPort = Number(rootEnv['WEB_PORT'] ?? 4001);
  const apiPort = Number(rootEnv['API_PORT'] ?? 4000);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@gigcruite/types': fileURLToPath(
          new URL('../../packages/types/src/index.ts', import.meta.url),
        ),
      },
    },
    server: {
      port: webPort,
      strictPort: true,
      host: '127.0.0.1',
      // We use direct CORS calls to the API (already allow-listed for :4001)
      // rather than proxying, for clearer separation and easier debugging.
    },
    preview: {
      port: webPort,
      strictPort: true,
    },
    define: {
      // Expose API URL at build time (overridable via VITE_API_URL env)
      'import.meta.env.VITE_API_URL': JSON.stringify(
        rootEnv['VITE_API_URL'] ?? `http://localhost:${apiPort}/api/v1`,
      ),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
    },
  };
});
