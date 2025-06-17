// client/vite.config.js
import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// В ESM-модуле __dirname нужно вычислить так:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем переменные из server/.env
dotenv.config({ path: resolve(__dirname, "../server/.env") });

// Если по каким-то причинам HTTP_PORT не задан, падаем на 3000
const serverPort = process.env.HTTP_PORT || 3000;

export default defineConfig({
  root: resolve(__dirname),

  server: {
    port: 5173,
    proxy: {
      // Всё, что не ассет (styles/, scripts/, assets/ или index.html),
      // проксируем на Express
      "^(?!/(styles/|scripts/|assets/|index\\.html$)).*": {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },

  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
