-- MBT — schéma PostgreSQL du backend FUTUR (conçu, non déployé).
-- Usage : soumission privée de témoignages + modération humaine avant publication.
-- Aucune donnée d'identification directe n'est requise pour soumettre.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE testimony_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE moderator_role AS ENUM ('moderator', 'admin');

-- Comptes de modération nominatifs (jamais de compte partagé, MFA obligatoire côté authentification)
CREATE TABLE moderators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  role          moderator_role NOT NULL DEFAULT 'moderator',
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Témoignages soumis : PRIVÉS tant que status <> 'approved'
CREATE TABLE testimonies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status           testimony_status NOT NULL DEFAULT 'pending',
  age_band         text CHECK (age_band IN ('primaire', 'college', 'lycee', 'adulte', 'parent')),
  title            text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body             text NOT NULL CHECK (char_length(body) BETWEEN 50 AND 4000),
  -- Version anonymisée relue par la modération (prénoms, lieux, établissements retirés)
  published_body   text,
  -- Jeton aléatoire remis au déposant pour retirer son témoignage (stocké haché)
  withdrawal_hash  text NOT NULL,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  decided_at       timestamptz,
  CONSTRAINT published_requires_review CHECK (status <> 'approved' OR published_body IS NOT NULL)
);
CREATE INDEX testimonies_status_idx ON testimonies (status, submitted_at);

-- Double validation : une publication nécessite deux décisions « approve » de modérateurs différents
CREATE TABLE moderation_decisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id  uuid NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
  moderator_id  uuid NOT NULL REFERENCES moderators(id),
  decision      text NOT NULL CHECK (decision IN ('approve', 'reject', 'needs_edit')),
  reason        text,
  decided_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (testimony_id, moderator_id)
);

-- Journal d'audit technique : JAMAIS le contenu des témoignages
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor_id    uuid REFERENCES moderators(id),
  action      text NOT NULL,
  target_id   uuid,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Vue publique : seules les données publiées, anonymisées
CREATE VIEW public_testimonies AS
  SELECT id, age_band, title, published_body AS body, decided_at AS published_at
  FROM testimonies
  WHERE status = 'approved';

-- Rétention : les témoignages refusés ou retirés sont supprimés après 30 jours (tâche planifiée)
-- DELETE FROM testimonies WHERE status IN ('rejected','withdrawn') AND decided_at < now() - interval '30 days';
