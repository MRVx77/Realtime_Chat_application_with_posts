import { query } from "../../db/db.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import {
  Category,
  CategoryRow,
  mapCategoryRow,
  mapThreadDetailsRow,
  mapThreadSummaryRow,
  ThreadDetailRow,
  ThreadDetails,
  ThreadListFilter,
  ThreadSummary,
  ThreadSummaryRow,
} from "./threads.types.js";

export function parseThreadListFilter(queryObj: {
  page?: unknown;
  pageSize?: unknown;
  category?: unknown;
  q?: unknown;
  sort?: unknown;
}): ThreadListFilter {
  const page = Number(queryObj.page) || 1;
  const rawPageSize = Number(queryObj.pageSize) || 20;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 50);

  const categorySlug =
    typeof queryObj.category === "string" && queryObj.category.trim()
      ? queryObj.category.trim()
      : undefined;

  const search =
    typeof queryObj.q === "string" && queryObj.q.trim()
      ? queryObj.q.trim()
      : undefined;

  const sort: "new" | "old" = queryObj.sort === "old" ? "old" : "new";

  return {
    page,
    pageSize,
    search,
    sort,
    categorySlug,
  };
}

export async function listCategories(): Promise<Category[]> {
  const result = await query<CategoryRow>(
    `
        select id, slug, name, description
        from categories
        order by name asc
    `,
  );

  return result.rows.map(mapCategoryRow);
}

export async function CreatedThread(params: {
  categorySlug: string;
  authUserId: number;
  title: string;
  body: string;
}): Promise<ThreadDetails> {
  const { categorySlug, authUserId, title, body } = params;

  const categoryResponse = await query<{ id: number }>(
    `
    select id
from categories
    where slug = $1
    limit 1
    `,
    [categorySlug],
  );

  if (categoryResponse.rows.length === 0) {
    throw new BadRequestError("Invalid category");
  }
  const categoryId = categoryResponse.rows[0].id;

  const insertRes = await query<{ id: number }>(
    `
    insert into threads (category_id, author_user_id, title, body)
    values ($1, $2, $3, $4)
    returning id
    `,
    [categoryId, authUserId, title, body],
  );

  const threadId = insertRes.rows[0].id;

  return getThreadById(threadId);
}

export async function getThreadById(id: number): Promise<ThreadDetails> {
  const result = await query<ThreadDetailRow>(
    `
    select t.id,
      t.title,
      t.body,
      t.created_at,
      t.updated_at,
      c.slug as category_slug,
      c.name as category_name,
      u.display_name as author_display_name,
      u.handle as author_handle

      from threads t 
      join categories c on c.id = t.category_id
      join users u on u.id = t.author_user_id

      where t.id = $1
      limit 1
    `,
    [id],
  );

  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("thread not found");
  }

  return mapThreadDetailsRow(row);
}

export async function listThreads(
  filter: ThreadListFilter,
): Promise<ThreadSummary[]> {
  const { page, pageSize, categorySlug, sort, search } = filter;

  const conditions: string[] = [];

  const params: unknown[] = [];

  let idx = 1;

  if (categorySlug) {
    conditions.push(`c.slug = $${idx++}`);
    params.push(categorySlug);
  }

  if (search) {
    conditions.push(`(t.title ILIKE $${idx} or t.body ilike $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.length
    ? `where ${conditions.join(" AND ")}`
    : "";

  const orderClause =
    sort === "old" ? "order by t.created_at ASC" : "order by t.created_at desc";

  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

  const result = await query<ThreadSummaryRow>(
    `
    select 
    t.id,
    t.title,
    left(t.body, 200) AS excerpt,
    t.created_at,
    c.slug as category_slug,
    c.name as category_name,
    u.display_name as author_display_name,
    u.handle as author_handle
    from threads t
    join categories c on c.id = t.category_id
    join users u on u.id = t.author_user_id
    ${whereClause}
    ${orderClause}
    limit  $${idx++} offset $${idx}
    `,
    params,
  );

  return result.rows.map(mapThreadSummaryRow);
}
