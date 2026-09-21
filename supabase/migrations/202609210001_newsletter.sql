-- BashCutz newsletter/customer updates subsystem.
-- Subscriber writes are intentionally routed through Edge Functions. Public
-- roles receive no direct table access.

create extension if not exists "pgcrypto";

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  -- Stores a SHA-256 digest, never the raw token included in an email URL.
  unsubscribe_token text not null default encode(digest(gen_random_bytes(32), 'sha256'), 'hex'),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_normalized
    check (email = lower(btrim(email))),
  constraint newsletter_subscribers_email_length
    check (char_length(email) between 3 and 254),
  constraint newsletter_subscribers_token_format
    check (unsubscribe_token ~ '^[0-9a-f]{64}$'),
  constraint newsletter_subscribers_email_key unique (email),
  constraint newsletter_subscribers_unsubscribe_token_key unique (unsubscribe_token)
);

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);
create index if not exists newsletter_subscribers_subscribed_at_idx
  on public.newsletter_subscribers (subscribed_at desc);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(btrim(subject)) between 1 and 180),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  type text not null default 'general'
    check (type in ('general', 'price_update', 'promotion', 'announcement', 'holiday_hours')),
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  send_error text
);

create index if not exists newsletter_campaigns_created_at_idx
  on public.newsletter_campaigns (created_at desc);
create index if not exists newsletter_campaigns_status_idx
  on public.newsletter_campaigns (status);

-- Per-recipient delivery state makes batches retry-safe and preserves partial
-- successes without exposing addresses via CC/BCC.
create table if not exists public.newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint newsletter_deliveries_campaign_subscriber_key
    unique (campaign_id, subscriber_id)
);

create index if not exists newsletter_deliveries_campaign_status_idx
  on public.newsletter_deliveries (campaign_id, status);

-- Only hashed network identifiers are retained for short-lived abuse controls.
create table if not exists public.newsletter_subscription_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscription_attempts_lookup_idx
  on public.newsletter_subscription_attempts (ip_hash, created_at desc);

create or replace function public.newsletter_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row execute function public.newsletter_set_updated_at();

drop trigger if exists newsletter_campaigns_set_updated_at on public.newsletter_campaigns;
create trigger newsletter_campaigns_set_updated_at
before update on public.newsletter_campaigns
for each row execute function public.newsletter_set_updated_at();

-- Atomic subscription/resubscription prevents races around the unique email.
create or replace function public.subscribe_to_newsletter(p_email text)
returns table (result text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(p_email));
  v_status text;
  v_inserted integer;
begin
  select ns.status into v_status
  from public.newsletter_subscribers ns
  where ns.email = v_email
  for update;

  if v_status = 'subscribed' then
    return query select 'already_subscribed'::text;
    return;
  end if;

  if v_status = 'unsubscribed' then
    update public.newsletter_subscribers
    set status = 'subscribed',
        subscribed_at = now(),
        unsubscribed_at = null,
        unsubscribe_token = encode(digest(gen_random_bytes(32), 'sha256'), 'hex')
    where email = v_email;
    return query select 'resubscribed'::text;
    return;
  end if;

  insert into public.newsletter_subscribers (email)
  values (v_email)
  on conflict (email) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    return query select 'subscribed'::text;
    return;
  end if;

  -- A concurrent request inserted the same normalized address. Lock and
  -- evaluate that row so the caller still receives a friendly outcome.
  select ns.status into v_status
  from public.newsletter_subscribers ns
  where ns.email = v_email
  for update;

  if v_status = 'unsubscribed' then
    update public.newsletter_subscribers
    set status = 'subscribed',
        subscribed_at = now(),
        unsubscribed_at = null,
        unsubscribe_token = encode(digest(gen_random_bytes(32), 'sha256'), 'hex')
    where email = v_email;
    return query select 'resubscribed'::text;
  else
    return query select 'already_subscribed'::text;
  end if;
end;
$$;

-- Campaign claims are atomic, so two send requests cannot start the same
-- draft. Failed campaigns may be retried; sent deliveries are skipped.
create or replace function public.claim_newsletter_campaign(p_campaign_id uuid)
returns setof public.newsletter_campaigns
language sql
security definer
set search_path = public
as $$
  update public.newsletter_campaigns
  set status = 'sending', send_error = null
  where id = p_campaign_id
    and status in ('draft', 'failed')
  returning *;
$$;

create or replace function public.set_newsletter_unsubscribe_tokens(p_tokens jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.newsletter_subscribers as subscriber
  set unsubscribe_token = token.token_hash
  from jsonb_to_recordset(p_tokens) as token(subscriber_id uuid, token_hash text)
  where subscriber.id = token.subscriber_id
    and subscriber.status = 'subscribed'
    and token.token_hash ~ '^[0-9a-f]{64}$';
$$;

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_deliveries enable row level security;
alter table public.newsletter_subscription_attempts enable row level security;

drop policy if exists "Admins can view newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can view newsletter subscribers"
on public.newsletter_subscribers for select to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Admins can view newsletter campaigns" on public.newsletter_campaigns;
create policy "Admins can view newsletter campaigns"
on public.newsletter_campaigns for select to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Admins can create newsletter drafts" on public.newsletter_campaigns;
create policy "Admins can create newsletter drafts"
on public.newsletter_campaigns for insert to authenticated
with check (auth.role() = 'authenticated' and status = 'draft' and created_by = auth.uid());

drop policy if exists "Admins can update unsent newsletter campaigns" on public.newsletter_campaigns;
create policy "Admins can update unsent newsletter campaigns"
on public.newsletter_campaigns for update to authenticated
using (auth.role() = 'authenticated' and status in ('draft', 'failed'))
with check (auth.role() = 'authenticated' and status in ('draft', 'failed'));

drop policy if exists "Admins can delete newsletter drafts" on public.newsletter_campaigns;
create policy "Admins can delete newsletter drafts"
on public.newsletter_campaigns for delete to authenticated
using (auth.role() = 'authenticated' and status = 'draft');

drop policy if exists "Admins can view newsletter deliveries" on public.newsletter_deliveries;
create policy "Admins can view newsletter deliveries"
on public.newsletter_deliveries for select to authenticated
using (auth.role() = 'authenticated');

revoke all on table public.newsletter_subscribers from anon, authenticated;
revoke all on table public.newsletter_campaigns from anon, authenticated;
revoke all on table public.newsletter_deliveries from anon, authenticated;
revoke all on table public.newsletter_subscription_attempts from anon, authenticated;

-- Deliberately omit unsubscribe_token from the admin grant.
grant select (id, email, status, subscribed_at, unsubscribed_at, created_at, updated_at)
  on public.newsletter_subscribers to authenticated;
grant select, insert, update, delete on public.newsletter_campaigns to authenticated;
grant select on public.newsletter_deliveries to authenticated;

revoke all on function public.subscribe_to_newsletter(text) from public, anon, authenticated;
grant execute on function public.subscribe_to_newsletter(text) to service_role;
revoke all on function public.claim_newsletter_campaign(uuid) from public, anon, authenticated;
grant execute on function public.claim_newsletter_campaign(uuid) to service_role;
revoke all on function public.set_newsletter_unsubscribe_tokens(jsonb) from public, anon, authenticated;
grant execute on function public.set_newsletter_unsubscribe_tokens(jsonb) to service_role;
