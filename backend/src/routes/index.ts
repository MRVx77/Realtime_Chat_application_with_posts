import { Router } from "express";
import { userRouter } from "./user.routes.js";
import { threadsRouters } from "./threads.routes.js";
import { notifiactionRouter } from "./notification.routes.js";

export const apiRouter = Router();

apiRouter.use("/me", userRouter);

apiRouter.use("/threads", threadsRouters);

apiRouter.use("/notifications", notifiactionRouter);
