create table if not exists replies (
    id bigserial primary key,
    thread_id bigint not null references threads(id) on delete cascade,
    author_user_id bigint not null references users(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_replies_created_at
    on replies (thread_id, created_at asc);

create table if not exists thread_reactions (
    id bigserial primary key,
    thread_id bigint not null references threads(id) on delete cascade,
    user_id bigint not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint uniq_thread_reaction unique (thread_id, user_id)
);

create index if not exists idx_thread_reactions_thread
    on thread_reactions (thread_id);