create table if not exists public.nail_design_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.nail_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.nail_design_categories(id) on delete set null,
  starting_price numeric(10,2),
  image_url text not null,
  storage_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.nail_designs enable row level security;
alter table public.nail_design_categories enable row level security;

alter table public.nail_appointments
  add column if not exists design_id uuid references public.nail_designs(id) on delete set null;

insert into storage.buckets (id, name, public)
values ('nail-designs', 'nail-designs', true)
on conflict (id) do nothing;