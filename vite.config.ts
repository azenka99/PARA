/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' -> uygulama hangi alt dizinde barındırılırsa barındırılsın
// (örn. GitHub Pages'te /PARA/ altında) dosya yolları doğru çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
