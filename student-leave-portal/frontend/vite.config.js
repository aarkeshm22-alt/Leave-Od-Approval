import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://leave-od-approval.onrender.com', // Change to your exact Node backend port
        changeOrigin: true,
        secure: false,
      }
    }
  }
});