import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const bffUrl = env.FRONTEND_BFF_URL ?? "http://localhost:3004";
  const frontendPort = Number(env.FRONTEND_PORT ?? 5173);

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: frontendPort,
      proxy: {
        "/bff": {
          target: bffUrl,
          changeOrigin: false
        }
      },
      allowedHosts: ["localhost", ".ngrok-free.app", ".ngrok.app"]
    },
    preview: {
      host: "0.0.0.0",
      port: frontendPort
    }
  };
});
