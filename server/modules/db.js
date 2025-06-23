import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

let pool;

async function createProductsTable() {
  const createTableSql = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            old_price DECIMAL(10, 2),
            image_url VARCHAR(255),
            brand VARCHAR(100),
            article VARCHAR(100),
            description TEXT,
            specifications JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
  await pool.query(createTableSql);
  console.log("✓ 'products' table is ready.");

  // Add mock data if table is empty
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM products");
  if (rows[0].count === 0) {
    const insertSql = `
            INSERT INTO products (name, price, old_price, image_url, brand, article, description, specifications) VALUES
            ('Gold Ring with Diamond ''Solitaire''', 1299.00, 1499.00, '/images/placeholder.svg', 'Elegant', 'Art. 12345', 'This exquisite Solitaire ring is the epitome of elegance and a timeless symbol of love. Crafted from lustrous 18k yellow gold, it features a stunning, brilliant-cut 0.5 carat diamond, held securely in a classic four-prong setting. The band''s sleek and polished design enhances the diamond''s natural sparkle, making it the perfect choice for an engagement or a special anniversary gift.', JSON_OBJECT('Material', '18k Yellow Gold', 'Stone', 'Diamond', 'Carat Weight', '0.5 ct', 'Setting', '4-Prong')),
            ('Silver Earrings with Pearls ''Classic''', 229.00, NULL, '/images/placeholder.svg', 'Classic', 'Art. 12346', 'Embrace timeless sophistication with these Classic silver earrings. Each earring showcases a luminous freshwater pearl, dangling gracefully from a polished sterling silver hook. Their versatile design makes them suitable for both everyday wear and special occasions, adding a touch of grace to any outfit.', JSON_OBJECT('Material', 'Sterling Silver 925', 'Stone', 'Freshwater Pearl', 'Pearl Size', '8mm')),
            ('Platinum Necklace with Sapphires ''Royal''', 1799.00, NULL, '/images/placeholder.svg', 'Premium', 'Art. 12347', 'Make a regal statement with the Royal platinum necklace. This breathtaking piece features a cascade of deep blue sapphires, meticulously set in a durable and radiant platinum chain. It''s a luxurious accessory that is sure to turn heads and become a treasured heirloom.', JSON_OBJECT('Material', 'Platinum 950', 'Stone', 'Sapphire', 'Total Carat Weight', '3.0 ct', 'Length', '18 inches')),
            ('Ruby Bracelet ''Passion''', 1099.00, 1199.00, '/images/placeholder.svg', 'Luxury', 'Art. 12348', 'Ignite your look with the Passion ruby bracelet. This stunning piece is crafted from 14k rose gold and features a line of vibrant, fiery rubies. Its secure clasp and elegant design make it a perfect symbol of love and passion.', JSON_OBJECT('Material', '14k Rose Gold', 'Stone', 'Ruby', 'Total Carat Weight', '2.5 ct', 'Length', '7 inches')),
            ('Diamond Engagement Ring ''Promise''', 1999.00, NULL, '/images/placeholder.svg', 'Eternal', 'Art. 12349', 'The Promise engagement ring is a breathtaking symbol of your commitment. Featuring a dazzling 1-carat center diamond, surrounded by a halo of smaller diamonds and set on a platinum band, this ring is pure sparkle and sophistication.', JSON_OBJECT('Material', 'Platinum 950', 'Main Stone', 'Diamond', 'Main Carat', '1.0 ct', 'Side Stones', 'Diamond', 'Total Carat', '1.5 ct')),
            ('Men''s Titanium Wedding Band ''Union''', 349.00, 399.00, '/images/placeholder.svg', 'Union', 'Art. 12350', 'The Union wedding band is crafted for the modern man. Made from lightweight and durable titanium, it features a comfortable fit and a sophisticated brushed finish. A timeless choice to symbolize your everlasting bond.', JSON_OBJECT('Material', 'Titanium', 'Finish', 'Brushed', 'Width', '6mm'));
        `;
    await pool.query(insertSql);
    console.log("✓ Mock product data inserted.");
  }
}

async function createLikesTable() {
  const createTableSql = `
        CREATE TABLE IF NOT EXISTS user_likes (
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `;
  // Note: A foreign key to a products table is missing as there is no products table yet.
  // If a products table is added, a foreign key should be added:
  // FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  await pool.query(createTableSql);
  console.log("✓ 'user_likes' table is ready.");
}

async function createCartTable() {
  const createTableSql = `
        CREATE TABLE IF NOT EXISTS user_cart (
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `;
  await pool.query(createTableSql);
  console.log("✓ 'user_cart' table is ready.");
}

