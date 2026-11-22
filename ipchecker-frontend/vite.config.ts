/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development, run the services with `docker compose up` and this dev server
// forwards /api and /monitor to the gateway on :8080, exactly as Nginx does in Docker.
const gateway = process.env.GATEWAY ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': gateway,
      '/monitor': gateway,
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
