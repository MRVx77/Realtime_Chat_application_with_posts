import { clerkClient } from "../../config/clerk.js";
import {
  repoUpdateUserProfile,
  upsertUserFromClerkProfile,
} from "./user.repository.js";
import { UserProfile } from "./user.types.js";

export async function fetchClerkProfile(clerkUserId: string) {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  const getFullName =
    (clerkUser.firstName || "") +
    (clerkUser.lastName ? ` ${clerkUser.lastName}` : "");

  const fullName = getFullName.trim().length > 0 ? getFullName : null;

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];

  const email = primaryEmail?.emailAddress ?? null;

  const avatarUrl = clerkUser?.imageUrl || null;

  return { fullName, email, avatarUrl };
}

export async function getUserFromClerk(
  clerkUserId: string,
): Promise<UserProfile> {
  const { fullName, email, avatarUrl } = await fetchClerkProfile(clerkUserId);

  const user = await upsertUserFromClerkProfile({
    clerkUserId,
    displayName: fullName,
    avatarUrl,
  });

  return {
    user,
    clerkEmail: email,
    clerkFullName: fullName,
  };
}

export async function updateUserprofile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const { clerkUserId, displayName, handle, bio, avatarUrl } = params;

  const updateUser = await repoUpdateUserProfile({
    clerkUserId,
    displayName,
    handle,
    bio,
    avatarUrl,
  });

  const { fullName, email } = await fetchClerkProfile(clerkUserId);

  return {
    user: updateUser,
    clerkEmail: email,
    clerkFullName: fullName,
  };
}
