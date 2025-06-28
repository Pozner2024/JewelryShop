import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { addProduct, updateProduct, deleteProduct } from "../modules/db.js";
const router = express.Router();
// Все admin роуты отключены

const uploadDir = path.join(process.cwd(), "uploads/products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Функция для "чистки" имени (убрать пробелы, спецсимволы и т.д.)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9\-]/g, "") // Remove all non-alphanumeric chars except -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Trim - from start and end
}

// Добавление нового товара (API для админки)
router.post("/products/new", upload.array("images", 4), async (req, res) => {
  try {
    // Остальные поля из формы
    const {
      name,
      price,
      old_price,
      brand,
      article,
      category,
      description,
      spec_json,
    } = req.body;
    // 1. Сначала создаём товар без images
    const productId = await addProduct({
      name,
      price,
      old_price,
      brand,
      article,
      category,
      description,
      spec_json,
      images: "[]",
    });
    // 2. Сжать и сохранить изображения
    const imageUrls = [];
    const baseName = slugify(req.body.name || "product");
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const ext = path.extname(file.originalname) || ".jpg";
      const filename = `${baseName}-${i + 1}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await sharp(file.buffer)
        .resize(800, 800, { fit: "inside" })
        .jpeg({ quality: 80 })
        .toFile(filepath);
      imageUrls.push(`/uploads/products/${filename}`);
    }
    // 3. После загрузки файлов обновляем поле images
    if (imageUrls.length > 0) {
      await updateProduct(productId, {
        name,
        price,
        old_price,
        brand,
        article,
        category,
        description,
        spec_json,
        images: JSON.stringify(imageUrls),
      });
    }
    res.status(201).json({ success: true, id: productId, images: imageUrls });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Редактирование товара (API для админки)
router.post(
  "/products/:id/edit",
  upload.array("images", 4),
  async (req, res) => {
    try {
      const {
        name,
        price,
        old_price,
        brand,
        article,
        category,
        description,
        spec_json,
      } = req.body;
      const { id } = req.params;
      let images = undefined;
      // Получаем старые изображения из скрытого поля
      let existingImages = [];
      if (req.body.existing_images) {
        try {
          existingImages = JSON.parse(req.body.existing_images);
        } catch (e) {
          existingImages = [];
        }
      }
      // Собираем итоговый массив изображений
      const imageUrls = [];
      for (let i = 0; i < 4; i++) {
        const file = req.files && req.files[i];
        if (file) {
          const ext = path.extname(file.originalname) || ".jpg";
          const baseName = slugify(name || "product");
          const filename = `${baseName}-${i + 1}${ext}`;
          const filepath = path.join(uploadDir, filename);
          await sharp(file.buffer)
            .resize(800, 800, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toFile(filepath);
          imageUrls[i] = `/uploads/products/${filename}`;
        } else if (existingImages[i]) {
          imageUrls[i] = existingImages[i];
        }
      }
      if (imageUrls.length > 0) {
        images = JSON.stringify(imageUrls);
      }
      const updateData = {
        name,
        price,
        old_price,
        brand,
        article,
        category,
        description,
        spec_json,
      };
      if (images !== undefined) updateData.images = images;
      await updateProduct(id, updateData);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Удаление товара (API для админки)
router.post("/products/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
