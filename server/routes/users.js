import { Router } from "express";
import {
  register,
  activate,
  login,
  logout,
  whoami,
  requireAuth,
} from "../modules/auth.js";

const router = Router();

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
