-- Create extension for UUID generation if not present
create extension if not exists pgcrypto;

-- Error logging table
create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  level text not null default 'error',
  source text,                -- e.g., edge_function, client
  endpoint text,              -- e.g., spotify-auth, /v1/search
  method text,                -- HTTP method
  status int,                 -- HTTP status if applicable
  message text,               -- short message
  details jsonb,              -- arbitrary JSON payload
  user_agent text,
  ip text,
  request_id text
);

alter table public.api_logs enable row level security;

-- No RLS policies added; writes should be performed using the service role only.
