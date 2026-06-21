import { query } from "../../db/db.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { getThreadById } from "./threads.repository.js";

export async function listRepliesForThread(threadId: number) {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new BadRequestError("Invalid thread Id");
  }

  const result = await query(
    `
    select
      r.id,
      r.body,
      r.created_at,
      u.display_name as author_display_name,
      u.handle as author_handle
    from replies r
    join users u on u.id = r.author_user_id
    where r.thread_id = $1
    order by r.created_at asc
  `,
    [threadId],
  );

  return result.rows.map((row) => ({
    id: row.id as number,
    body: row.body as string,
    createdAt: row.created_at as Date,
    author: {
      displayName: (row.author_display_name as string) ?? null,
      handle: (row.author_handle as string) ?? null,
    },
  }));
}

export async function creatReply(params: {
  threadId: number;
  authorUserId: number;
  body: string;
}) {
  const { body, threadId, authorUserId } = params;

  const result = await query(
    `
        insert into replies (thread_id, author_user_id, body)
        values ($1,$2,$3)
        returning id, created_at
        `,
    [threadId, authorUserId, body],
  );

  const row = result.rows[0];

  const fullRes = query(
    `select
      r.id,
      r.body,
      r.created_at,
      u.display_name as author_display_name,
      u.handle as author_handle 
        from replies r
        join users u on u.id = r.author_user_id
        where r.id = $1
        limit 1
        `,
    [row.id],
  );

  const replyRow = (await fullRes).rows[0];

  return {
    id: replyRow.id as number,
    body: replyRow.body as string,
    createdAt: replyRow.created_at as Date,
    author: {
      displayName: (replyRow.author_display_name as string) ?? null,
      handle: (replyRow.author_handle as string) ?? null,
    },
  };
}

export async function findReplyAuthor(replyId: number) {
  const result = await query(
    `
            select author_user_id
            from replies
            where id = $1
            limit 1
            `,
    [replyId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("Reply not found!!!");
  }

  return row.author_user_id as number;
}

export async function deleteReplyById(replyId: number) {
  await query(
    `
        delete from replies
        where id = $1
        `,
    [replyId],
  );
}

export async function likeThreadOnce(params: {
  threadId: number;
  userId: number;
}) {
  const { threadId, userId } = params;
  await query(
    `
    insert into thread_reactions(thread_id, user_id)
    values ($1,$2)
    on conflict (thread_id, user_id) do nothing
    `,
    [threadId, userId],
  );
}

export async function removeThreadOnce(params: {
  threadId: number;
  userId: number;
}) {
  const { threadId, userId } = params;
  await query(
    `
    delete from thread_reactions
    where thread_id = $1 and user_id = $2
    `,
    [threadId, userId],
  );
}

export async function getThreadDetailsWithCount(params: {
  threadId: number;
  viewerId: number | null;
}) {
  const { threadId, viewerId } = params;

  const thread = await getThreadById(threadId);

  const likeResult = await query(
    `
    select count(*):: int as count
    from thread_reactions
    where thread_id = $1
    `,
    [threadId],
  );

  const likeCount = (likeResult.rows[0]?.count as number | undefined) ?? 0;
  const replyResult = await query(
    `
    select count(*):: int as count
    from replies
    where thread_id = $1
    `,
    [threadId],
  );
  const replyCount = (replyResult.rows[0]?.count as number | undefined) ?? 0;

  let viewerLikePost = false;

  if (viewerId) {
    const viewrResult = await query(
      `
      select 1
      from thread_reactions
      where thread_id = $1 and user_id = $2
      limit 1
      `,
      [threadId, viewerId],
    );

    const count = viewrResult.rowCount ?? 0;
    if (count > 0) {
      viewerLikePost = true;
    }
  }

  return {
    ...thread,
    likeCount,
    replyCount,
    viewerLikePost,
  };
}
