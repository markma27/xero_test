-- Supabase schema for Xero OAuth prototype
-- Run this in your Supabase SQL editor

create table if not exists xero_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id text unique not null,
  token_set_enc text not null,       -- encrypted JSON from xero-node
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table xero_tokens enable row level security;

create policy "service-role-only" on xero_tokens
  for all using (auth.role() = 'service_role');
