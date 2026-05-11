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
  payment_method text not null check (payment_method in ('cash', 'card')),
  created_at timestamptz not null default now(),
  constraint bookings_date_time_unique unique (date, time)
);

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

alter table public.bookings enable row level security;
alter table public.blocked_days enable row level security;
alter table public.blocked_time_slots enable row level security;

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
