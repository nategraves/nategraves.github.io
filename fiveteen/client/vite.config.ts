import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: 'src',
  base: mode === 'production' ? 'https://fiveteen.netlify.app/' : './',
  server: {
    open: true,
    port: 3000
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
}));
