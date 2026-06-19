-- 1. Lock down user_roles: no client INSERT/UPDATE/DELETE
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;

CREATE POLICY "no client write user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no client update user_roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no client delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (false);

-- 2. Lock down audit_logs: clients cannot insert directly
DROP POLICY IF EXISTS "authenticated insert own audit" ON public.audit_logs;
REVOKE INSERT ON public.audit_logs FROM authenticated, anon;

-- 3. SECURITY DEFINER function that only writes audit entries for real admins
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _resource_type text DEFAULT NULL,
  _resource_id text DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, resource_type, resource_id, details)
  VALUES (_uid, _email, _action, _resource_type, _resource_id, COALESCE(_details, '{}'::jsonb));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;