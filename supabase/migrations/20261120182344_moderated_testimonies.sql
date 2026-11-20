-- Supabase. Seul le schéma public doit être exposé pour ce service.
begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema mbt_moderation;
revoke all on schema mbt_moderation from public, anon, authenticated, service_role;

create table mbt_moderation.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true
);
create table mbt_moderation.submissions (
  id uuid primary key default gen_random_uuid(),
  title text check (char_length(title) between 3 and 120),
  body text check (char_length(body) between 50 and 4000),
  withdrawal_hash bytea not null,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'withdrawn')),
  decided_at timestamptz,
  proposed_title text check (char_length(proposed_title) between 3 and 120),
  proposed_body text check (char_length(proposed_body) between 50 and 4000),
  revision integer not null default 0,
  check ((proposed_title is null) = (proposed_body is null)),
  check (status <> 'pending' or (title is not null and body is not null))
);
create index submissions_retention_idx on mbt_moderation.submissions (status, submitted_at);
create table mbt_moderation.approvals (
  submission_id uuid not null references mbt_moderation.submissions(id) on delete cascade,
  revision integer not null,
  moderator_id uuid not null references mbt_moderation.moderators(user_id) on delete cascade,
  primary key (submission_id, revision, moderator_id)
);
create index approvals_moderator_idx on mbt_moderation.approvals (moderator_id);
create table mbt_moderation.audit (
  id bigint generated always as identity primary key,
  submission_id uuid not null,
  actor uuid,
  action text not null,
  happened_at timestamptz not null default now()
);

