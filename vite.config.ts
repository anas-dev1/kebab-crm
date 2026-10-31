import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kebab CRM',
        short_name: 'Kebab CRM',
        description: 'Pipeline de prospection à deux : maquettes, vidéos, relances.',
        theme_color: '#0f172a',
        background_color: '#f1f5f9',
        display: 'standalone',
        lang: 'fr',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
})
