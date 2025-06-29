import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import viteCompression from "vite-plugin-compression";

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
      "^(?!/(styles/|scripts/|assets/|tinymce/|index.html$)).*": {
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
        about: resolve(__dirname, "scripts/about.js"),
        auth: resolve(__dirname, "scripts/auth.js"),
        cart: resolve(__dirname, "scripts/cart.js"),
        likes: resolve(__dirname, "scripts/likes.js"),
        product: resolve(__dirname, "scripts/product.js"),
        profile: resolve(__dirname, "scripts/profile.js"),
        index: resolve(__dirname, "index.html"),
        navigation: resolve(__dirname, "scripts/navigation.js"),
        search: resolve(__dirname, "scripts/search.js"),
      },
      output: {
        // Добавляем content-hash в имена файлов для корректного кеширования
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
  plugins: [viteCompression()],
});
