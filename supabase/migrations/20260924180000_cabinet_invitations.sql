-- ════════════════════════════════════════════════════════════════════════
-- INVITER UN COLLABORATEUR
--
-- Complète 20260924140000_cabinets_multi_tenant.sql. Dépend d'elle :
-- à appliquer après, jamais avant.
--
-- Le problème : depuis le navigateur, l'application n'a que la clé publique.
-- Elle ne peut pas créer un compte pour quelqu'un d'autre — seule la clé de
-- service le pourrait, et elle n'a rien à faire côté client.
--
-- La solution : on n'invite pas un compte, on invite une ADRESSE. L'invitation
-- attend dans une table ; quand la personne s'inscrit avec cette adresse, le
-- déclencheur de création de compte la rattache au cabinet qui l'attendait,
-- avec le rôle prévu, au lieu de lui fabriquer un cabinet à elle.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.cabinet_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id   uuid NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         public.cabinet_role NOT NULL DEFAULT 'collaborateur',
  invited_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  accepted_at  timestamptz,
  UNIQUE (cabinet_id, email)
);

-- L'adresse est comparée en minuscules : « Jean@X.be » et « jean@x.be » sont
-- la même personne, et une invitation manquée est une invitation invisible.
CREATE INDEX IF NOT EXISTS cabinet_invitations_email_idx
  ON public.cabinet_invitations (lower(email)) WHERE accepted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cabinet_invitations TO authenticated;
GRANT ALL ON public.cabinet_invitations TO service_role;
ALTER TABLE public.cabinet_invitations ENABLE ROW LEVEL SECURITY;

-- Les membres voient les invitations en cours de leur cabinet…
DROP POLICY IF EXISTS "invitations visibles par le cabinet" ON public.cabinet_invitations;
CREATE POLICY "invitations visibles par le cabinet" ON public.cabinet_invitations
  FOR SELECT TO authenticated USING (public.is_cabinet_member(cabinet_id));

-- …mais seul un owner invite ou retire.
DROP POLICY IF EXISTS "owner gere les invitations" ON public.cabinet_invitations;
CREATE POLICY "owner gere les invitations" ON public.cabinet_invitations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cabinet_members m
                 WHERE m.cabinet_id = cabinet_invitations.cabinet_id
                   AND m.user_id = auth.uid() AND m.role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cabinet_members m
                 WHERE m.cabinet_id = cabinet_invitations.cabinet_id
                   AND m.user_id = auth.uid() AND m.role = 'owner'));

-- ── Le rattachement à l'inscription ─────────────────────────────────────
-- Remplace handle_new_cabinet() : on regarde d'abord s'il existe une
-- invitation pour cette adresse. Sinon seulement, on crée un cabinet.

CREATE OR REPLACE FUNCTION public.handle_new_cabinet()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _inv public.cabinet_invitations%ROWTYPE;
  _cab uuid;
BEGIN
  SELECT * INTO _inv
  FROM public.cabinet_invitations
  WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL
  ORDER BY created_at
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.cabinet_members (cabinet_id, user_id, role)
    VALUES (_inv.cabinet_id, NEW.id, _inv.role)
    ON CONFLICT (cabinet_id, user_id) DO NOTHING;

    UPDATE public.cabinet_invitations SET accepted_at = now() WHERE id = _inv.id;
    RETURN NEW;
  END IF;

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

-- Un cabinet doit toujours garder au moins un owner : sans ça, personne ne
-- peut plus inviter ni retirer, et le cabinet se verrouille tout seul.
CREATE OR REPLACE FUNCTION public.garder_un_owner()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _restants int;
BEGIN
  SELECT count(*) INTO _restants
  FROM public.cabinet_members
  WHERE cabinet_id = COALESCE(OLD.cabinet_id, NEW.cabinet_id)
    AND role = 'owner'
    AND id <> OLD.id;

  IF _restants = 0 THEN
    RAISE EXCEPTION 'Ce cabinet doit garder au moins un administrateur.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS cabinet_members_garder_owner ON public.cabinet_members;
CREATE TRIGGER cabinet_members_garder_owner
  BEFORE DELETE OR UPDATE OF role ON public.cabinet_members
  FOR EACH ROW WHEN (OLD.role = 'owner')
  EXECUTE FUNCTION public.garder_un_owner();

COMMIT;
