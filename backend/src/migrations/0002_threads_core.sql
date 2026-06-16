
create table if not exists categories (
    id bigserial primary key,
    slug text not null unique,
    name text not null,
    description text
);

create table if not exists threads (
    id bigserial primary key,
    category_id bigint not null references categories(id),
    author_user_id bigint not null references users(id),
    title text not null,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create index if not exists idx_threads_category_created_at
    on threads (category_id, created_at desc);



INSERT INTO categories (slug, name, description)
VALUES 
  ('general',  'General',  'Anything dev-related, off-topic but friendly.'),
  ('q-and-a',  'Q&A',      'Ask and answer coding and career questions.'),
  ('showcase', 'Showcase', 'Share what you are building or learning.'),
  ('help',     'Help',     'Stuck on something? Ask for help here.')
ON CONFLICT (slug) DO NOTHING;