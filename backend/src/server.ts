import { creatApp } from "./app.js";
import { env } from "./config/env.js";
import { assertDatabseConnection } from "./db/db.js";
import { logger } from "./lib/logger.js";
import http from "node:http";

async function boostrap() {
  try {
    await assertDatabseConnection();
    const app = creatApp();

    const server = http.createServer(app);

    const port = Number(env.PORT) || 5000;

    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error(`Failed to start the server: ${(error as Error).message}`);
  }
}

boostrap();
