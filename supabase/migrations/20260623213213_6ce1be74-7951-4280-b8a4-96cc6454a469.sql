
-- Fix 1: Remove hardcoded admin email from the handle_admin_signup function.
-- Read the admin email from a Postgres setting (app.admin_email) instead of a literal.
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _admin_email text := current_setting('app.admin_email', true);
BEGIN
  IF _admin_email IS NOT NULL AND _admin_email <> '' AND NEW.email = _admin_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix 2: Remove user-owned tables from the Realtime publication so authenticated
-- users cannot subscribe to other users' data change streams. The application
-- does not rely on Realtime for these tables; reads happen via authenticated
-- server functions enforcing RLS.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.clients;
    EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.dirigeants;
    EXCEPTION WHEN undefined_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.fiches;
    EXCEPTION WHEN undefined_object THEN NULL; END;
  END IF;
END $$;
