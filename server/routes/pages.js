// server/routes/pages.js
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");

router.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});
router.get("/catalog", (req, res) => {
  res.sendFile(path.join(clientDir, "catalog.html"));
});
router.get("/about", (req, res) => {
  res.sendFile(path.join(clientDir, "about.html"));
});
router.get("/contacts", (req, res) => {
  res.sendFile(path.join(clientDir, "contacts.html"));
});
router.get("/product/:id", (req, res) => {
  res.sendFile(path.join(clientDir, "product.html"));
});

export default router;
