-- Kebab CRM : schéma Supabase.
-- À coller tel quel dans l'éditeur SQL de ton projet Supabase (SQL Editor > New query > Run).

create extension if not exists pgcrypto;

-- Profils (un par compte). Créé automatiquement à l'inscription.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('vendeur', 'dev')),
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'vendeur'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  linkedin_url text,
  instagram text,
  website_url text,
  google_url text,
  niche text,
  city text,
  status text not null default 'nouveau',
  owner_id uuid references public.profiles (id) on delete set null,
  channel text,
  lost_reason text,
  client_stage text,
  notes text,
  mockup_url text,
  video_url text,
  meeting_at timestamptz,
  quote_amount numeric,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mockup_briefs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null unique references public.prospects (id) on delete cascade,
  logo_url text,
  primary_color text,
  secondary_color text,
  variant text,
  tagline text,
  services text,
  address text,
  hours text,
  photos text,
  reviews text,
  extra_notes text,
  requested_by uuid references public.profiles (id) on delete set null,
  requested_at timestamptz,
  started_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  type text not null default 'autre',
  title text not null,
  due_date date not null,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  type text not null default 'note',
  content text,
  status_to text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prospect_id uuid references public.prospects (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists prospects_status_idx on public.prospects (status);
create index if not exists tasks_assigned_due_idx on public.tasks (assigned_to, due_date) where done_at is null;
create index if not exists activities_prospect_idx on public.activities (prospect_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- Sécurité : l'application est une équipe de deux personnes.
-- Toute personne connectée voit et modifie tout. Désactive les inscriptions
-- dans Supabase (Authentication > Providers > Email > "Allow new users to sign up")
-- une fois vos deux comptes créés.
alter table public.profiles enable row level security;
alter table public.prospects enable row level security;
alter table public.mockup_briefs enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "team_all" on public.profiles;
create policy "team_all" on public.profiles for all to authenticated using (true) with check (true);
drop policy if exists "team_all" on public.prospects;
create policy "team_all" on public.prospects for all to authenticated using (true) with check (true);
drop policy if exists "team_all" on public.mockup_briefs;
create policy "team_all" on public.mockup_briefs for all to authenticated using (true) with check (true);
drop policy if exists "team_all" on public.tasks;
create policy "team_all" on public.tasks for all to authenticated using (true) with check (true);
drop policy if exists "team_all" on public.activities;
create policy "team_all" on public.activities for all to authenticated using (true) with check (true);
drop policy if exists "team_all" on public.notifications;
create policy "team_all" on public.notifications for all to authenticated using (true) with check (true);

-- Temps réel : chaque changement est poussé à l'autre personne connectée.
do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.prospects; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.mockup_briefs; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.tasks; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.activities; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;
