import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const backendEnvDir = fileURLToPath(new URL("../Backend", import.meta.url));
  const backendEnv = loadEnv(mode, backendEnvDir, "");
  const backendPort = String(backendEnv.PORT || "5000").trim() || "5000";

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_BACKEND_PORT": JSON.stringify(backendPort),
    },
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
