import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/static/v2/' : '/',
  build: { outDir: '../static/v2', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8434',
      '/static/i18n': 'http://127.0.0.1:8434',
      '/static/vendor': 'http://127.0.0.1:8434',
      '/static/favicon.ico': 'http://127.0.0.1:8434',
      '/static/img': 'http://127.0.0.1:8434',
    },
  },
}));
