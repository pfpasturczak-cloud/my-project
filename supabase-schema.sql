-- ============================================================
-- VISORA — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- Project > SQL Editor > New query > paste > Run
-- ============================================================


-- ── 1. PROFILES ──────────────────────────────────────────────
-- Extends auth.users. Created automatically on registration.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. PROJECTS ───────────────────────────────────────────────

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  brief       text,
  status      text not null default 'submitted'
              check (status in ('submitted','in_review','in_progress','ready','complete')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();


-- ── 3. ASSETS ─────────────────────────────────────────────────

create table public.assets (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  type          text not null check (type in ('reference', 'deliverable')),
  file_name     text not null,
  storage_path  text not null,
  uploaded_by   uuid references public.profiles(id),
  created_at    timestamptz default now()
);


-- ── 4. NOTIFICATIONS ──────────────────────────────────────────

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  type        text not null default 'ready',
  sent_to     text not null,
  resend_id   text,
  created_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Controls who can read/write which rows
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.projects     enable row level security;
alter table public.assets       enable row level security;
alter table public.notifications enable row level security;


-- ── PROFILES ──

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ── PROJECTS ──

-- Clients see only their own projects
create policy "Clients view own projects"
  on public.projects for select
  using (auth.uid() = client_id);

-- Admins see all projects
create policy "Admins view all projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can create projects
create policy "Clients can create projects"
  on public.projects for insert
  with check (auth.uid() = client_id);

-- Admins can update any project (status changes)
create policy "Admins can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ── ASSETS ──

-- Clients can view assets for their own projects
create policy "Clients view own project assets"
  on public.assets for select
  using (
    exists (
      select 1 from public.projects
      where id = project_id and client_id = auth.uid()
    )
  );

-- Admins can view all assets
create policy "Admins view all assets"
  on public.assets for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can insert reference assets for their own projects
create policy "Clients insert reference assets"
  on public.assets for insert
  with check (
    type = 'reference' and
    exists (
      select 1 from public.projects
      where id = project_id and client_id = auth.uid()
    )
  );

-- Admins can insert deliverable assets
create policy "Admins insert deliverable assets"
  on public.assets for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ── NOTIFICATIONS ──

-- Admins only
create policy "Admins manage notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- Create these manually in Supabase > Storage > New bucket
-- OR run these if you have the storage extension enabled
-- ============================================================

-- Public gallery bucket (images/videos for the public gallery page)
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict do nothing;

-- Private reference uploads (client brief images — signed URLs only)
insert into storage.buckets (id, name, public)
values ('reference-uploads', 'reference-uploads', false)
on conflict do nothing;

-- Private deliverables (completed work — signed URLs only)
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict do nothing;


-- ── STORAGE POLICIES ──

-- Gallery: anyone can read
create policy "Public gallery read"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- Gallery: only admins can upload
create policy "Admin gallery upload"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Reference uploads: clients can upload to their own project folder
create policy "Clients upload references"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-uploads' and auth.role() = 'authenticated'
  );

-- Reference uploads: clients and admins can read (via signed URL)
create policy "Authenticated users read references"
  on storage.objects for select
  using (
    bucket_id = 'reference-uploads' and auth.role() = 'authenticated'
  );

-- Deliverables: admins can upload
create policy "Admins upload deliverables"
  on storage.objects for insert
  with check (
    bucket_id = 'deliverables' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Deliverables: authenticated users can read (via signed URL, enforced in app)
create policy "Authenticated users read deliverables"
  on storage.objects for select
  using (
    bucket_id = 'deliverables' and auth.role() = 'authenticated'
  );


-- ============================================================
-- MAKE YOURSELF ADMIN
-- After you register your own account, run this with your email:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'pfpasturczak@gmail.com';
-- ============================================================
