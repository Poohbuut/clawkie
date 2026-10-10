create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'customer',
  full_name text not null,
  email text not null unique,
  phone text
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business text not null check (business in ('nails', 'cookies')),
  name text not null,
  price numeric(10,2) not null,
  duration_minutes integer,
  is_active boolean not null default true
);

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

create table if not exists public.nail_appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id),
  service_id uuid not null references public.services(id),
  design_id uuid references public.nail_designs(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending',
  notes text,
  inspiration_photo_url text,
  price_at_booking numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_appointment_slot
  on public.nail_appointments (appointment_date, appointment_time)
  where status <> 'cancelled';

create table if not exists public.cookie_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id),
  status text not null default 'pending',
  pickup_or_delivery_date date not null,
  delivery_address text,
  special_instructions text,
  total_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cookie_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.cookie_orders(id) on delete cascade,
  service_id uuid not null references public.services(id),
  quantity integer not null check (quantity > 0),
  price_at_order numeric(10,2) not null
);

alter table public.users enable row level security;
alter table public.services enable row level security;
alter table public.nail_design_categories enable row level security;
alter table public.nail_designs enable row level security;
alter table public.nail_appointments enable row level security;
alter table public.cookie_orders enable row level security;
alter table public.cookie_order_items enable row level security;

insert into storage.buckets (id, name, public)
values
  ('inspiration-photos', 'inspiration-photos', true),
  ('nail-designs', 'nail-designs', true)
on conflict (id) do update set public = excluded.public;