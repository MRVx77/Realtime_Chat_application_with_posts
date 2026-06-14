import { query } from "../../db/db.js";
import { User, UserRow } from "./user.types.js";

function hydrateUser(row: UserRow): User {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    handle: row.handle,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
}): Promise<User> {
  const { clerkUserId, displayName, avatarUrl } = params;

  const result = await query<UserRow>(
    `
        insert into users (clerk_user_id, display_name, avatar_url)
        values ($1,$2,$3)
        on conflict (clerk_user_id)
        do update set
            updated_at = NOW()

        returning
            id,
            clerk_user_id,
            display_name,
            handle,
            avatar_url,
            bio,
            created_at,
            updated_at
        
        `,
    [clerkUserId, displayName, avatarUrl],
  );

  return hydrateUser(result.rows[0]);
}

export async function repoUpdateUserProfile(params: {
  clerkUserId: string;
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<User> {
  const { clerkUserId, displayName, handle, bio, avatarUrl } = params;

  const setClauses: string[] = [];
  const values: unknown[] = [clerkUserId]; // $1 will be clerk whcih alway use for where
  let idx = 2; //$2 ,$3

  //push a column = $index -> string -> push into setClaues
  //push the actual values into this values arrary

  if (typeof displayName !== undefined) {
    setClauses.push(`display_name = $${idx++}`); // display_name = $2
    values.push(displayName);
  }

  if (typeof handle !== undefined) {
    setClauses.push(`handle = $${idx++}`); // handle = $3
    values.push(handle);
  }

  if (typeof bio !== undefined) {
    setClauses.push(`bio = $${idx++}`); // bio = $4
    values.push(bio);
  }

  if (typeof avatarUrl !== undefined) {
    setClauses.push(`avatar_url = $${idx++}`); // haavatar_urlndle = $5
    values.push(avatarUrl);
  }

  setClauses.push(`updated_at = NOW()`);

  const result = await query<UserRow>(
    `
    update users
    set ${setClauses.join(", ")}
    where clerk_user_id = $1
    returning
      id,
      clerk_user_id,
      display_name,
      handle,
      avatar_url,
      bio,
      created_at,
      updated_at
    `,
    values,
  );

  if (result.rows.length === 0) {
    throw new Error(`no user found for clerk user id ${clerkUserId}`);
  }

  return hydrateUser(result.rows[0]);
}
