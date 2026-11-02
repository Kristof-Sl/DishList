-- Run in Supabase SQL Editor to add the new visit fields to an existing project.
alter table visits add column if not exists total_bill numeric;
alter table visits add column if not exists meal_type text;
alter table visits add column if not exists reason text;
