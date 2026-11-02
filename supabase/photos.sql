-- Photos upgrade: run once in Supabase > SQL Editor (also needed for new installs)
create table if not exists visit_photos(
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits(id) on delete cascade,
  path text not null, created_by uuid default auth.uid(), created_at timestamptz default now());
alter table visit_photos enable row level security;
create policy "shared photos" on visit_photos for all to authenticated using (true) with check (true);
-- Public-read bucket (photo links are unguessable); only logged-in users can upload or delete.
insert into storage.buckets(id,name,public) values('photos','photos',true) on conflict do nothing;
create policy "photos upload" on storage.objects for insert to authenticated with check (bucket_id='photos');
create policy "photos delete" on storage.objects for delete to authenticated using (bucket_id='photos');
