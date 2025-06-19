// server/server.js

import "./modules/init-env.js";
import express from "express";
import session from "express-session";
import path from "path";
import { engine } from "express-handlebars";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import crypto from "crypto";

import {
  HTTP_PORT,
  CLIENT_DIR,
  sessionConfig,
  CustomSessionStore,
} from "./modules/config.js";
import { initDbPool } from "./modules/db.js";
import { sassMiddleware } from "./modules/sass-middleware.js";
import helpers from "./modules/handlebars-helpers.js";
import usersRoutes from "./routes/users.js";
import pagesRouter from "./routes/pages.js";

// === 1) Initialize database ===
await initDbPool();

// === 2) Create Express application ===
const webserver = express();

// === 3) Configure Handlebars view engine ===
// Определяем корневую папку для шаблонов: server/views
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsPath = path.join(__dirname, "views");
const layoutsPath = path.join(viewsPath, "layouts");
const partialsPath = path.join(viewsPath, "partials");

webserver.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    helpers,
    layoutsDir: layoutsPath,
    partialsDir: partialsPath,
  })
);
webserver.set("view engine", ".hbs");
webserver.set("views", viewsPath);
console.log("Views path:", viewsPath);

// === 4) Middleware ===
// Compile SCSS on the fly
webserver.use(sassMiddleware);

// Serve static assets from client directory
// CLIENT_DIR должен быть абсолютным путём к папке client (например: path.join(process.cwd(), 'client', 'dist'))
webserver.use(express.static(CLIENT_DIR, { index: false }));

// Parse URL-encoded bodies and JSON
webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.json());

// Session handling, supporting X-Session-Id header
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

// Legacy routes
webserver.get("/app", (_req, res) => res.redirect("/"));
webserver.get("/register", (_req, res) => res.redirect("/?register=true"));
webserver.get("/login", (_req, res) => res.redirect("/?login=true"));

// === 6) Mount API routes under /api/users ===
webserver.use("/api/users", usersRoutes);

// === 7) Mount pages routes ===
webserver.use("/", pagesRouter);

// === 8) Start HTTP server ===
webserver.listen(HTTP_PORT, () => {
  console.log(`HTTP listening on http://localhost:${HTTP_PORT}`);
});
