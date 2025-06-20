// server/create-admin.js
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { dbConfig } from "./modules/config.js";

// --- НАСТРОЙКИ АДМИНИСТРАТОРА ---
const ADMIN_LOGIN = "admin";
const ADMIN_EMAIL = "natalyapoznyak@gmail.com";
const ADMIN_PASSWORD = "12345678"; // Обязательно смените пароль после первого входа
// ------------------------------------

async function createAdmin() {
  let connection;
  try {
    console.log("Connecting to the database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Connection successful.");

    // 1. Check if admin user already exists
    console.log(
      `Checking for existing user with login '${ADMIN_LOGIN}' or email '${ADMIN_EMAIL}'...`
    );
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE login = ? OR user_email = ?",
      [ADMIN_LOGIN, ADMIN_EMAIL]
    );

    if (rows.length > 0) {
      console.log(
        "! An admin user with this login or email already exists. Aborting."
      );
      return;
    }
    console.log("✓ No existing admin found. Proceeding with creation.");

    // 2. Hash the password
    console.log("Hashing the password...");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    console.log("✓ Password hashed.");

    // 3. Insert the new admin user
    console.log("Inserting new admin user into the database...");
    await connection.execute(
      "INSERT INTO users (login, user_email, password_hash, is_active, role) VALUES (?, ?, ?, ?, ?)",
      [ADMIN_LOGIN, ADMIN_EMAIL, passwordHash, 1, "admin"]
    );

    console.log("\n========================================");
    console.log("🎉 Admin user created successfully! 🎉");
    console.log("========================================");
    console.log(`Login: ${ADMIN_LOGIN}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(
      "Please log in and change your password if a feature for it exists."
    );
    console.log("You can now delete this script for security reasons.");
  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed.");
    }
  }
}

createAdmin();
