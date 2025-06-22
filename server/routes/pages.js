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
  getSalesData,
  getReviewsByProductId,
  getPageContent,
  updatePageContent,
  getAllUsers,
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
    const allProducts = await getAllProducts();
    const products = allProducts.slice(0, 6); // Limit to 6 products
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
router.get("/about", async (req, res) => {
  try {
    let content = await getPageContent("about");

    // If no content, provide default text
    if (!content) {
      content = `
        <h2>About Our Jewelry Shop</h2>
        <p>Welcome to <strong>JewelryShop</strong>, where elegance meets craftsmanship. We believe that every piece of jewelry tells a story, and we are dedicated to helping you find the perfect piece to tell yours.</p>
        <h3>Our Mission</h3>
        <p>Our mission is to provide high-quality, handcrafted jewelry that celebrates life's special moments. From timeless classics to modern designs, each item in our collection is created with passion and precision.</p>
        <h3>Our Story</h3>
        <p>Founded in 2024, JewelryShop started as a small workshop with a big dream: to make beautiful jewelry accessible to everyone. Today, we are proud to have served thousands of happy customers who trust us for our quality, creativity, and commitment to excellence.</p>
      `;
      // Optionally, save this default content to the DB for future requests
      await updatePageContent("about", content);
    }

    res.render("about", {
      content,
      isAdmin: req.user && req.user.role === "admin",
    });
  } catch (error) {
    console.error("Error fetching about page content:", error);
    res.status(500).send("Error loading about page.");
  }
});

router.post("/about/update", requireAuth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  try {
    const { content } = req.body;
    await updatePageContent("about", content);
    res.status(200).json({ message: "Content updated successfully" });
  } catch (error) {
    console.error("Error updating about page content:", error);
    res.status(500).json({ message: "Failed to update content" });
  }
});

router.get("/contacts", (req, res) => {
  res.render("contacts");
});
router.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);
    const reviews = await getReviewsByProductId(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    let isLiked = false;
    if (req.user) {
      const likedProductIds = await getLikedProductIdsByUserId(req.user.id);
      isLiked = likedProductIds.includes(parseInt(productId, 10));
    }

    // Attempt to parse specifications, provide an empty object if it fails
    let specifications = {};
    try {
      if (product.specifications) {
        specifications =
          typeof product.specifications === "string"
            ? JSON.parse(product.specifications)
            : product.specifications;
      }
    } catch (e) {
      console.error("Failed to parse product specifications:", e);
      // Keep specifications as an empty object
    }

    // Parse sizes attribute from product data
    let sizes = [];
    try {
      if (product.sizes) {
        sizes =
          typeof product.sizes === "string"
            ? JSON.parse(product.sizes)
            : product.sizes;
      }
    } catch (e) {
      console.error("Failed to parse product sizes:", e);
      // Keep sizes as an empty array
    }

    res.render("product", {
      product: { ...product, is_liked: isLiked, specifications, sizes },
      reviews,
    });
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
    if (req.user.role === "admin") {
      // For admins, show all users and all products
      const allUsers = await getAllUsers();
      const allProducts = await getAllProducts();
      const salesData = await getSalesData();
      res.render("profile", {
        user: req.user,
        users: allUsers,
        products: allProducts,
        sales: salesData,
      });
    } else {
      // For regular users, show their liked products
      const likedProducts = await getLikedProductsByUserId(req.user.id);
      res.render("profile", { user: req.user, likedProducts: likedProducts });
    }
  } catch (error) {
    console.error("Error loading profile page:", error);
    res.status(500).send("Error loading profile page.");
  }
});

export default router;
