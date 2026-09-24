-- ════════════════════════════════════════════════════════════════════════
-- MULTI-TENANT : le cabinet devient l'unité d'isolation
--
-- État avant cette migration : toutes les politiques RLS sont
--   USING (auth.uid() = user_id)
-- C'est de l'isolation PAR UTILISATEUR, pas par cabinet. Deux collaborateurs
-- d'une même fiduciaire ne voient rien l'un de l'autre — or l'application
-- gère déjà une équipe (DB.equipe) et assigne les tâches par membre.
--
-- Après : l'isolation se fait par `cabinet_id`. `user_id` est conservé
-- partout, mais change de rôle : il ne protège plus, il attribue (qui a créé
-- la ligne). Ne pas le supprimer — l'application s'en sert pour l'historique.
--
-- ⚠️ MIGRATION DE DONNÉES EXISTANTES. À relire avant application.
--    Exécuter dans une transaction, sur une base sauvegardée.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Le cabinet ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cabinets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  bce         text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE public.cabinet_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.cabinet_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id  uuid NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  role        public.cabinet_role NOT NULL DEFAULT 'member',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cabinet_id, user_id)
);

CREATE INDEX IF NOT EXISTS cabinet_members_user_idx ON public.cabinet_members (user_id);

-- ── 2. Le test d'appartenance ───────────────────────────────────────────
-- SECURITY DEFINER et search_path figé : la fonction doit pouvoir lire
-- cabinet_members sans être elle-même soumise à la RLS de cette table,
-- sinon la politique s'appelle elle-même et la récursion bloque tout.

