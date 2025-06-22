import * as sass from "sass";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");

export const sassMiddleware = (req, res, next) => {
  if (req.path.endsWith(".scss")) {
    const scssPath = path.join(clientDir, req.path);
    try {
      const result = sass.compile(scssPath, {
        style: "expanded",
        loadPaths: [path.join(clientDir, "styles")],
      });
      res.setHeader("Content-Type", "text/css");
      res.send(result.css);
    } catch (error) {
      console.error("SASS Compilation Error:", error);
      res.status(500).send(`SASS Error: ${error.message}`);
    }
  } else {
    next();
  }
};
