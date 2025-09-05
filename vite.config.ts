import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable code splitting and optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-dialog', '@radix-ui/react-toast'],
          // Charts and data visualization
          charts: ['recharts'],
          // Supabase and database
          database: ['@supabase/supabase-js'],
          // Utilities
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'esbuild', // Use esbuild instead of terser
    // Enable source maps for debugging
    sourcemap: false, // Disable in production for better performance
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'recharts',
    ],
    exclude: ['lucide-react'],
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
  },
});