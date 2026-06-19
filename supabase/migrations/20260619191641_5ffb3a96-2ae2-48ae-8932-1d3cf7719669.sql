
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS local_id text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS clients_user_local_id_uniq ON public.clients(user_id, local_id) WHERE local_id IS NOT NULL;

ALTER TABLE public.dirigeants ADD COLUMN IF NOT EXISTS local_id text;
ALTER TABLE public.dirigeants ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS dirigeants_user_local_id_uniq ON public.dirigeants(user_id, local_id) WHERE local_id IS NOT NULL;

ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS local_id text;
ALTER TABLE public.fiches ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS fiches_user_local_id_uniq ON public.fiches(user_id, local_id) WHERE local_id IS NOT NULL;
