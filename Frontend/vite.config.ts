import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import FullReload from 'vite-plugin-full-reload';
import mkcert from 'vite-plugin-mkcert';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'fs';
// const BaseUrl = import.meta.env.VITE_API_LOCAL_HOST_BACKEND;

// https://vitejs.dev/config/
export default defineConfig({
  // server: {
  //   // https: true as any,
  //   port: 5173,
  //   https: {
  //     key: fs.readFileSync('./ssl/certificate.key'),
  //     cert: fs.readFileSync('./ssl/certificate.crt'),
  //   },
  //   proxy: {
  //     '/api': {
  //       target: 'https://127.0.0.1:3000', // Point to your Express HTTPS server
  //       changeOrigin: true,
  //       secure: true, // Now secure because certs are trusted
  //     },
  //   },
  //   host: '127.0.0.1', // Exposes the app to your local network
  //   // proxy: {
  //   //   '/api': {
  //   //     target: 'https://localhost:3000', // Your backend server URL
  //   //     changeOrigin: true,
  //   //     secure: true, // Set to true if using HTTPS with a valid certificate
  //   //   },
  //   // },
  // },

  // plugins:
  //   [
  //     nodePolyfills({
  //       include: ['crypto', 'util', 'stream', 'buffer'] // Add other Node modules if needed - 'stream', 'util', 'buffer'
  //     }),
  //     react(),
  //     FullReload([
  //       'src/components/**/*.*',
  //       'src/context/**/*.*',
  //       'src/*.*',
  //       'ReactiveFrontend/public/*.*'
  //     ]),
  //     mkcert()
  //   ],
  plugins: [react()],
  server: {
    host: true, // Exposes the server to your local network (0.0.0.0)
    port: 5173, // Optional: Fixes the port number (defaults to 5173 if not set)
  }
});
