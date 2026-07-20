import { Router } from "express";
import {
  CreatedThread,
  deleteThreadById,
  findAuthorId,
  listCategories,
  listThreads,
  parseThreadListFilter,
} from "../modules/threads/threads.repository.js";
import { getAuth } from "../config/clerk.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";
import z from "zod";
import { getUserFromClerk } from "../modules/users/user.service.js";
import {
  creatReply,
  deleteReplyById,
  findReplyAuthor,
  getThreadDetailsWithCount,
  likeThreadOnce,
  listRepliesForThread,
  removeThreadOnce,
} from "../modules/threads/replies.repository.js";
import {
  createCommentNotification,
  createLikeNotification,
} from "../modules/notifications/notifications.service.js";
import globalRateLimit from "../middleware/rateLimiter.js";

export const threadsRouters = Router();

const CreatedThreadsSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(5).max(2000),
  categorySlug: z.string().trim().min(1),
});

threadsRouters.get("/categories", async (_req, res, next) => {
  try {
    const extractListOfcategories = await listCategories();
    res.json({ data: extractListOfcategories });
  } catch (error) {
    next(error);
  }
});

threadsRouters.post(
  "/threads",
  globalRateLimit(20, 15 * 60 * 1000),
  async (req, res, next) => {
    try {
      const auth = getAuth(req);
      if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const paredBody = CreatedThreadsSchema.parse(req.body);

      const profile = await getUserFromClerk(auth.userId);

      const thread = await CreatedThread({
        categorySlug: paredBody.categorySlug,
        authUserId: profile.user.id,
        title: paredBody.title,
        body: paredBody.body,
      });

      res.status(200).json({ data: thread });
    } catch (error) {
      next(error);
    }
  },
);

threadsRouters.get("/threads/:threadId", async (req, res, next) => {
  try {
    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId)) {
      throw new BadRequestError("Invalid thread id");
    }

    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);
    const viewerId = profile.user.id;

    const thread = await getThreadDetailsWithCount({
      threadId,
      viewerId,
    });

    res.json({ data: thread });
  } catch (error) {
    next(error);
  }
});

threadsRouters.get("/threads", async (req, res, next) => {
  try {
    const filter = parseThreadListFilter({
      page: req.query.page,
      pageSize: req.query.pageSize,
      category: req.query.category,
      q: req.query.q,
      sort: req.query.sort,
    });

    const extractListofThreads = await listThreads(filter);

    res.json({ data: extractListofThreads });
  } catch (error) {
    next(error);
  }
});

threadsRouters.delete("/threads/:threadId", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const threadId = Number(req.params.threadId);

    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);
    const authorId = await findAuthorId(threadId);

    if (authorId !== profile.user.id) {
      throw new UnauthorizedError("YOu can not delete some one else Threads");
    }

    await deleteThreadById(threadId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

//replies and like end point

threadsRouters.get("/threads/:threadId/replies", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }
    const threadId = Number(req.params.threadId);

    const replies = await listRepliesForThread(threadId);

    res.json({ data: replies });
  } catch (error) {
    next(error);
  }
});

threadsRouters.post(
  "/threads/:threadId/replies",
  globalRateLimit(20, 15 * 60 * 1000),
  async (req, res, next) => {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const threadId = Number(req.params.threadId);
      if (!Number.isInteger(threadId) || threadId <= 0) {
        throw new BadRequestError("Invalid thread Id");
      }

      const bodyRaw = typeof req.body?.body === "string" ? req.body.body : "";
      if (bodyRaw.trim().length <= 2) {
        throw new BadRequestError("Reply is too short!");
      }

      const profile = await getUserFromClerk(auth.userId);

      const reply = await creatReply({
        threadId,
        authorUserId: profile.user.id,
        body: bodyRaw,
      });

      //nofication trigger here
      await createCommentNotification({
        threadId,
        actorUserId: profile.user.id,
      });

      res.status(201).json({
        data: reply,
      });
    } catch (error) {
      next(error);
    }
  },
);

threadsRouters.delete("/replies/:replyId", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const replyId = Number(req.params.replyId);

    if (!Number.isInteger(replyId) || replyId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);
    const authorUserId = await findReplyAuthor(replyId);

    if (authorUserId !== profile.user.id) {
      throw new UnauthorizedError("YOu can not delete some one else replies");
    }

    await deleteReplyById(replyId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

threadsRouters.post(
  "/threads/:threadId/like",
  globalRateLimit(20, 15 * 60 * 1000),
  async (req, res, next) => {
    try {
      const auth = getAuth(req);

      if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
      }
      const threadId = Number(req.params.threadId);
      if (!Number.isInteger(threadId) || threadId <= 0) {
        throw new BadRequestError("Invalid thread Id");
      }

      const profile = await getUserFromClerk(auth.userId);

      await likeThreadOnce({
        threadId,
        userId: profile.user.id,
      });

      //notification will be added here

      await createLikeNotification({
        threadId,
        actorUserId: profile.user.id,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

threadsRouters.delete("/threads/:threadId/like", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }
    const threadId = Number(req.params.threadId);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequestError("Invalid thread Id");
    }

    const profile = await getUserFromClerk(auth.userId);

    await removeThreadOnce({
      threadId,
      userId: profile.user.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
