// server/routes/pages.js
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import { requireAuth } from "../modules/auth.js";
import {
  getLikedProductsByUserId,
  getAllProducts,
  getLikedProductIdsByUserId,
  getProductById,
  getCartItems,
} from "../modules/db.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");

router.get("/", async (req, res) => {
  try {
    // Fetch all products and take the first 3 as featured
    const allProducts = await getAllProducts();
    const featuredProducts = allProducts.slice(0, 3);

    let likedProductIds = [];
    if (req.user) {
      likedProductIds = await getLikedProductIdsByUserId(req.user.id);
    }

    const productsWithLikes = featuredProducts.map((product) => ({
      ...product,
      is_liked: likedProductIds.includes(product.id),
    }));

    res.render("index", { featuredProducts: productsWithLikes });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.render("index", { featuredProducts: [] }); // Render page even if DB fails
  }
});
router.get("/catalog", async (req, res) => {
  try {
    const products = await getAllProducts();
    let likedProductIds = [];
    if (req.user) {
      likedProductIds = await getLikedProductIdsByUserId(req.user.id);
    }
    const productsWithLikes = products.map((product) => ({
      ...product,
      is_liked: likedProductIds.includes(product.id),
    }));
    res.render("catalog", { products: productsWithLikes });
  } catch (error) {
    console.error("Error fetching catalog products:", error);
    res.status(500).send("Error loading catalog.");
  }
});
router.get("/about", (req, res) => {
  res.render("about");
});
router.get("/contacts", (req, res) => {
  res.render("contacts");
});
router.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    let isLiked = false;
    if (req.user) {
      const likedProductIds = await getLikedProductIdsByUserId(req.user.id);
      isLiked = likedProductIds.includes(parseInt(productId, 10));
    }

    res.render("product", { product: { ...product, is_liked: isLiked } });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Error loading product page.");
  }
});

router.get("/cart", requireAuth, async (req, res) => {
  try {
    const cartItems = await getCartItems(req.user.id);
    const cartTotal = cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
    res.render("cart", {
      cartItems: cartItems,
      cartTotal: cartTotal.toFixed(2),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).send("Error loading cart page.");
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const likedProducts = await getLikedProductsByUserId(req.user.id);
    res.render("profile", { user: req.user, likedProducts: likedProducts });
  } catch (error) {
    console.error("Error fetching liked products:", error);
    res.status(500).send("Error loading profile page.");
  }
});

export default router;
