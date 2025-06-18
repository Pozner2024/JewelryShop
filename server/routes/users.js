import { Router } from "express";
import {
  register,
  activate,
  login,
  logout,
  whoami,
  requireAuth,
} from "../modules/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Разрешённые страницы (без index)
const allowedPages = ["catalog", "product", "about", "contacts"];

// Функция для получения partial-фрагмента
function getPartial(name) {
  return fs.readFileSync(
    path.join(__dirname, "../../client/partials", `${name}.html`),
    "utf8"
  );
}

// Главная страница
router.get("/", (req, res, next) => {
  const filePath = path.join(__dirname, "../../client", "index.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return next();
    html = html
      .replace("<!--HEADER-->", getPartial("header"))
      .replace("<!--FOOTER-->", getPartial("footer"))
      .replace("<!--AUTH-MODALS-->", getPartial("auth-modals"));
    res.send(html);
  });
});

// Остальные страницы
router.get("/:page", (req, res, next) => {
  const page = req.params.page;
  if (!allowedPages.includes(page)) {
    return next(); // 404
  }
  const filePath = path.join(__dirname, "../../client", `${page}.html`);
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return next();
    html = html
      .replace("<!--HEADER-->", getPartial("header"))
      .replace("<!--FOOTER-->", getPartial("footer"))
      .replace("<!--AUTH-MODALS-->", getPartial("auth-modals"));
    res.send(html);
  });
});

// POST   /api/users/register
router.post("/register", register);

// GET    /api/users/activate
router.get("/activate", activate);

// GET    /api/users/whoami
router.get("/whoami", requireAuth, whoami);

// POST   /api/users/login
router.post("/login", login);

// GET    /api/users/logout
router.get("/logout", logout);

export default router;
