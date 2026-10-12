import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' permet d'ouvrir le build depuis n'importe quel sous-dossier
// (hébergement statique gratuit, GitHub Pages, clé USB pour la démo).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
