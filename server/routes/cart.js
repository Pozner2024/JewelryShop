import { Router } from "express";
import { requireAuth } from "../modules/auth.js";
import {
  getCartItems,
  addProductToCart,
  updateProductQuantityInCart,
  removeProductFromCart,
  addPurchase,
  clearCart,
} from "../modules/db.js";

const router = Router();

// All cart routes require a logged-in user
router.use(requireAuth);

// GET /api/cart - Get all items in the cart
router.get("/", async (req, res) => {
  try {
    const cartItems = await getCartItems(req.user.id);
    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching cart." });
  }
});

// POST /api/cart/add - Add a product to the cart
router.post("/add", async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }
  try {
    await addProductToCart(req.user.id, productId, quantity);
    res.json({ success: true, message: "Product added to cart." });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while adding to cart." });
  }
});

// PUT /api/cart/update - Update product quantity
router.put("/update", async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Product ID and quantity are required.",
    });
  }
  if (quantity <= 0) {
    // If quantity is 0 or less, remove the item
    return removeProductFromCart(req.user.id, productId)
      .then(() =>
        res.json({ success: true, message: "Product removed from cart." })
      )
      .catch((error) => {
        console.error("Error updating cart:", error);
        res.status(500).json({
          success: false,
          message: "Server error while updating cart.",
        });
      });
  }
  try {
    await updateProductQuantityInCart(req.user.id, productId, quantity);
    res.json({ success: true, message: "Cart updated." });
  } catch (error) {
    console.error("Error updating cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating cart." });
  }
});

// DELETE /api/cart/remove - Remove a product from the cart
router.delete("/remove", async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }
  try {
    await removeProductFromCart(req.user.id, productId);
    res.json({ success: true, message: "Product removed from cart." });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing from cart.",
    });
  }
});

// POST /api/cart/checkout - Оформить покупку
router.post("/checkout", async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await getCartItems(userId);
    if (!cartItems.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty." });
    }
    for (const item of cartItems) {
      await addPurchase(userId, item.id, item.quantity);
    }
    await clearCart(userId);
    res.json({ success: true, message: "Purchase completed." });
  } catch (error) {
    console.error("Error during checkout:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during checkout." });
  }
});

export default router;
