import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'framer-motion',
      'date-fns',
    ],
    exclude: [],
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          // Feature chunks
          'dashboard-components': [
            './src/components/DailyTasksDashboard.tsx',
            './src/components/CalendarDashboard.tsx',
            './src/components/FinanceDashboard.tsx',
            './src/components/HealthLabDashboard.tsx'
          ],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification with esbuild for better performance
    minify: 'esbuild',
    target: 'esnext',
    // Enable source maps for debugging
    sourcemap: false,
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false,
    },
  },
});