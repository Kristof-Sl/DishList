-- Dishlist schema: run in Supabase > SQL Editor
create table if not exists places(
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, lat double precision, lng double precision,
  type text default 'restaurant', cuisine text, price text, website text,
  status text not null default 'to_try' check (status in ('to_try','tried')),
  source text, notes text,
  created_by uuid default auth.uid(), created_at timestamptz default now());
create table if not exists visits(
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  visited_on date not null default current_date, by_name text, went_with text,
  rating int check (rating between 1 and 5), would_return text check (would_return in ('yes','maybe','no')),
  dishes text, notes text, total_bill numeric, meal_type text, reason text,
  created_by uuid default auth.uid(), created_at timestamptz default now());
alter table visits add column if not exists total_bill numeric;
alter table visits add column if not exists meal_type text;
alter table visits add column if not exists reason text;
alter table places enable row level security;
alter table visits enable row level security;
-- You and your partner share everything: any logged-in user has full access.
-- After both accounts exist, disable sign-ups (see README) so nobody else can join.
create policy "shared places" on places for all to authenticated using (true) with check (true);
create policy "shared visits" on visits for all to authenticated using (true) with check (true);
