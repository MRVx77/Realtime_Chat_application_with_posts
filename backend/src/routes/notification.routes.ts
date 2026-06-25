import { Router } from "express";
import { getAuth } from "../config/clerk.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  listNotificationForUser,
  markNotifiactionRead,
  markNotificationReadAll,
} from "../modules/notifications/notifications.service.js";

export const notifiactionRouter = Router();

//get unreadonly boolean
notifiactionRouter.get("/", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("LogIn for perform this action");
    }
    const profile = await getUserFromClerk(auth.userId);

    const isUnreadOnly = req.query.unreadOnly === "true";
    const notifications = await listNotificationForUser({
      userId: profile.user.id,
      unreadOnly: isUnreadOnly,
    });
    res.json({ data: notifications });
  } catch (error) {
    next(error);
  }
});

//post /api/notification/read-all

notifiactionRouter.post("/read-all", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("LogIn for perform this action");
    }
    const profile = await getUserFromClerk(auth.userId);

    await markNotificationReadAll({
      userId: profile.user.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

//read specific notification :id
notifiactionRouter.post("/:id/read", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("LogIn for perform this action");
    }
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      throw new BadRequestError("Invaild notification id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await markNotifiactionRead({
      userId: profile.user.id,
      notificationId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
