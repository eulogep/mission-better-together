-- À exécuter sur une base de test après la migration. Données fictives, transaction annulée.
begin;

insert into auth.users (id) values
  ('1b1e5100-0000-4000-8000-000000000001'),
  ('1b1e5100-0000-4000-8000-000000000002'),
  ('1b1e5100-0000-4000-8000-000000000003');
insert into mbt_moderation.moderators (user_id) values
  ('1b1e5100-0000-4000-8000-000000000001'),
  ('1b1e5100-0000-4000-8000-000000000002');

set local role service_role;
do $$
declare
  receipt record;
begin
  begin
    perform public.mbt_submit_testimony('Brouillon', repeat('texte ', 12), false);
    raise exception 'Dépôt accepté sans accord explicite';
  exception when invalid_parameter_value then null;
  end;
  select * into receipt from public.mbt_submit_testimony('Titre privé', repeat('original ', 8), true);
  if length(receipt.withdrawal_token) <> 64 then raise exception 'Jeton invalide'; end if;
  perform set_config('mbt.test_id', receipt.id::text, true);
  perform set_config('mbt.test_token', receipt.withdrawal_token, true);
end;
$$;
reset role;

set local role anon;
do $$
begin
  if exists (select 1 from public.mbt_published_testimonies where id = current_setting('mbt.test_id')::uuid)
    then raise exception 'Le dépôt en attente est visible'; end if;
  begin
    perform public.mbt_testimony_review_queue();
    raise exception 'File accessible anonymement';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.mbt_submit_testimony('Titre', repeat('texte ', 12), true);
    raise exception 'Dépôt direct autorisé anonymement';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"1b1e5100-0000-4000-8000-000000000001","aal":"aal1"}', true);
do $$
begin
  begin
    perform public.mbt_testimony_review_queue();
    raise exception 'Consultation autorisée sans MFA';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"1b1e5100-0000-4000-8000-000000000003","aal":"aal2"}', true);
do $$
begin
  begin
    perform public.mbt_testimony_review_queue();
    raise exception 'Consultation autorisée à un compte hors équipe';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"1b1e5100-0000-4000-8000-000000000001","aal":"aal2"}', true);
do $$
declare
  uid uuid := current_setting('mbt.test_id')::uuid;
begin
  if not exists (select 1 from public.mbt_testimony_review_queue() where id = uid and title = 'Titre privé')
    then raise exception 'Dépôt introuvable pour le modérateur'; end if;
  perform public.mbt_review_testimony(uid, 0, 'propose', 'Première version', repeat('première ', 8));
  perform public.mbt_review_testimony(uid, 1, 'approve');
  perform public.mbt_review_testimony(uid, 1, 'approve');
  if exists (select 1 from public.mbt_published_testimonies where id = uid)
    then raise exception 'Double validation par le même compte'; end if;
  perform public.mbt_review_testimony(uid, 1, 'propose', 'Titre public', repeat('anonymisé ', 8));
  begin
    perform public.mbt_review_testimony(uid, 1, 'approve');
    raise exception 'Approbation d’une version obsolète';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"1b1e5100-0000-4000-8000-000000000002","aal":"aal2"}', true);
do $$
declare
  uid uuid := current_setting('mbt.test_id')::uuid;
begin
  if public.mbt_review_testimony(uid, 2, 'approve') <> 'pending'
    then raise exception 'Une ancienne approbation a été reportée'; end if;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"1b1e5100-0000-4000-8000-000000000001","aal":"aal2"}', true);
do $$
begin
  if public.mbt_review_testimony(current_setting('mbt.test_id')::uuid, 2, 'approve') <> 'published'
    then raise exception 'La double validation ne publie pas'; end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  if not exists (select 1 from public.mbt_published_testimonies
    where id = current_setting('mbt.test_id')::uuid and title = 'Titre public' and body = repeat('anonymisé ', 7) || 'anonymisé')
    then raise exception 'Version publique incorrecte'; end if;
end;
$$;
reset role;

do $$
begin
  if exists (select 1 from mbt_moderation.submissions
    where id = current_setting('mbt.test_id')::uuid and (body is not null or title is not null))
    then raise exception 'Original en clair conservé après publication'; end if;
end;
$$;

-- Annule uniquement le retrait de modération pour tester ensuite le retrait de l’auteur.
set local role authenticated;
do $$
declare
  uid uuid := current_setting('mbt.test_id')::uuid;
begin
  begin
    if public.mbt_review_testimony(uid, null, 'unpublish') <> 'withdrawn'
      then raise exception 'Le retrait de modération a échoué'; end if;
    if exists (select 1 from public.mbt_published_testimonies where id = uid)
      then raise exception 'Publication toujours visible après dépublication'; end if;
    raise exception 'Fin du contrôle de dépublication' using errcode = 'P2001';
  exception when sqlstate 'P2001' then null;
  end;
end;
$$;
reset role;

set local role service_role;
do $$
declare
  uid uuid := current_setting('mbt.test_id')::uuid;
begin
  if public.mbt_withdraw_testimony(uid, repeat('0', 64)) then raise exception 'Mauvais jeton accepté'; end if;
  if not public.mbt_withdraw_testimony(uid, current_setting('mbt.test_token')) then raise exception 'Retrait refusé'; end if;
  update mbt_moderation.submissions set decided_at = now() - interval '31 days' where id = uid;
  perform public.mbt_purge_testimonies();
  if exists (select 1 from mbt_moderation.submissions where id = uid) then raise exception 'La purge a échoué'; end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  if exists (select 1 from public.mbt_published_testimonies where id = current_setting('mbt.test_id')::uuid)
    then raise exception 'Témoignage retiré toujours visible'; end if;
end;
$$;
reset role;

rollback;
