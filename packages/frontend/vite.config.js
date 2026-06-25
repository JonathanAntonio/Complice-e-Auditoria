import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const bffUrl = env.FRONTEND_BFF_URL ?? "http://localhost:4000";
  const frontendPort = Number(env.FRONTEND_PORT ?? 5173);

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            antd: ["antd"],
            icons: ["lucide-react"],
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: frontendPort,
      proxy: {
        "/auth/": { target: bffUrl, changeOrigin: false },
        "/compliance/violations": { target: bffUrl, changeOrigin: false },
        "/compliance/retention": { target: bffUrl, changeOrigin: false },
        "/audit/logs": { target: bffUrl, changeOrigin: false },
        "/audit/retention": { target: bffUrl, changeOrigin: false },
        "/risk/scores": { target: bffUrl, changeOrigin: false },
        "/risk/events": { target: bffUrl, changeOrigin: false },
        "/messaging/flow": { target: bffUrl, changeOrigin: false },
        "/reports/": { target: bffUrl, changeOrigin: false },
        "/notifications/": { target: bffUrl, changeOrigin: false },
        "/admin/": { target: bffUrl, changeOrigin: false },
        "/integrations/": { target: bffUrl, changeOrigin: false },
        "/health": { target: bffUrl, changeOrigin: false },
      },
      allowedHosts: ["localhost", ".ngrok-free.app", ".ngrok.app","rage-awhile-snowcap.ngrok-free.dev"]
    },
    preview: {
      host: "0.0.0.0",
      port: frontendPort
    }
  };
});
