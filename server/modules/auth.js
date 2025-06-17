import bcrypt from "bcrypt";
import crypto from "crypto";
import path from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs/promises";
import { fileURLToPath } from "url";

import { findUserByEmail, createUser, findActiveUserByEmail } from "./db.js";
import { CLIENT_DIR, emailConfig } from "./config.js";
import {
  storePendingUser,
  getPendingUser,
  removePendingUser,
  isPendingEmail,
} from "./tempStorage.js";

const transporter = nodemailer.createTransport(emailConfig);

async function sendActivationEmail(email, activationLink) {
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
    const html = compiledTemplate({ activationLink });

    await transporter.sendMail({
      from: emailConfig.auth.user,
      to: email,
      subject: "Account Activation - FileStorage",
      html: html,
    });

    console.log(`✓ Письмо успешно отправлено на ${email}`);
  } catch (error) {
    console.error("Ошибка при отправке активационного письма:", error);
    throw error;
  }
}

export async function requireAuth(req, res, next) {
  if (req.session?.user_email) {
    try {
      const user = await findActiveUserByEmail(req.session.user_email);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (e) {
      console.error("Ошибка при проверке сессии в БД:", e);
    }
  }
  if (!req.session) {
    return res.status(500).json({ error: "Session is not initialized" });
  }
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(401).json({ error: "Неавторизован" });
  }
  res.redirect("/");
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hash = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString("hex");

    storePendingUser(activationToken, {
      username,
      email,
      password_hash: hash,
    });

    const activationLink = `http://${req.headers.host}/api/activate?token=${activationToken}`;

    await sendActivationEmail(email, activationLink);

    return res.status(200).json({
      message:
        "Registration successful. Please check your email for activation.",
    });
  } catch (err) {
    console.error("Ошибка при регистрации:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
}

export async function activate(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send("Токен активации не указан.");
  }

  const pending = getPendingUser(token);
  if (!pending) {
    return res.status(400).send("Неверный или устаревший токен активации.");
  }

  createUser(pending.email, pending.password_hash, pending.username)
    .then(() => {
      removePendingUser(token);
      res.redirect("/");
    })
    .catch((err) => {
      console.error("Ошибка при активации:", err);
      res.status(500).send("Ошибка на сервере при активации аккаунта.");
    });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Если регистрация не подтверждена
    if (isPendingEmail(email)) {
      return res.status(400).json({
        message:
          "Please confirm your registration! Check your email and follow the link.",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.is_active) {
      return res
        .status(400)
        .json({ message: "Account not activated. Please check your email." });
    }

    req.session.user_email = email;

    res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username || user.user_email,
        email: user.user_email,
      },
      token: req.sessionID,
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
  res.json({ username: req.user.user_email });
}
