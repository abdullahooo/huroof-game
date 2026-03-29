import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
