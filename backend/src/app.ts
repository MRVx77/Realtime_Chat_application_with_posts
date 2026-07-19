import express from "express";
import cors from "cors";
import helmet from "helmet";
import { nothFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "./config/clerk.js";
import { apiRouter } from "./routes/index.js";
import globalRateLimit from "./middleware/rateLimiter.js";

export function creatApp() {
  const app = express();

  app.use(clerkMiddleware());
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/api", globalRateLimit(100, 15 * 60 * 1000));
  app.use("/api", apiRouter);

  app.use(nothFoundHandler);
  app.use(errorHandler);
  return app;
}