async function createProductReviewsTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      author_name VARCHAR(255),
      rating INT,
      text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `;
  await pool.query(createTableSql);
  console.log("✓ 'product_reviews' table is ready.");

  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM product_reviews"
  );
  if (rows[0].count === 0) {
    const insertSql = `
      INSERT INTO product_reviews (product_id, author_name, rating, text) VALUES
      (1, 'Alice', 5, 'Absolutely stunning ring! The diamond has so much sparkle. I get compliments on it all the time. Highly recommend!'),
      (1, 'John', 5, 'I bought this for my fiancée and she was overjoyed. The quality is exceptional and it looks even more beautiful in person.'),
      (1, 'Samantha', 4, 'A beautiful and classic ring. The setting is very secure. My only wish is that the band was slightly thicker, but it''s a personal preference. Overall, very happy with this purchase.'),
      (2, 'Bob', 4, 'Very elegant and classic earrings. The pearls are lovely. They are a bit smaller than I expected, but beautiful nonetheless.'),
      (2, 'Clara', 5, 'These were a gift for my mother and she adored them. They have a beautiful luster and are perfect for special occasions.'),
      (3, 'Charlie', 5, 'A true statement piece. The sapphires are a gorgeous deep blue. Worth every penny.'),
      (3, 'Diana', 5, 'This necklace is breathtaking. I wore it to a wedding and received so many compliments. The quality is outstanding.'),
      (4, 'Frank', 5, 'The rubies have such a vibrant color. My wife loves this bracelet. Excellent craftsmanship.'),
      (4, 'Grace', 4, 'A beautiful bracelet, but the clasp is a little tricky to manage on my own. Still, it''s a gorgeous piece of jewelry.'),
      (5, 'David', 5, 'The perfect engagement ring. My partner said yes! The craftsmanship is top-notch.'),
      (6, 'Eve', 5, 'Bought this for my husband and he loves it. It''s very stylish and well-made. Great for daily wear.');
    `;
    await pool.query(insertSql);
    console.log("✓ Mock product reviews inserted.");
  }
}

async function createPageContentTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS page_content (
      page_name VARCHAR(255) PRIMARY KEY,
      content JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableSql);
  console.log("✓ 'page_content' table is ready.");

  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM page_content WHERE page_name = 'about'"
  );
  if (rows[0].count === 0) {
    const defaultContent = {
      blocks: [
        {
          type: "header",
          data: {
            text: "About Our Jewelry Shop",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Welcome to our exclusive jewelry shop, where timeless elegance meets modern craftsmanship. We believe that every piece of jewelry tells a story, and we are here to help you find the one that tells yours.",
          },
        },
      ],
    };
    await pool.query(
      "INSERT INTO page_content (page_name, content) VALUES (?, ?)",
      ["about", JSON.stringify(defaultContent)]
    );
    console.log("✓ Mock 'about' page content inserted.");
  }
}

async function createPurchasesTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `;
  await pool.query(createTableSql);
  console.log("✓ 'purchases' table is ready.");
}

export async function initDbPool() {
  try {
    pool = await mysql.createPool(dbConfig);
    await pool.query("SELECT 1");
    await createProductsTable();
    await createLikesTable();
    await createCartTable();
    await createProductReviewsTable();
    await createPageContentTable();
    await createPurchasesTable();
    console.log("✓ Database connection successful.");
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
  return pool;
}

export function getDbPool() {
  if (!pool) {
    throw new Error("Database pool not initialized. Call initDbPool() first.");
  }
  return pool;
}

async function getPool() {
  // This function is kept for backwards compatibility in this file,
  // but getDbPool should be used externally.
  if (!pool) {
    await initDbPool();
  }
  return pool;
}

export async function findUserByEmail(email) {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE user_email = ?", [
    email,
  ]);
  return rows[0];
}

export async function findUserByLogin(login) {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT * FROM users WHERE login = ?", [
    login,
  ]);
  return rows[0];
}

export async function findUserByLoginOrEmail(loginOrEmail) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE login = ? OR user_email = ?",
    [loginOrEmail, loginOrEmail]
  );
  return rows[0];
}

export async function findActiveUserByLoginOrEmail(loginOrEmail) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE (login = ? OR user_email = ?) AND is_active = 1",
    [loginOrEmail, loginOrEmail]
  );
  return rows[0];
}

export async function createUser(login, email, passwordHash) {
  const pool = await getPool();
  // Временно сохраняем activationToken в поле password_hash
  await pool.query(
    "INSERT INTO users (login, user_email, password_hash, is_active, role) VALUES (?, ?, ?, ?, ?)",
    [login, email, passwordHash, 0, "user"] // Добавляем все необходимые параметры
  );
}

export async function createUserWithToken(
  login,
  email,
  passwordHash,
  activationToken
) {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Создаем пользователя
    const [userResult] = await connection.query(
      "INSERT INTO users (login, user_email, password_hash, is_active, role) VALUES (?, ?, ?, 0, 'user')",
      [login, email, passwordHash]
    );
    const userId = userResult.insertId;

    // Сохраняем токен активации
    await connection.query(
      "INSERT INTO activation_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))",
      [userId, activationToken]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findUserByActivationToken(token) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE password_hash = ? AND is_active = 0",
    [token]
  );
  return rows[0];
}

