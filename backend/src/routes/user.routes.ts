import { Router } from "express";
import z from "zod";
import {
  toUserProfileResponse,
  UserProfile,
  UserProfileResponse,
} from "../modules/users/user.types.js";
import { getAuth } from "../config/clerk.js";
import { UnauthorizedError } from "../lib/errors.js";
import {
  getUserFromClerk,
  updateUserprofile,
} from "../modules/users/user.service.js";

export const userRouter = Router();

//user upadte schema
const userProfileUpdateSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  handle: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url("Avatar must be vaild url").optional(),
});

function toResponse(profile: UserProfile): UserProfileResponse {
  return toUserProfileResponse(profile);
}

// get-> /api/me

userRouter.get("/", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await getUserFromClerk(auth.userId);
    const response = toResponse(profile);

    res.json({ data: response });
  } catch (error) {
    next(error);
  }
});

//patch-> /api/me for updating user info

userRouter.patch("/", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const parseBody = userProfileUpdateSchema.parse(req.body);

    const displayName =
      parseBody.displayName && parseBody.displayName.trim().length > 0
        ? parseBody.displayName.trim()
        : undefined;

    const handle =
      parseBody.handle && parseBody.handle.trim().length > 0
        ? parseBody.handle.trim()
        : undefined;

    const bio =
      parseBody.bio && parseBody.bio.trim().length > 0
        ? parseBody.bio.trim()
        : undefined;

    const avatarUrl =
      parseBody.avatarUrl && parseBody.avatarUrl.trim().length > 0
        ? parseBody.avatarUrl.trim()
        : undefined;

    try {
      const profile = await updateUserprofile({
        clerkUserId: auth.userId,
        displayName,
        handle,
        bio,
        avatarUrl,
      });

      const response = toResponse(profile);

      res.json({ data: response });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    next(error);
  }
});
