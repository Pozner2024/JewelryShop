import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

let pool;

export async function initDbPool() {
  try {
    pool = await mysql.createPool(dbConfig);
    await pool.query("SELECT 1");
    console.log("✓ База данных успешно инициализирована");
  } catch (err) {
    console.error("Ошибка при инициализации базы данных:", err);
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

export async function createUser(login, email, activationToken) {
  const pool = await getPool();
  // Временно сохраняем activationToken в поле password_hash
  await pool.query(
    "INSERT INTO users (login, user_email, password_hash, is_active, role) VALUES (?, ?, ?, ?, ?)",
    [login, email, activationToken, 0, "user"] // Добавляем все необходимые параметры
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
