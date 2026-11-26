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
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('@mui/x-charts') ||
              id.includes('@mui/x-internals') ||
              id.includes('d3-') ||
              id.includes('victory-vendor') ||
              id.includes('internmap')
            ) {
              return 'vendor-charts';
            }
            if (id.includes('@mui/') || id.includes('@emotion/')) return 'vendor-mui';
            if (id.includes('@sentry/')) return 'vendor-sentry';
            if (id.includes('/react/') || id.includes('\\react\\') || id.includes('/react-dom/') || id.includes('\\react-dom\\') || id.includes('/scheduler/') || id.includes('\\scheduler\\')) {
              return 'vendor-react';
            }
            return undefined;
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
          target: process.env.GYMVIP_PROXY_TARGET || 'https://gymvip-backend.onrender.com',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
