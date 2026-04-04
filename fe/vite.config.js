import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  // ── Pre-bundling: include heavy deps so Vite caches them ──
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@mui/material',
      'socket.io-client',
      'react-hot-toast',
      'date-fns',
      'axios',
      'react-markdown',
      '@react-google-maps/api',
    ],
    exclude: [
      '@splinetool/react-spline',
      '@splinetool/runtime',
    ],
  },

  build: {
    // Warn at 1MB instead of 500KB (we have intentionally heavy lazy chunks)
    chunkSizeWarningLimit: 1000,

    // Target modern browsers for smaller output
    target: 'esnext',

    // Minify using Vite 8's native oxc minifier (fastest, no esbuild dependency needed)
    minify: 'oxc',

    rollupOptions: {
      output: {
        // ── Manual chunk splitting for 90fps load performance ──
        manualChunks: (id) => {
          // Spline 3D runtime — heaviest, isolated chunk
          if (id.includes('@splinetool')) return 'vendor-spline';

          // Three.js ecosystem
          if (
            id.includes('three') ||
            id.includes('@react-three') ||
            id.includes('cannon')
          ) return 'vendor-three';

          // Physics
          if (id.includes('physics') || id.includes('navmesh') || id.includes('boolean')) return 'vendor-physics';

          // PDF generation
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';

          // Heavy audio
          if (id.includes('howler')) return 'vendor-audio';

          // MUI core
          if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@mui/icons')) return 'vendor-mui';

          // Framer Motion
          if (id.includes('framer-motion')) return 'vendor-motion';

          // React core
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'vendor-react';

          // General vendor
          if (id.includes('/node_modules/')) return 'vendor-misc';
        },
      },
    },
  },

  // ── Dev server optimisations ──
  server: {
    hmr: {
      overlay: true,
    },
    // Pre-warm frequently used modules to get instant HMR
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/pages/Dashboard.jsx',
        './src/components/Sidebar.jsx',
        './src/components/Navbar.jsx',
        './src/context/AuthContext.jsx',
        './src/context/SocketContext.jsx',
      ],
    },
  },

  // ── CSS: only inject what is used ──
  css: {
    devSourcemap: true,
  },
});
