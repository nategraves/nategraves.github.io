import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  server: {
    open: true,
    port: 3000
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
