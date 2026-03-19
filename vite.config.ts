import { defineConfig } from 'vite';

export default defineConfig({
  base: '/survivors2/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
