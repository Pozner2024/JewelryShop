// server/server.js

import "./modules/init-env.js";
import express from "express";
import session from "express-session";
import path from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import crypto from "crypto";
import exphbs from "express-handlebars";

import {
  HTTP_PORT,
  CLIENT_DIR,
  sessionConfig,
  CustomSessionStore,
} from "./modules/config.js";
import { initDbPool, findActiveUserByLoginOrEmail } from "./modules/db.js";
import { sassMiddleware } from "./modules/sass-middleware.js";
import helpers from "./modules/handlebars-helpers.js";
import usersRoutes from "./routes/users.js";
import pagesRouter from "./routes/pages.js";
import likesRouter from "./routes/likes.js";
import cartRouter from "./routes/cart.js";
import adminRouter from "./routes/admin.js";

// --- Подключение к базе данных ---
await initDbPool();

// --- Создание экземпляра Express ---
const webserver = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsPath = path.join(__dirname, "views");
const layoutsPath = path.join(viewsPath, "layouts");
const partialsPath = path.join(viewsPath, "partials");

const hbs = exphbs.create({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: layoutsPath,
  partialsDir: partialsPath,
  helpers: {
    ...helpers,
  },
});

webserver.engine(".hbs", hbs.engine);
webserver.set("view engine", ".hbs");
webserver.set("views", viewsPath);

webserver.use(sassMiddleware);

const clientPublicDir = path.join(CLIENT_DIR, "public");
webserver.use(express.static(clientPublicDir));

// Раздача ассетов Vite из dist/assets по пути /assets
webserver.use(
  "/assets",
  express.static(path.join(CLIENT_DIR, "dist", "assets"))
);

// Раздача изображений из client/images по пути /images
webserver.use("/images", express.static(path.join(CLIENT_DIR, "images")));

// Раздача изображений товаров из uploads/products
webserver.use(
  "/uploads/products",
  express.static(path.join(process.cwd(), "uploads/products"))
);

// Раздача статических файлов из директории клиента
webserver.use(express.static(CLIENT_DIR, { index: false }));

// Парсинг URL-encoded и JSON тел запросов
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.json());

// Обработка сессий, поддержка заголовка X-Session-Id
const sessionStore = new CustomSessionStore();
webserver.use((req, res, next) => {
  const sid = req.headers["x-session-id"];
  if (sid) {
    req.sessionID = sid;
  }
  next();
});
webserver.use(
  session({
    ...sessionConfig,
    store: sessionStore,
  })
);

webserver.use(async (req, res, next) => {
  if (req.session?.user_login) {
    try {
      const user = await findActiveUserByLoginOrEmail(req.session.user_login);
      if (user) {
        res.locals.user = {
          login: user.login,
          email: user.user_email,
          role: user.role,
        };
        res.locals.isAdmin = user.role === "admin";
        req.user = user;
      }
    } catch (e) {
      console.error("Error fetching user for session:", e);
    }
  }
  res.locals.tinyMceApiKey = process.env.TINYMCE_API_KEY || "";
  next();
});

// --- Редиректы для SPA-маршрутов регистрации и логина ---
webserver.get("/app", (_req, res) => res.redirect("/"));
webserver.get("/register", (_req, res) => res.redirect("/?register=true"));
webserver.get("/login", (_req, res) => res.redirect("/?login=true"));

webserver.use("/api/users", usersRoutes);
webserver.use("/api/likes", likesRouter);
webserver.use("/api/cart", cartRouter);

webserver.use("/", pagesRouter);
webserver.use("/admin", adminRouter);

webserver.listen(HTTP_PORT, () => {
  console.log(`HTTP listening on http://localhost:${HTTP_PORT}`);
});

export { webserver };