CREATE OR REPLACE FUNCTION public.is_cabinet_member(_cabinet_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cabinet_members
    WHERE cabinet_id = _cabinet_id AND user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_cabinet_member(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_cabinet_member(uuid) TO authenticated;

-- Cabinet courant de l'utilisateur. Un seul cabinet par personne
-- aujourd'hui ; si l'appartenance multiple arrive, l'application devra
-- passer le cabinet explicitement plutôt que s'appuyer sur ce raccourci.
CREATE OR REPLACE FUNCTION public.current_cabinet_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cabinet_id FROM public.cabinet_members
  WHERE user_id = auth.uid()
  ORDER BY created_at
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.current_cabinet_id() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.current_cabinet_id() TO authenticated;

-- ── 3. La colonne, sur toutes les tables de données ─────────────────────

ALTER TABLE public.clients    ADD COLUMN IF NOT EXISTS cabinet_id uuid REFERENCES public.cabinets(id) ON DELETE CASCADE;
ALTER TABLE public.dirigeants ADD COLUMN IF NOT EXISTS cabinet_id uuid REFERENCES public.cabinets(id) ON DELETE CASCADE;
ALTER TABLE public.fiches     ADD COLUMN IF NOT EXISTS cabinet_id uuid REFERENCES public.cabinets(id) ON DELETE CASCADE;
ALTER TABLE public.invoices   ADD COLUMN IF NOT EXISTS cabinet_id uuid REFERENCES public.cabinets(id) ON DELETE CASCADE;
ALTER TABLE public.app_data   ADD COLUMN IF NOT EXISTS cabinet_id uuid REFERENCES public.cabinets(id) ON DELETE CASCADE;

-- ── 4. Reprise de l'existant ────────────────────────────────────────────
-- Un cabinet par utilisateur déjà inscrit. Le nom vient du profil quand il
-- est renseigné, sinon on le rend identifiable plutôt que « Cabinet ».

INSERT INTO public.cabinets (id, nom)
SELECT gen_random_uuid(),
       COALESCE(NULLIF(btrim(p.cabinet), ''),
                NULLIF(btrim(p.full_name), ''),
                'Cabinet ' || COALESCE(split_part(p.email, '@', 1), left(p.id::text, 8)))
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.cabinet_members m WHERE m.user_id = p.id);

-- Rattachement : on réapparie dans le même ordre de création.
WITH nouveaux AS (
  SELECT p.id AS user_id,
         c.id AS cabinet_id,
         row_number() OVER (ORDER BY p.created_at, p.id) AS rn_user,
         row_number() OVER (ORDER BY c.created_at, c.id) AS rn_cab
  FROM public.profiles p
  CROSS JOIN LATERAL (
    SELECT c.* FROM public.cabinets c
    WHERE NOT EXISTS (SELECT 1 FROM public.cabinet_members m WHERE m.cabinet_id = c.id)
  ) c
)
INSERT INTO public.cabinet_members (cabinet_id, user_id, role)
SELECT DISTINCT ON (user_id) cabinet_id, user_id, 'owner'::public.cabinet_role
FROM nouveaux
WHERE rn_user = rn_cab
ON CONFLICT (cabinet_id, user_id) DO NOTHING;

-- Les lignes de données rejoignent le cabinet de leur créateur.
UPDATE public.clients    t SET cabinet_id = m.cabinet_id FROM public.cabinet_members m WHERE m.user_id = t.user_id AND t.cabinet_id IS NULL;
UPDATE public.dirigeants t SET cabinet_id = m.cabinet_id FROM public.cabinet_members m WHERE m.user_id = t.user_id AND t.cabinet_id IS NULL;
UPDATE public.fiches     t SET cabinet_id = m.cabinet_id FROM public.cabinet_members m WHERE m.user_id = t.user_id AND t.cabinet_id IS NULL;
UPDATE public.invoices   t SET cabinet_id = m.cabinet_id FROM public.cabinet_members m WHERE m.user_id = t.user_id AND t.cabinet_id IS NULL;
UPDATE public.app_data   t SET cabinet_id = m.cabinet_id FROM public.cabinet_members m WHERE m.user_id = t.user_id AND t.cabinet_id IS NULL;

-- Garde-fou : on refuse de continuer s'il reste une ligne orpheline.
-- Mieux vaut une migration qui s'arrête qu'une ligne rendue invisible
-- par la nouvelle RLS.
DO $$
DECLARE n bigint;
BEGIN
  SELECT (SELECT count(*) FROM public.clients    WHERE cabinet_id IS NULL)
       + (SELECT count(*) FROM public.dirigeants WHERE cabinet_id IS NULL)
       + (SELECT count(*) FROM public.fiches     WHERE cabinet_id IS NULL)
       + (SELECT count(*) FROM public.invoices   WHERE cabinet_id IS NULL)
       + (SELECT count(*) FROM public.app_data   WHERE cabinet_id IS NULL)
  INTO n;
  IF n > 0 THEN
    RAISE EXCEPTION 'Migration interrompue : % ligne(s) sans cabinet_id. Ces lignes deviendraient invisibles.', n;
  END IF;
END $$;

ALTER TABLE public.clients    ALTER COLUMN cabinet_id SET NOT NULL;
ALTER TABLE public.dirigeants ALTER COLUMN cabinet_id SET NOT NULL;
ALTER TABLE public.fiches     ALTER COLUMN cabinet_id SET NOT NULL;
ALTER TABLE public.invoices   ALTER COLUMN cabinet_id SET NOT NULL;
ALTER TABLE public.app_data   ALTER COLUMN cabinet_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS clients_cabinet_idx    ON public.clients    (cabinet_id);
CREATE INDEX IF NOT EXISTS dirigeants_cabinet_idx ON public.dirigeants (cabinet_id);
CREATE INDEX IF NOT EXISTS fiches_cabinet_idx     ON public.fiches     (cabinet_id);
CREATE INDEX IF NOT EXISTS invoices_cabinet_idx   ON public.invoices   (cabinet_id);

-- ── 5. app_data : la clé devient le cabinet ─────────────────────────────
-- Cette table est le magasin JSON de l'application HTML. Tant qu'elle est
-- unique par (user_id, section, key), deux collaborateurs du même cabinet
-- tiennent deux bases séparées.

ALTER TABLE public.app_data DROP CONSTRAINT IF EXISTS app_data_user_id_section_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS app_data_cabinet_section_key_idx
  ON public.app_data (cabinet_id, section, key);

-- Écriture concurrente : deux postes du même cabinet peuvent sauvegarder en
-- même temps. Sans compteur, le dernier écrase l'autre en silence.
ALTER TABLE public.app_data ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 1;
ALTER TABLE public.app_data ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 6. Les politiques ───────────────────────────────────────────────────

ALTER TABLE public.cabinets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinet_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE         ON public.cabinets        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabinet_members TO authenticated;
GRANT ALL ON public.cabinets, public.cabinet_members TO service_role;

DROP POLICY IF EXISTS "cabinet lisible par ses membres"   ON public.cabinets;
CREATE POLICY "cabinet lisible par ses membres" ON public.cabinets
  FOR SELECT TO authenticated USING (public.is_cabinet_member(id));

DROP POLICY IF EXISTS "cabinet modifiable par ses membres" ON public.cabinets;
CREATE POLICY "cabinet modifiable par ses membres" ON public.cabinets
  FOR UPDATE TO authenticated USING (public.is_cabinet_member(id)) WITH CHECK (public.is_cabinet_member(id));

-- Un utilisateur voit la composition de son cabinet, et rien d'autre.
DROP POLICY IF EXISTS "membres visibles entre eux" ON public.cabinet_members;
CREATE POLICY "membres visibles entre eux" ON public.cabinet_members
  FOR SELECT TO authenticated USING (public.is_cabinet_member(cabinet_id));

-- Seul un owner ajoute ou retire quelqu'un. Volontairement restrictif :
-- une invitation en bonne et due forme viendra plus tard, côté serveur.
DROP POLICY IF EXISTS "owner gere les membres" ON public.cabinet_members;
CREATE POLICY "owner gere les membres" ON public.cabinet_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cabinet_members m
    WHERE m.cabinet_id = cabinet_members.cabinet_id
      AND m.user_id = auth.uid() AND m.role = 'owner'))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cabinet_members m
    WHERE m.cabinet_id = cabinet_members.cabinet_id
      AND m.user_id = auth.uid() AND m.role = 'owner'));

