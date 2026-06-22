import { query } from "../../db/db.js";
import { mapNotificationsRow, NotificationRow } from "./notifications.types.js";

export async function createCommentNotification(params: {
  threadId: number;
  actorUserId: number;
}) {
  const { threadId, actorUserId } = params;

  const threadRes = await query(
    `
    select author_user_id
    from threads
    where id = $1;
    limit 1

    `,
    [threadId],
  );

  const row = threadRes.rows[0] as { author_user_id: number } | undefined;
  if (!row) {
    return;
  }

  const authorUserId = row.author_user_id;
  if (authorUserId === actorUserId) return;

  const insertRes = await query(
    `
    insert into notifications (user_id, actor_user_id, thread_id, type)
    values ($1,$2,$3, 'reply_on_thread')
    returning id, created_at
    `,
    [authorUserId, actorUserId, threadId],
  );

  const notiRow = insertRes.rows[0] as { id: number };

  const fullRes = await query(
    `
  select
      n.id,
      n.type,
      n.thread_id,
      n.created_at,
      n.read_at,
      actor.display_name as actor_display_name,
      actor.handle as actor_handle,
      t.title as thread_title
        from notifications n
        join users actor
            on actor.id = n.actor_user_id
        join threads t
            on t.id = n.thread_id
        where n.id = $1
        limit 1
  `,
    [notiRow.id],
  );

  const fullRow = fullRes.rows[0] as NotificationRow | undefined;
  if (!fullRow) {
    return;
  }
  const payload = mapNotificationsRow(fullRow);

  //emit socket event
  //notification:new
}

export async function createLikeNotification(params: {
  threadId: number;
  actorUserId: number;
}) {
  const { threadId, actorUserId } = params;

  const threadRes = await query(
    `
    select author_user_id
    from threads
    where id = $1;
    limit 1

    `,
    [threadId],
  );

  const row = threadRes.rows[0] as { author_user_id: number } | undefined;
  if (!row) {
    return;
  }

  const authorUserId = row.author_user_id;
  if (authorUserId === actorUserId) return;

  const insertRes = await query(
    `
    insert into notifications (user_id, actor_user_id, thread_id, type)
    values ($1,$2,$3, 'like_on_thread')
    returning id, created_at
    `,
    [authorUserId, actorUserId, threadId],
  );

  const notiRow = insertRes.rows[0] as { id: number };

  const fullRes = await query(
    `
  select
      n.id,
      n.type,
      n.thread_id,
      n.created_at,
      n.read_at,
      actor.display_name as actor_display_name,
      actor.handle as actor_handle,
      t.title as thread_title
        from notifications n
        join users actor
            on actor.id = n.actor_user_id
        join threads t
            on t.id = n.thread_id
        where n.id = $1
        limit 1
  `,
    [notiRow.id],
  );

  const fullRow = fullRes.rows[0] as NotificationRow | undefined;
  if (!fullRow) {
    return;
  }
  const payload = mapNotificationsRow(fullRow);

  //emit socket event
  //notification:new
}

export async function listNotificationForUser(params: {
  userId: number;
  unreadOnly: boolean;
}) {
  const { userId, unreadOnly } = params;

  const conditions = ["n.user_id = $1"];
  const values: unknown[] = [userId];

  if (unreadOnly) {
    conditions.push("n.read_at is null");
  }

  const whererClause = `where ${conditions.join(" and ")}`;
  const result = await query(
    `
        select
        n.id,
        n.type,
        n.thread_id,
        n.created_at,
        n.read_at,
        actor.display_name as actor_display_name,
        actor.handle as actor_handle,
        t.title as thread_title
        from notifications n
        join users actor
            on actor.id = n.actor_user_id
        join threads t
            on t.id = n.thread_id
        ${whererClause}
        order by n.created_at desc
        `,
    values,
  );

  return result.rows.map((noti) =>
    mapNotificationsRow(noti as NotificationRow),
  );
}

export async function markNotifiactionRead(params: {
  userId: number;
  notificationId: number;
}) {
  const { userId, notificationId } = params;

  await query(
    `
        update notifications
        set read_at = coalesce(read_at, now())
        where id = $1 and user_id = $2
        `,
    [notificationId, userId],
  );
}

//homeweork create a function to handle mark all read at once

export async function markNotificationReadAll(params: { userId: number }) {
  const { userId } = params;

  await query(
    `
        update notifications
        set read_at = now()
        where user_id  = $1 and read_at is null
        `,
    [userId],
  );
}
