create table if not exists portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table portfolios enable row level security;
create policy "own select" on portfolios for select using (auth.uid() = user_id);
create policy "own insert" on portfolios for insert with check (auth.uid() = user_id);
create policy "own update" on portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on portfolios for delete using (auth.uid() = user_id);
