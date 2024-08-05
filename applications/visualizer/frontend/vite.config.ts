import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PORT = 9000;

// https://vitejs.dev/config/
const defaultConfig = {
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
  ],
  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled", "@mui/material/Tooltip"],
  },
  build: {
    sourcemap: !process.env.NO_SOURCEMAP,
  },
  // publicDir: 'src/assets',
};

export default defineConfig(({ command, mode }) => {
  if (command !== "serve") {
    return defaultConfig;
  }
  const isDev = mode === "development";
  const port = process.env.PORT || PORT;
  const theDomain = process.env.DOMAIN || "http://127.0.0.1:8000";

  const replaceHost = (uri: string, appName: string) => (uri.includes("visualizer") && uri.replace("visualizer", appName + "." + theDomain)) || uri;

  return {
    ...defaultConfig,
    build: {
      sourcemap: isDev,
    },
    server: {
      compress: true,
      port: Number(port),
      proxy: {
        "/api": {
          target: replaceHost(theDomain, "visualizer"),
          changeOrigin: isDev,
          secure: !isDev,
        },
      },
    },
  };
});
