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
import { initDbPool, findActiveUserByLoginOrEmail } from "./modules/db.js";
import { sassMiddleware } from "./modules/sass-middleware.js";
import helpers from "./modules/handlebars-helpers.js";
import usersRoutes from "./routes/users.js";
import pagesRouter from "./routes/pages.js";
import likesRouter from "./routes/likes.js";
import cartRouter from "./routes/cart.js";

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
        req.user = user; // for requireAuth
      }
    } catch (e) {
      console.error("Error fetching user for session:", e);
    }
  }
  next();
});

// Legacy routes
webserver.get("/app", (_req, res) => res.redirect("/"));
webserver.get("/register", (_req, res) => res.redirect("/?register=true"));
webserver.get("/login", (_req, res) => res.redirect("/?login=true"));

// === 6) Mount API routes ===
webserver.use("/api/users", usersRoutes);
webserver.use("/api/likes", likesRouter);
webserver.use("/api/cart", cartRouter);

// === 7) Mount pages routes ===
webserver.use("/", pagesRouter);

// === 8) Start HTTP server ===
webserver.listen(HTTP_PORT, () => {
  console.log(`HTTP listening on http://localhost:${HTTP_PORT}`);
});
