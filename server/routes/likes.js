import { Router } from "express";
import { requireAuth } from "../modules/auth.js";
import {
  addLike,
  removeLike,
  getDbPool,
  isProductLikedByUser,
} from "../modules/db.js";

const router = Router();

// Промежуточное ПО для проверки авторизации пользователя для всех маршрутов лайков
router.use(requireAuth);

// Переключить статус лайка для товара
router.post("/toggle", async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }

  try {
    // Используем функцию-обёртку для проверки лайка
    const liked = await isProductLikedByUser(userId, productId);

    if (liked) {
      await removeLike(userId, productId);
      res.json({ success: true, liked: false, message: "Product unliked." });
    } else {
      await addLike(userId, productId);
      res.json({ success: true, liked: true, message: "Product liked." });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;
