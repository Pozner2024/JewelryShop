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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
  await pool.query(createTableSql);
  console.log("✓ 'products' table is ready.");

  // Add mock data if table is empty
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM products");
  if (rows[0].count === 0) {
    const insertSql = `
            INSERT INTO products (name, price, old_price, image_url, brand, article, description) VALUES
            ('Gold Ring with Diamond', 89990.00, 99990.00, '/images/placeholder.svg', 'Elegant', 'Art. 12345', 'A beautiful gold ring with a sparkling diamond.'),
            ('Silver Earrings with Pearls', 15490.00, NULL, '/images/placeholder.svg', 'Classic', 'Art. 12346', 'Classic silver earrings adorned with freshwater pearls.'),
            ('Platinum Necklace with Sapphires', 125000.00, NULL, '/images/placeholder.svg', 'Premium', 'Art. 12347', 'An exquisite platinum necklace featuring deep blue sapphires.'),
            ('Ruby Bracelet', 75000.00, 82000.00, '/images/placeholder.svg', 'Luxury', 'Art. 12348', 'A stunning bracelet set with vibrant red rubies.');
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

export async function initDbPool() {
  try {
    pool = await mysql.createPool(dbConfig);
    await pool.query("SELECT 1");
    await createProductsTable(); // Create products table first
    await createLikesTable();
    await createCartTable();
    console.log("✓ Database connection successful.");
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
  return pool;
}

export async function getPool() {
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
