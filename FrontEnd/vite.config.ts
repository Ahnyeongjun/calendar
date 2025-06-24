import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Sentry 플러그인 (프로덕션 빌드에서만)
    mode === 'production' && sentryVitePlugin({
      org: "calendar-app",
      project: "calendar-react",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourceMaps: {
        assets: ['./dist/assets/**'],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === 'production', // 프로덕션에서만 소스맵 생성
  },
}));
