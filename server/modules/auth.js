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

// Регулярные выражения для валидации
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const USERNAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9_-]{3,20}$/;
const PASSWORD_REGEX = /^\d{8}$/;

// Проверка email
function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email)) {
    return "Некорректный формат email";
  }
  return null;
}

// Проверка пароля
function validatePassword(password) {
  if (!password || !PASSWORD_REGEX.test(password)) {
    return "Пароль должен состоять ровно из 8 цифр (0-9)";
  }
  return null;
}

// Проверка логина
function validateUsername(username) {
  if (!username || !USERNAME_REGEX.test(username)) {
    return "Логин должен быть от 3 до 20 символов и содержать только буквы, цифры, подчёркивание или дефис";
  }
  return null;
}

// Отправка письма для активации аккаунта
async function sendActivationEmail(email, data) {
  try {
    await transporter.verify();

    // Получаем путь к директории текущего файла
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Формируем путь к шаблону письма
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

// Проверка авторизации пользователя
export async function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(401).json({ error: "Неавторизован" });
  }
  res.redirect("/");
}

// Регистрация пользователя
export async function register(req, res) {
  try {
    const { login, email, password } = req.body;

    // Проверка наличия всех полей
    if (!login || !email || !password) {
      return res
        .status(400)
        .json({ message: "Все поля обязательны для заполнения." });
    }

    // Проверка логина
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(login)) {
      return res.status(400).json({
        message:
          "Логин должен быть от 3 до 20 символов и может содержать буквы, цифры, подчёркивания или дефисы",
      });
    }

    // Проверка email
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)) {
      return res.status(400).json({ message: "Некорректный формат email" });
    }

    // Проверка пароля
    if (!/^\d{8}$/.test(password)) {
      return res
        .status(400)
        .json({ message: "Пароль должен состоять ровно из 8 цифр" });
    }

    // Проверка существования логина
    const existingLogin = await findUserByLogin(login);
    if (existingLogin) {
      return res.status(400).json({ message: "Этот логин уже занят" });
    }

    // Проверка существования email
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "Этот email уже зарегистрирован" });
    }

    // Генерация токена активации
    const activationToken = crypto.randomBytes(32).toString("hex");

    // Создание пользователя с токеном активации (временно хранится в password_hash)
    await createUser(login, email, activationToken);

    // Генерация ссылки для активации с хэшем пароля
    const passwordHash = await bcrypt.hash(password, 10);
    const activationLink = `http://localhost:5173/api/users/activate?token=${activationToken}&password=${passwordHash}`;

    // Отправка письма для активации
    await sendActivationEmail(email, { activationLink });

    return res.status(200).json({
      success: true,
      message:
        "Регистрация прошла успешно! Проверьте вашу почту для активации аккаунта.",
    });
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(500).json({ message: "Ошибка сервера при регистрации." });
  }
}

// Активация пользователя по ссылке из письма
export async function activate(req, res) {
  try {
    const { token, password } = req.query;
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Отсутствует токен активации или пароль.",
      });
    }

    const user = await findUserByActivationToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Некорректный токен активации.",
      });
    }

    // Активация пользователя и установка пароля
    await activateUserAndSetPassword(user.user_email, password);

    // Редирект на главную страницу с сообщением об успешной активации
    return res.redirect(`/?activated=true`);
  } catch (err) {
    console.error("Ошибка активации:", err);
    return res.status(500).json({
      success: false,
      message: "Ошибка сервера при активации.",
    });
  }
}

// Вход пользователя
export async function login(req, res) {
  try {
    const { loginOrEmail, password } = req.body;
    if (!loginOrEmail || !password) {
      return res
        .status(400)
        .json({ message: "Все поля обязательны для заполнения." });
    }

    const user = await findUserByLoginOrEmail(loginOrEmail);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Неверный логин/email или пароль." });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res
        .status(400)
        .json({ message: "Неверный логин/email или пароль." });
    }

    if (!user.is_active) {
      return res.status(400).json({
        message:
          "Аккаунт не активирован. Проверьте вашу почту и перейдите по ссылке для активации.",
      });
    }

    // Установка сессии
    req.session.user_id = user.id;
    req.session.user_login = user.login;
    req.session.user_role = user.role;

    res.status(200).json({
      success: true,
      message: "Вход выполнен успешно",
      user: {
        login: user.login,
        email: user.user_email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Ошибка при входе:", err);
    res.status(500).json({ message: "Ошибка сервера при попытке входа." });
  }
}

// Выход пользователя
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Ошибка при уничтожении сессии:", err);
    res.redirect("/");
  });
}

// Получение информации о текущем пользователе
export function whoami(req, res) {
  res.json({
    login: req.user.login,
    email: req.user.user_email,
    role: req.user.role,
  });
}
