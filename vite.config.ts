import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        sourcemap: !isProduction, // Only in development for debugging
        minify: isProduction ? 'terser' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['lucide-react'],
              charts: ['recharts']
            }
          }
        },
        terserOptions: {
          compress: {
            drop_console: isProduction, // Remove console.log in production
            drop_debugger: isProduction // Remove debugger statements in production
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': isProduction ? 'undefined' : JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': isProduction ? 'undefined' : JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.IS_PRODUCTION': JSON.stringify(isProduction)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
