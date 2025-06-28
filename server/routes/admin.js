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

// Добавление нового товара (API для админки)
router.post("/products/new", upload.array("images", 4), async (req, res) => {
  try {
    // Сжать и сохранить изображения
    const imageUrls = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const ext = path.extname(file.originalname) || ".jpg";
      const filename = `product_${Date.now()}_${i}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await sharp(file.buffer)
        .resize(800, 800, { fit: "inside" })
        .jpeg({ quality: 80 })
        .toFile(filepath);
      imageUrls.push(`/uploads/products/${filename}`);
    }
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
    const productId = await addProduct({
      name,
      price,
      old_price,
      brand,
      article,
      category,
      description,
      spec_json,
      image_url: imageUrls[0] || null,
      images: JSON.stringify(imageUrls),
    });
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
      let image_url = undefined;
      let images = undefined;
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const ext = path.extname(file.originalname) || ".jpg";
          const filename = `product_${Date.now()}_${i}${ext}`;
          const filepath = path.join(uploadDir, filename);
          await sharp(file.buffer)
            .resize(800, 800, { fit: "inside" })
            .jpeg({ quality: 80 })
            .toFile(filepath);
          imageUrls.push(`/uploads/products/${filename}`);
        }
        image_url = imageUrls[0] || null;
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
      if (image_url !== undefined) updateData.image_url = image_url;
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
