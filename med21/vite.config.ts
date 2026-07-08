import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      // Allow access from localtest.me
      host: '0.0.0.0',
      port: 3000,

      // Add allowed hosts
      allowedHosts: [
        'localtest.me',
        'localhost',
        '127.0.0.1',
      ],

      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true
      watch: process.env.DISABLE_HMR === 'true' ? null : {},

      historyApiFallback: true,

      proxy: {
        '/api': {
          target: process.env.BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: [
        'localtest.me',
        'localhost',
        '127.0.0.1',
      ],
    },

    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@motion') || id.includes('motion') || id.includes('lucide-react')) return 'vendor-animation';
            if (id.includes('pusher') || id.includes('react-hook-form')) return 'vendor-form';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor';
          },
        },
      },
    },
  };
});
