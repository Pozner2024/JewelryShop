import { Router } from "express";
import { requireAuth } from "../modules/auth.js";
import { addLike, removeLike, getDbPool } from "../modules/db.js";

const router = Router();

// Middleware to ensure user is authenticated for all like routes
router.use(requireAuth);

// Toggle like status for a product
router.post("/toggle", async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }

  try {
    // This logic is a bit simplistic. It attempts to remove a like, and if it fails (doesn't find a row), it adds one.
    // A better approach would be to check first, but this avoids a race condition.
    const pool = getDbPool();
    const [rows] = await pool.query(
      "SELECT * FROM user_likes WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (rows.length > 0) {
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
