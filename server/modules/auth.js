import bcrypt from "bcrypt";
import crypto from "crypto";
import path from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs/promises";
import { fileURLToPath } from "url";

import {
  findUserByEmail,
  createUser,
  findUserByLogin,
  findUserByLoginOrEmail,
  findActiveUserByLoginOrEmail,
  createUserWithToken,
  findUserByActivationToken,
  activateUserAndSetPassword,
} from "./db.js";
import { CLIENT_DIR, emailConfig } from "./config.js";
import {
  storePendingUser,
  getPendingUser,
  removePendingUser,
  isPendingEmail,
} from "./tempStorage.js";

const transporter = nodemailer.createTransport(emailConfig);

// Validation functions
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const USERNAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9_-]{3,20}$/;
const PASSWORD_REGEX = /^\d{8}$/;

function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email)) {
    return "Invalid email format";
  }
  return null;
}

function validatePassword(password) {
  if (!password || !PASSWORD_REGEX.test(password)) {
    return "Password must be exactly 8 digits (0-9)";
  }
  return null;
}

function validateUsername(username) {
  if (!username || !USERNAME_REGEX.test(username)) {
    return "Username must be 3-20 characters long and contain only letters, numbers, underscore or hyphen";
  }
  return null;
}

async function sendActivationEmail(email, data) {
  try {
    await transporter.verify();

    // Get the current file's directory path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Construct the template path relative to the current file
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "activation-email.hbs"
    );

    const template = await fs.readFile(templatePath, "utf8");
    const compiledTemplate = Handlebars.compile(template);
    const html = compiledTemplate(data);

    await transporter.sendMail({
      from: emailConfig.auth.user,
      to: email,
      subject: "Активация аккаунта - Jewelry Shop",
      html: html,
    });

    console.log(`✓ Письмо успешно отправлено на ${email}`);
  } catch (error) {
    console.error("Ошибка при отправке активационного письма:", error);
    throw error;
  }
}

export async function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(401).json({ error: "Неавторизован" });
  }
  res.redirect("/");
}

export async function register(req, res) {
  try {
    const { login, email, password } = req.body;

    // Validation
    if (!login || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate login
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(login)) {
      return res.status(400).json({
        message:
          "Login must be 3-20 characters and may contain letters, numbers, underscores or hyphens",
      });
    }

    // Validate email
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password
    if (!/^\d{8}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Password must be exactly 8 digits" });
    }

    // Check if login exists
    const existingLogin = await findUserByLogin(login);
    if (existingLogin) {
      return res.status(400).json({ message: "This login is already taken" });
    }

    // Check if email exists
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "This email is already registered" });
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Create user with activation token (temporarily stored in password_hash)
    await createUser(login, email, activationToken);

    // Generate activation link with password hash
    const passwordHash = await bcrypt.hash(password, 10);
    const activationLink = `http://localhost:5173/api/users/activate?token=${activationToken}&password=${passwordHash}`;

    // Send activation email
    await sendActivationEmail(email, { activationLink });

    return res.status(200).json({
      success: true,
      message:
        "Registration successful! Please check your email to activate your account.",
    });
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(500).json({ message: "Ошибка сервера при регистрации." });
  }
}

export async function activate(req, res) {
  try {
    const { token, password } = req.query;
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Activation token or password is missing.",
      });
    }

    const user = await findUserByActivationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid activation token.",
      });
    }

    // Activate user and set password
    await activateUserAndSetPassword(user.user_email, password);

    // Redirect to home with success message to show login modal
    return res.redirect(`/?activated=true`);
  } catch (err) {
    console.error("Ошибка активации:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during activation.",
    });
  }
}

export async function login(req, res) {
  try {
    const { loginOrEmail, password } = req.body;
    if (!loginOrEmail || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await findUserByLoginOrEmail(loginOrEmail);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid login/email or password." });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res
        .status(400)
        .json({ message: "Invalid login/email or password." });
    }

    if (!user.is_active) {
      return res.status(400).json({
        message:
          "Account is not activated. Please check your email and follow the activation link.",
      });
    }

    // Set session
    req.session.user_id = user.id;
    req.session.user_login = user.login;
    req.session.user_role = user.role;

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        login: user.login,
        email: user.user_email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Ошибка при входе:", err);
    res.status(500).json({ message: "Server error during login attempt." });
  }
}

export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Ошибка при уничтожении сессии:", err);
    res.redirect("/");
  });
}

export function whoami(req, res) {
  res.json({
    login: req.user.login,
    email: req.user.user_email,
    role: req.user.role,
  });
}