create table public.mbt_published_testimonies (
  id uuid primary key references mbt_moderation.submissions(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now()
);
create index mbt_published_testimonies_date_idx on public.mbt_published_testimonies (published_at desc, id);

alter table mbt_moderation.moderators enable row level security;
alter table mbt_moderation.submissions enable row level security;
alter table mbt_moderation.approvals enable row level security;
alter table mbt_moderation.audit enable row level security;
alter table public.mbt_published_testimonies enable row level security;
revoke all on all tables in schema mbt_moderation from public, anon, authenticated, service_role;
revoke all on public.mbt_published_testimonies from public, anon, authenticated, service_role;
grant select on public.mbt_published_testimonies to anon, authenticated;
create policy "Public reads only final text" on public.mbt_published_testimonies
  for select to anon, authenticated using (true);

grant usage on schema mbt_moderation to authenticated, service_role;
grant select, insert, update, delete on mbt_moderation.submissions to service_role;
grant insert, delete on mbt_moderation.audit to service_role;
grant usage on sequence mbt_moderation.audit_id_seq to service_role;
grant delete on public.mbt_published_testimonies to service_role;
grant select (id) on public.mbt_published_testimonies to service_role;

-- Point d’entrée du service de collecte. Le token aléatoire n'est renvoyé qu'au dépôt.
create function public.mbt_submit_testimony(p_title text, p_body text, p_agreed boolean)
returns table (id uuid, withdrawal_token text)
language plpgsql security invoker set search_path = ''
as $$
declare
  token text := encode(extensions.gen_random_bytes(32), 'hex');
  submission_id uuid;
begin
  if p_agreed is distinct from true then
    raise exception 'Explicit confirmation required' using errcode = '22023';
  end if;
  insert into mbt_moderation.submissions as s (title, body, withdrawal_hash)
  values (btrim(p_title), btrim(p_body), extensions.digest(token, 'sha256'))
  returning s.id into submission_id;
  insert into mbt_moderation.audit (submission_id, action) values (submission_id, 'submitted');
  return query select submission_id, token;
end;
$$;

create function public.mbt_withdraw_testimony(p_id uuid, p_token text)
returns boolean
language plpgsql security invoker set search_path = ''
as $$
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return false; end if;
  update mbt_moderation.submissions
    set status = 'withdrawn', decided_at = now()
    where id = p_id and withdrawal_hash = extensions.digest(p_token, 'sha256') and status <> 'withdrawn';
  if not found then return false; end if;
  delete from public.mbt_published_testimonies where id = p_id;
  insert into mbt_moderation.audit (submission_id, action) values (p_id, 'withdrawn');
  return true;
end;
$$;

create function mbt_moderation.require_moderator()
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or (auth.jwt() ->> 'aal') is distinct from 'aal2' then
    raise exception 'Moderator and MFA required' using errcode = '42501';
  end if;
  perform 1 from mbt_moderation.moderators where user_id = actor and active for share;
  if not found then raise exception 'Moderator and MFA required' using errcode = '42501'; end if;
  return actor;
end;
$$;

create function mbt_moderation.review_queue()
returns table (id uuid, title text, body text, proposed_title text, proposed_body text,
  revision integer, submitted_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  perform mbt_moderation.require_moderator();
  return query select s.id, s.title, s.body, s.proposed_title, s.proposed_body, s.revision, s.submitted_at
    from mbt_moderation.submissions s
    where s.status = 'pending' order by s.submitted_at, s.id limit 100;
end;
$$;

create function mbt_moderation.review(p_id uuid, p_revision integer, p_action text, p_title text, p_body text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := mbt_moderation.require_moderator();
  submission mbt_moderation.submissions%rowtype;
  new_status text := 'pending';
begin
  select * into submission from mbt_moderation.submissions where id = p_id for update;
  if not found then
    raise exception 'Submission is unavailable for review' using errcode = '22023';
  end if;
  if p_action = 'unpublish' and submission.status = 'published' then
    delete from public.mbt_published_testimonies where id = p_id;
    update mbt_moderation.submissions set status = 'withdrawn', decided_at = now() where id = p_id;
    insert into mbt_moderation.audit (submission_id, actor, action) values (p_id, actor, p_action);
    return 'withdrawn';
  end if;
  if submission.status <> 'pending' then
    raise exception 'Submission is unavailable for review' using errcode = '22023';
  end if;
  if p_revision is distinct from submission.revision then
    raise exception 'Review the current revision' using errcode = '22023';
  end if;

  case p_action
    when 'propose' then
      if p_title is null or p_body is null then
        raise exception 'Edited title and body are required' using errcode = '22023';
      end if;
      update mbt_moderation.submissions set proposed_title = btrim(p_title), proposed_body = btrim(p_body),
        revision = revision + 1 where id = p_id;
      delete from mbt_moderation.approvals where submission_id = p_id;
    when 'approve' then
      if submission.proposed_body is null then
        raise exception 'Edited version required' using errcode = '22023';
      end if;
      insert into mbt_moderation.approvals (submission_id, revision, moderator_id)
        values (p_id, submission.revision, actor) on conflict do nothing;
      if not found then return new_status; end if;
      if (select count(*) from mbt_moderation.approvals a
          join mbt_moderation.moderators m on m.user_id = a.moderator_id and m.active
          where a.submission_id = p_id and a.revision = submission.revision) >= 2 then
        insert into public.mbt_published_testimonies (id, title, body)
          values (p_id, submission.proposed_title, submission.proposed_body);
        new_status := 'published';
      end if;
    when 'reject' then
      new_status := 'rejected';
    else
      raise exception 'Unknown review action' using errcode = '22023';
  end case;
  if new_status <> 'pending' then
    update mbt_moderation.submissions set status = new_status, decided_at = now() where id = p_id;
  end if;
  insert into mbt_moderation.audit (submission_id, actor, action) values (p_id, actor, p_action);
  if new_status = 'published' then
    update mbt_moderation.submissions set title = null, body = null, proposed_title = null, proposed_body = null
      where id = p_id;
    insert into mbt_moderation.audit (submission_id, actor, action) values (p_id, actor, 'published');
  end if;
  return new_status;
end;
$$;

create function public.mbt_testimony_review_queue()
returns table (id uuid, title text, body text, proposed_title text, proposed_body text,
  revision integer, submitted_at timestamptz)
language sql security invoker set search_path = ''
as $$ select * from mbt_moderation.review_queue(); $$;

create function public.mbt_review_testimony(p_id uuid, p_revision integer, p_action text,
  p_title text default null, p_body text default null)
returns text
language sql security invoker set search_path = ''
as $$ select mbt_moderation.review(p_id, p_revision, p_action, p_title, p_body); $$;

-- À lancer quotidiennement par un job privilégié.
create function public.mbt_purge_testimonies()
returns void
language sql security invoker set search_path = ''
as $$
  delete from mbt_moderation.submissions where
    (status = 'pending' and submitted_at < now() - interval '30 days')
    or (status in ('rejected', 'withdrawn') and decided_at < now() - interval '30 days');
  delete from mbt_moderation.audit where happened_at < now() - interval '90 days';
$$;
grant select (happened_at) on mbt_moderation.audit to service_role;

revoke all on all functions in schema mbt_moderation from public, anon, authenticated, service_role;
revoke all on function public.mbt_submit_testimony(text,text,boolean), public.mbt_withdraw_testimony(uuid,text),
  public.mbt_purge_testimonies(), public.mbt_testimony_review_queue(),
  public.mbt_review_testimony(uuid,integer,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.mbt_submit_testimony(text,text,boolean), public.mbt_withdraw_testimony(uuid,text),
  public.mbt_purge_testimonies() to service_role;
grant execute on function mbt_moderation.review_queue(), mbt_moderation.review(uuid,integer,text,text,text),
  public.mbt_testimony_review_queue(), public.mbt_review_testimony(uuid,integer,text,text,text) to authenticated;

commit;
