// server/routes/pages.js
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");

router.get("/", (req, res) => {
  res.render("index");
});
router.get("/catalog", (req, res) => {
  res.render("catalog");
});
router.get("/about", (req, res) => {
  res.render("about");
});
router.get("/contacts", (req, res) => {
  res.render("contacts");
});
router.get("/product/:id", (req, res) => {
  res.render("product", { id: req.params.id });
});

export default router;
