CREATE TABLE IF NOT EXISTS users(
    id bigserial primary key,
    clerk_user_id text not null unique,
    display_name text,
    handle text unique,
    avatar_url text,
    bio text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
)