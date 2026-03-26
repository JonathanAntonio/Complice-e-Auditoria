import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { createApp } from "./app";

const port = parseInt(process.env.API_DOCS_PORT ?? "3003", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("API_DOCS_PORT must be a valid port (1-65535)");
  process.exit(1);
}
const app = createApp();

app.listen(port, () => {
  console.log(`API Docs (unified Swagger) at http://localhost:${port}`);
});
