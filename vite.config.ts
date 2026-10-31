import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // The lazily loaded MapLibre chunk is ~1 MB raw by itself; it never blocks first render.
  build: { chunkSizeWarningLimit: 1200 },
});
