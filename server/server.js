// server/server.js

import "./modules/init-env.js";
import express from "express";
import session from "express-session";
import path from "path";
import { engine } from "express-handlebars";

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
const viewsPath = path.join(process.cwd(), "server", "views");
const layoutsPath = path.join(viewsPath, "layouts");
const partialsPath = path.join(viewsPath, "partials");

webserver.engine(
  ".hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: layoutsPath,
    partialsDir: partialsPath,
    helpers,
  })
);
webserver.set("view engine", ".hbs");
webserver.set("views", viewsPath);

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

// === 5) Page routes ===

// Home page
// webserver.get("/", (req, res) => {
//   res.render("index", {
//     title: "Home",
//     siteName: "ShineCraft",
//     scripts: ["scripts/auth.js"],
//     isHomePage: true,
//     hero: {
//       title: "Exclusive ShineCraft",
//       subtitle:
//         "Discover our collection of exquisite jewelry crafted by masters with years of experience",
//       ctaText: "View Catalog",
//       image: "hero-jewelry.jpg",
//       imageAlt: "ShineCraft",
//     },
//     categoriesTitle: "Product Categories",
//     categories: [
//       { name: "Rings", image: "rings.jpg", count: 120 },
//       { name: "Necklaces", image: "necklaces.jpg", count: 85 },
//       { name: "Earrings", image: "earrings.jpg", count: 95 },
//       { name: "Bracelets", image: "bracelets.jpg", count: 60 },
//     ],
//     featuredTitle: "Featured Products",
//     featuredProducts: [
//       {
//         id: 1,
//         slug: "gold-ring-diamond",
//         name: "Gold Diamond Ring",
//         price: "$1,200",
//         image: "product-1.jpg",
//       },
//       {
//         id: 2,
//         slug: "silver-earrings-pearls",
//         name: "Silver Pearl Earrings",
//         price: "$210",
//         image: "product-2.jpg",
//       },
//       {
//         id: 3,
//         slug: "platinum-necklace",
//         name: "Platinum Necklace",
//         price: "$1,680",
//         image: "product-3.jpg",
//       },
//     ],
//   });
// });

// Catalog page
// webserver.get("/catalog", (req, res) => {
//   res.render("catalog", {
//     title: "Каталог",
//     siteName: "ShineCraft",
//     scripts: ["scripts/auth.js"],
//     isCatalogPage: true,
//     pageTitle: "Jewelry Catalog",
//     pageSubtitle: "Over 500 unique jewelry pieces in our collection",
//     productsCount: 120,
//     products: [
//       {
//         id: 1,
//         slug: "gold-ring-diamond",
//         name: "Gold Ring with Diamond",
//         brand: "Elegant",
//         article: "12345",
//         price: "89 990",
//         oldPrice: "99 990",
//         rating: 4,
//         reviewsCount: 24,
//         image: "product-1.jpg",
//         badge: "New",
//         badgeType: "new",
//       },
//       {
//         id: 2,
//         slug: "silver-earrings-pearls",
//         name: "Silver Earrings with Pearls",
//         brand: "Classic",
//         article: "12346",
//         price: "15 490",
//         rating: 5,
//         reviewsCount: 18,
//         image: "product-2.jpg",
//       },
//       {
//         id: 3,
//         slug: "platinum-necklace",
//         name: "Platinum Necklace with Sapphires",
//         brand: "Premium",
//         article: "12347",
//         price: "125 000",
//         rating: 5,
//         reviewsCount: 36,
//         image: "product-3.jpg",
//         badge: "Bestseller",
//         badgeType: "hit",
//       },
//       {
//         id: 4,
//         slug: "gold-bracelet",
//         name: "Gold Bracelet with Engraving",
//         brand: "Elegant",
//         article: "12348",
//         price: "42 500",
//         rating: 4,
//         reviewsCount: 12,
//         image: "product-4.jpg",
//       },
//     ],
//     pagination: {
//       currentPage: 1,
//       hasPrev: false,
//       hasNext: true,
//       pages: [
//         { number: 1, active: true },
//         { number: 2, active: false },
//         { number: 3, active: false },
//       ],
//     },
//     // При использовании pagination в шаблонах можно вызывать {{#times pages.length}} ... {{/times}}
//     // и внутри использовать {{@index}} или {{inc @index}} для нумерации.
//   });
// });

// Product detail page
// webserver.get("/product/:slug", (req, res) => {
//   const { slug } = req.params;
//   // Здесь можно подтягивать данные по slug из БД, а не захардкожено
//   res.render("product", { /* ... */ });
// });

// About page
// webserver.get("/about", (req, res) => {
//   res.render("page", { /* ... */ });
// });

// Contacts page
// webserver.get("/contacts", (req, res) => {
//   res.render("page", { /* ... */ });
// });

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