-- Les tables de données : on remplace l'isolation par utilisateur.
DROP POLICY IF EXISTS "own clients all"    ON public.clients;
DROP POLICY IF EXISTS "own dirigeants all" ON public.dirigeants;
DROP POLICY IF EXISTS "own fiches all"     ON public.fiches;
DROP POLICY IF EXISTS "own app_data all"   ON public.app_data;
DROP POLICY IF EXISTS "Users manage their own invoices" ON public.invoices;

CREATE POLICY "clients du cabinet" ON public.clients
  FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE POLICY "dirigeants du cabinet" ON public.dirigeants
  FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE POLICY "fiches du cabinet" ON public.fiches
  FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE POLICY "factures du cabinet" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE POLICY "app_data du cabinet" ON public.app_data
  FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ── 7. Tout nouvel inscrit obtient son cabinet ──────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_cabinet()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _cab uuid;
BEGIN
  INSERT INTO public.cabinets (nom)
  VALUES (COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'cabinet'), ''),
                   NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
                   'Cabinet ' || split_part(NEW.email, '@', 1)))
  RETURNING id INTO _cab;

  INSERT INTO public.cabinet_members (cabinet_id, user_id, role)
  VALUES (_cab, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_cabinet() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_cabinet ON auth.users;
CREATE TRIGGER on_auth_user_created_cabinet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_cabinet();

CREATE TRIGGER cabinets_set_updated BEFORE UPDATE ON public.cabinets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- À VÉRIFIER APRÈS APPLICATION — aucune de ces requêtes ne doit rien rendre
-- d'inattendu :
--
--   SELECT count(*) FROM public.cabinets;         -- 1 par utilisateur existant
--   SELECT count(*) FROM public.cabinet_members;  -- idem, tous 'owner'
--   SELECT count(*) FROM public.clients WHERE cabinet_id IS NULL;  -- 0
--
-- Puis, connecté en tant qu'utilisateur, vérifier que `select * from clients`
-- rend toujours le même nombre de lignes qu'avant la migration. Une RLS trop
-- stricte ne renvoie pas d'erreur : elle renvoie zéro ligne.
-- ════════════════════════════════════════════════════════════════════════
