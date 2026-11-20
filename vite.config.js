import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

  return {
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-sentry': ['@sentry/react'],
          },
        },
      },
    },
    plugins: [
      react(),
      sentryVitePlugin({
        org: 'universidad-peruana-union-p0',
        project: 'gymvip-frontend',
        authToken: authToken || undefined,
        disable: !authToken,
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8081',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
