import { Router } from "express";
import {
  CreatedThread,
  getThreadById,
  listCategories,
  listThreads,
  parseThreadListFilter,
} from "../modules/threads/threads.repository.js";
import { getAuth } from "../config/clerk.js";
import { BadRequestError, UnauthorizedError } from "../lib/errors.js";
import z from "zod";
import { getUserFromClerk } from "../modules/users/user.service.js";

export const threadsRouters = Router();

const CreatedThreadsSchema = z.object({
  title: z.string().trim().min(5).max(5),
  body: z.string().trim().min(5).max(2000),
  categorySlug: z.string().trim().min(5),
});

threadsRouters.get("/categories", async (_req, res, next) => {
  try {
    const extractListOfcategories = await listCategories();
    res.json({ data: extractListOfcategories });
  } catch (error) {
    next(error);
  }
});

threadsRouters.post("/threads", async (req, res, next) => {
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
});

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

    // const profile = await getUserFromClerk(auth.userId)
    // const viewerUserId = profile.user.id;

    const thread = await getThreadById(threadId);

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
