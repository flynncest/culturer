-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── persons ──────────────────────────────────────────────────────────────────
create table persons (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null check (type in ('employee','client','prospect')),
  first_name         text not null,
  last_name          text not null,
  email              text not null,
  company_name       text,
  package            text,
  status             text not null default 'active',
  quiz_token         uuid unique not null default gen_random_uuid(),
  quiz_completed_at  timestamptz,
  birth_date         date,
  start_date         date,
  renewal_date       date,
  created_at         timestamptz not null default now()
);

alter table persons enable row level security;

-- Authenticated users can do everything
create policy "auth_all" on persons
  for all to authenticated
  using (true)
  with check (true);

-- ── quiz_responses ────────────────────────────────────────────────────────────
create table quiz_responses (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references persons(id) on delete cascade,
  favourite_treat  text,
  hobbies          text,
  gift_preference  text check (gift_preference in ('experience','physical','food')),
  tshirt_size      text,
  extra_notes      text,
  submitted_at     timestamptz not null default now()
);

alter table quiz_responses enable row level security;

-- Authenticated users can read and write
create policy "auth_all" on quiz_responses
  for all to authenticated
  using (true)
  with check (true);

-- Anonymous users can insert (quiz submission) and select their own record by joining token
create policy "anon_insert" on quiz_responses
  for insert to anon
  with check (true);

-- ── triggers ─────────────────────────────────────────────────────────────────
create table triggers (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references persons(id) on delete cascade,
  type         text not null check (type in ('birthday','anniversary','renewal','outreach','onboarding')),
  trigger_date date not null,
  package      text,
  status       text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  fired_at     timestamptz,
  error_text   text,
  created_at   timestamptz not null default now()
);

alter table triggers enable row level security;

create policy "auth_all" on triggers
  for all to authenticated
  using (true)
  with check (true);

-- ── actions_log ──────────────────────────────────────────────────────────────
create table actions_log (
  id           uuid primary key default gen_random_uuid(),
  trigger_id   uuid references triggers(id) on delete set null,
  action_type  text not null check (action_type in ('email_sent','video_requested','video_ready','gift_queued','landing_page_created')),
  payload      jsonb,
  created_at   timestamptz not null default now()
);

alter table actions_log enable row level security;

create policy "auth_all" on actions_log
  for all to authenticated
  using (true)
  with check (true);

-- ── video_jobs ────────────────────────────────────────────────────────────────
create table video_jobs (
  id           uuid primary key default gen_random_uuid(),
  trigger_id   uuid not null references triggers(id) on delete cascade,
  kie_task_id  text,
  status       text not null default 'pending' check (status in ('pending','completed','failed')),
  video_url    text,
  created_at   timestamptz not null default now()
);

alter table video_jobs enable row level security;

create policy "auth_all" on video_jobs
  for all to authenticated
  using (true)
  with check (true);

-- ── landing_pages ─────────────────────────────────────────────────────────────
create table landing_pages (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references persons(id) on delete cascade,
  slug         text unique not null,
  html_content text not null,
  created_at   timestamptz not null default now()
);

alter table landing_pages enable row level security;

create policy "auth_all" on landing_pages
  for all to authenticated
  using (true)
  with check (true);

-- Public read for landing pages (accessed via slug)
create policy "public_read" on landing_pages
  for select to anon
  using (true);

-- Public read for persons (needed for quiz token lookup)
create policy "public_read" on persons
  for select to anon
  using (true);
