import { compileString } from "sass";
import fs from "fs";
import path from "path";
import { CLIENT_DIR } from "./config.js";

export function sassMiddleware(req, res, next) {
  // Проверяем, запрашивается ли SCSS файл
  if (req.url.endsWith(".scss")) {
    const scssPath = path.join(CLIENT_DIR, req.url);

    try {
      // Проверяем, существует ли файл
      if (!fs.existsSync(scssPath)) {
        return next();
      }

      // Читаем SCSS файл
      const scssContent = fs.readFileSync(scssPath, "utf8");

      // Компилируем SCSS в CSS
      const result = compileString(scssContent, {
        loadPaths: [path.dirname(scssPath)],
        style: "expanded",
      });

      // Отправляем CSS с правильным Content-Type
      res.setHeader("Content-Type", "text/css");
      res.send(result.css);
    } catch (error) {
      console.error("SCSS compilation error:", error);
      res.status(500).send(`/* SCSS compilation error: ${error.message} */`);
    }
  } else {
    next();
  }
}
