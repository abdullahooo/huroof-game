import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'حروف ZONE | E-Sports Match',
        short_name: 'حروف',
        description: 'لعبة مسابقات حروف التفاعلية الاحترافية',
        theme_color: '#050508',
        background_color: '#050508',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    {
      name: 'huroof-local-relay',
      configureServer(server) {
        // استقبال تحديثات الشاشة وتمريرها للجوال
        server.ws.on('huroof:state_update', (data, client) => {
          server.ws.send('huroof:state_update', data);
        });
        // استقبال أوامر الجوال وتمريرها للشاشة
        server.ws.on('huroof:remote_action', (data, client) => {
          server.ws.send('huroof:remote_action', data);
        });
      }
    }
  ],
})
