-- Run this in your Supabase SQL Editor.
-- It creates booking tables, constraints, and RLS policies needed by the app.

create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service jsonb not null,
  date date not null,
  time text not null,
  customer_name text not null,
  customer_phone text not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'online')),
  -- Yoco online payment fields (nullable; only used when payment_method = 'online')
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled')),
  payment_reference text,        -- Yoco checkout id (ch_...)
  payment_amount_cents integer,  -- amount in cents (ZAR)
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bookings_date_time_unique unique (date, time)
);

-- Migration helpers for existing installs:
alter table public.bookings
  drop constraint if exists bookings_payment_method_check;
alter table public.bookings
  add constraint bookings_payment_method_check
  check (payment_method in ('cash', 'card', 'online'));

alter table public.bookings add column if not exists payment_status text not null default 'unpaid';
alter table public.bookings
  drop constraint if exists bookings_payment_status_check;
alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled'));
alter table public.bookings add column if not exists payment_reference text;
alter table public.bookings add column if not exists payment_amount_cents integer;
alter table public.bookings add column if not exists paid_at timestamptz;

create index if not exists bookings_payment_reference_idx on public.bookings (payment_reference);

create table if not exists public.blocked_days (
  date date primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_time_slots (
  date date not null,
  time text not null,
  created_at timestamptz not null default now(),
  constraint blocked_time_slots_pkey primary key (date, time)
);

-- =====================================================================
-- MERCH ORDERS (Yoco online payment for merch)
-- =====================================================================
create table if not exists public.merch_orders (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text not null,
  size text not null,
  quantity integer not null default 1,
  unit_price_cents integer not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'cancelled')),
  payment_reference text,
  payment_amount_cents integer,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists merch_orders_payment_reference_idx on public.merch_orders (payment_reference);

alter table public.bookings enable row level security;
alter table public.blocked_days enable row level security;
alter table public.blocked_time_slots enable row level security;
alter table public.merch_orders enable row level security;

drop policy if exists "Public can read bookings" on public.bookings;
create policy "Public can read bookings"
on public.bookings
for select
to anon, authenticated
using (true);

drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings"
on public.bookings
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can delete bookings" on public.bookings;
create policy "Authenticated admins can delete bookings"
on public.bookings
for delete
to authenticated
using (true);

drop policy if exists "Public can read blocked_days" on public.blocked_days;
create policy "Public can read blocked_days"
on public.blocked_days
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can manage blocked_days" on public.blocked_days;
create policy "Authenticated admins can manage blocked_days"
on public.blocked_days
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read blocked_time_slots" on public.blocked_time_slots;
create policy "Public can read blocked_time_slots"
on public.blocked_time_slots
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can manage blocked_time_slots" on public.blocked_time_slots;
create policy "Authenticated admins can manage blocked_time_slots"
on public.blocked_time_slots
for all
to authenticated
using (true)
with check (true);

-- Merch orders policies
drop policy if exists "Public can read merch_orders" on public.merch_orders;
create policy "Public can read merch_orders"
on public.merch_orders
for select
to anon, authenticated
using (true);

drop policy if exists "Public can create merch_orders" on public.merch_orders;
create policy "Public can create merch_orders"
on public.merch_orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can delete merch_orders" on public.merch_orders;
create policy "Authenticated admins can delete merch_orders"
on public.merch_orders
for delete
to authenticated
using (true);

-- NOTE: payment_status updates happen via edge functions using the
-- SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