export async function activateUserAndSetPassword(email, passwordHash) {
  const pool = await getPool();
  await pool.query(
    "UPDATE users SET password_hash = ?, is_active = 1 WHERE user_email = ? AND is_active = 0",
    [passwordHash, email]
  );
}

// === Cart Functions ===

export async function getCartItems(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT p.*, uc.quantity 
         FROM user_cart uc 
         JOIN products p ON uc.product_id = p.id 
         WHERE uc.user_id = ?`,
    [userId]
  );
  return rows;
}

export async function addProductToCart(userId, productId, quantity) {
  const pool = await getPool();
  // Use INSERT ... ON DUPLICATE KEY UPDATE to either add the product or update its quantity
  const sql = `
        INSERT INTO user_cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity);
    `;
  await pool.query(sql, [userId, productId, quantity]);
}

export async function updateProductQuantityInCart(userId, productId, quantity) {
  const pool = await getPool();
  const sql =
    "UPDATE user_cart SET quantity = ? WHERE user_id = ? AND product_id = ?";
  await pool.query(sql, [quantity, userId, productId]);
}

export async function removeProductFromCart(userId, productId) {
  const pool = await getPool();
  await pool.query(
    "DELETE FROM user_cart WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );
}

export async function clearCart(userId) {
  const pool = await getPool();
  await pool.query("DELETE FROM user_cart WHERE user_id = ?", [userId]);
}

// Функции для работы с файлами
export async function saveFile(filename, originalname, userId, comment) {
  const pool = await getPool();
  await pool.query(
    "INSERT INTO files (filename, originalname, user_id, comment) VALUES (?, ?, ?, ?)",
    [filename, originalname, userId, comment]
  );
}

export async function getUserFiles(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function deleteFile(filename, userId) {
  const pool = await getPool();
  await pool.query("DELETE FROM files WHERE filename = ? AND user_id = ?", [
    filename,
    userId,
  ]);
}

export async function findFileByName(filename, userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM files WHERE filename = ? AND user_id = ?",
    [filename, userId]
  );
  return rows[0];
}

// === Likes Functions ===

export async function addLike(userId, productId) {
  const pool = await getPool();
  await pool.query(
    "INSERT INTO user_likes (user_id, product_id) VALUES (?, ?)",
    [userId, productId]
  );
}

export async function removeLike(userId, productId) {
  const pool = await getPool();
  await pool.query(
    "DELETE FROM user_likes WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );
}

export async function getLikedProductsByUserId(userId) {
  const pool = await getPool();
  // This query assumes a 'products' table exists.
  // Since it doesn't, this will fail. I will need to mock product data or create the table.
  // For now, I will write the query as if 'products' table exists.
  const [rows] = await pool.query(
    `SELECT p.* FROM products p
         JOIN user_likes ul ON p.id = ul.product_id
         WHERE ul.user_id = ?`,
    [userId]
  );
  return rows;
}

export async function getAllProducts() {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT * FROM products");
  return rows;
}

export async function getLikedProductIdsByUserId(userId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT product_id FROM user_likes WHERE user_id = ?",
    [userId]
  );
  return rows.map((row) => row.product_id);
}

export async function getProductById(id) {
  const pool = await getPool();
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
  return rows[0];
}

export async function getReviewsByProductId(productId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC",
    [productId]
  );
  return rows;
}

export async function getAllUsers() {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT id, login, user_email, role, created_at, is_active FROM users"
  );
  return rows;
}

export async function getSalesData() {
  // This is a placeholder for a real sales data query
  return [
    { month: "January", sales: 150000 },
    { month: "February", sales: 180000 },
    { month: "March", sales: 220000 },
  ];
}

export async function getPageContent(pageName) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT content FROM page_content WHERE page_name = ?",
    [pageName]
  );
  return rows[0] ? rows[0].content : null;
}

export async function updatePageContent(pageName, content) {
  const pool = await getPool();
  await pool.query(
    "INSERT INTO page_content (page_name, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = ?",
    [pageName, content, content]
  );
}

export async function isProductLikedByUser(userId, productId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    "SELECT 1 FROM user_likes WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );
  return rows.length > 0;
}

export async function addPurchase(userId, productId, quantity) {
  const pool = await getPool();
  await pool.query(
    "INSERT INTO purchases (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [userId, productId, quantity]
  );
}

export async function getAllPurchases() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT p.*, u.login as user_login, pr.name as product_name, pr.price as product_price
     FROM purchases p
     JOIN users u ON p.user_id = u.id
     JOIN products pr ON p.product_id = pr.id
     ORDER BY p.purchased_at DESC`
  );
  return rows;
}
