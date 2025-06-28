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
  getAllPurchases,
  getProductsByArticlePrefix,
  getProductsByCategory,
  getAllCategories,
} from "../modules/db.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");

router.get("/", async (req, res) => {
  try {
    // Получить все продукты и взять первые 3 как избранные
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
    res.render("index", { featuredProducts: [] }); // Рендерим страницу даже если БД недоступна
  }
});
router.get("/catalog", async (req, res) => {
  try {
    const sort = req.query.sort || "popular";
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = 6;
    const allProducts = await getAllProducts();
    let products = [...allProducts];
    let likedProductIds = [];
    if (req.user) {
      likedProductIds = await getLikedProductIdsByUserId(req.user.id);
    }
    let productsWithLikes = products.map((product) => ({
      ...product,
      is_liked: likedProductIds.includes(product.id),
    }));

    // Сортировка
    switch (sort) {
      case "price-asc":
        productsWithLikes.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        productsWithLikes.sort((a, b) => b.price - a.price);
        break;
      case "name":
        productsWithLikes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "new":
        productsWithLikes.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
      default:
        break;
    }

    // Пагинация
    const total = productsWithLikes.length;
    const totalPages = Math.ceil(total / perPage);
    const paginatedProducts = productsWithLikes.slice(
      (page - 1) * perPage,
      page * perPage
    );

    // Формируем массив страниц для шаблона
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ number: i, active: i === page });
    }

    res.render("catalog", {
      products: paginatedProducts,
      sort,
      pages,
      prevPage: page > 1 ? page - 1 : 1,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : totalPages,
      hasNext: page < totalPages,
      total,
    });
  } catch (error) {
    console.error("Error fetching catalog products:", error);
    res.status(500).send("Error loading catalog.");
  }
});
router.get("/about", async (req, res) => {
  try {
    let content = await getPageContent("about");

    // Если нет контента, подставляем текст по умолчанию
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

    // Корректно парсим images
    try {
      product.images =
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : Array.isArray(product.images)
          ? product.images
          : [];
    } catch (e) {
      product.images = [];
    }

    let isLiked = false;
    if (req.user) {
      const likedProductIds = await getLikedProductIdsByUserId(req.user.id);
      isLiked = likedProductIds.includes(parseInt(productId, 10));
    }

    // Attempt to parse specifications, provide an empty object if it fails
    let specifications = {};
    try {
      if (product.spec_json) {
        specifications =
          typeof product.spec_json === "string"
            ? JSON.parse(product.spec_json)
            : product.spec_json;
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

    // Определяем, нужно ли показывать размеры
    const showSizes =
      product.category === "rings" || product.category === "bracelets";
    res.render("product", {
      product: { ...product, is_liked: isLiked, specifications, sizes },
      reviews,
      isProductPage: true,
      showSizes,
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
      const allUsers = await getAllUsers();
      const purchases = await getAllPurchases();
      const category = req.query.category || "all";
      const categories = await getAllCategories();
      let products;
      if (category === "all") {
        products = await getAllProducts();
      } else {
        products = await getProductsByCategory(category);
      }
      res.render("profile", {
        user: req.user,
        users: allUsers,
        products,
        purchases,
        selectedCategory: category,
        categories,
      });
    } else {
      const likedProducts = await getLikedProductsByUserId(req.user.id);
      res.render("profile", { user: req.user, likedProducts: likedProducts });
    }
  } catch (error) {
    console.error("Error loading profile page:", error);
    res.status(500).send("Error loading profile page.");
  }
});

router.get("/catalog/rings", async (req, res) => {
  const sort = req.query.sort || "popular";
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 6;
  let products = await getProductsByArticlePrefix("RIN");

  // Сортировка
  switch (sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "new":
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    default:
      break;
  }

  // Пагинация
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const paginatedProducts = products.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Формируем массив страниц для шаблона
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({ number: i, active: i === page });
  }

  res.render("rings", {
    products: paginatedProducts,
    sort,
    pages,
    prevPage: page > 1 ? page - 1 : 1,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : totalPages,
    hasNext: page < totalPages,
    total,
  });
});

router.get("/catalog/necklaces", async (req, res) => {
  const sort = req.query.sort || "popular";
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 6;
  let products = await getProductsByArticlePrefix("NEC");

  switch (sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "new":
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    default:
      break;
  }

  // Пагинация
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const paginatedProducts = products.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Формируем массив страниц для шаблона
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({ number: i, active: i === page });
  }

  res.render("necklaces", {
    products: paginatedProducts,
    sort,
    pages,
    prevPage: page > 1 ? page - 1 : 1,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : totalPages,
    hasNext: page < totalPages,
    total,
  });
});

router.get("/catalog/earrings", async (req, res) => {
  const sort = req.query.sort || "popular";
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 6;
  let products = await getProductsByArticlePrefix("EAR");

  switch (sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "new":
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    default:
      break;
  }

  // Пагинация
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const paginatedProducts = products.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Формируем массив страниц для шаблона
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({ number: i, active: i === page });
  }

  res.render("earrings", {
    products: paginatedProducts,
    sort,
    pages,
    prevPage: page > 1 ? page - 1 : 1,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : totalPages,
    hasNext: page < totalPages,
    total,
  });
});

router.get("/catalog/bracelets", async (req, res) => {
  const sort = req.query.sort || "popular";
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = 6;
  let products = await getProductsByArticlePrefix("BRA");

  switch (sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "new":
      products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    default:
      break;
  }

  // Пагинация
  const total = products.length;
  const totalPages = Math.ceil(total / perPage);
  const paginatedProducts = products.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Формируем массив страниц для шаблона
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({ number: i, active: i === page });
  }

  res.render("bracelets", {
    products: paginatedProducts,
    sort,
    pages,
    prevPage: page > 1 ? page - 1 : 1,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : totalPages,
    hasNext: page < totalPages,
    total,
  });
});

export default router;
