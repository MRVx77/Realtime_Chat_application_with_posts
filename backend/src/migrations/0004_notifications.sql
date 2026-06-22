create table if not exists notifications (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    actor_user_id bigint not null references users(id) on delete cascade,
    thread_id  bigint not null references threads(id) on delete cascade,
    type text not null check (type in ('reply_on_thread', 'like_on_thread')),
    created_at timestamptz not null default now(),
    read_at timestamptz
);

create index if not exists idx_notifications_user_read
    on notifications (user_id, read_at);