-- Approved owner policy: raw CRM/intake values expire 30 days after creation.
UPDATE rahjo.intake_raw_values
   SET retention_until = created_at + interval '30 days'
 WHERE retention_until IS DISTINCT FROM created_at + interval '30 days';

UPDATE rahjo.crm_restricted_raw_values
   SET retention_until = created_at + interval '30 days'
 WHERE retention_until IS DISTINCT FROM created_at + interval '30 days';

ALTER TABLE rahjo.intake_raw_values
  ALTER COLUMN retention_until SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN retention_until SET NOT NULL;
ALTER TABLE rahjo.crm_restricted_raw_values
  ALTER COLUMN retention_until SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN retention_until SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'intake_raw_values_exact_30_day_retention'
       AND conrelid = 'rahjo.intake_raw_values'::regclass
  ) THEN
    ALTER TABLE rahjo.intake_raw_values
      ADD CONSTRAINT intake_raw_values_exact_30_day_retention
      CHECK (retention_until = created_at + interval '30 days');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'crm_restricted_raw_values_exact_30_day_retention'
       AND conrelid = 'rahjo.crm_restricted_raw_values'::regclass
  ) THEN
    ALTER TABLE rahjo.crm_restricted_raw_values
      ADD CONSTRAINT crm_restricted_raw_values_exact_30_day_retention
      CHECK (retention_until = created_at + interval '30 days');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION rahjo.cleanup_expired_raw_values(
  p_workspace_id uuid,
  p_batch_size integer DEFAULT 1000
)
RETURNS TABLE (intake_deleted integer, crm_deleted integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_workspace_setting text;
BEGIN
  IF current_user <> 'rahjo_worker' THEN
    RAISE EXCEPTION 'raw cleanup requires the worker role' USING ERRCODE = '42501';
  END IF;
  v_workspace_setting := nullif(current_setting('rahjo.workspace_id', true), '');
  IF p_workspace_id IS NULL OR v_workspace_setting IS DISTINCT FROM p_workspace_id::text THEN
    RAISE EXCEPTION 'raw cleanup workspace context mismatch' USING ERRCODE = '42501';
  END IF;
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 5000 THEN
    RAISE EXCEPTION 'raw cleanup batch size is invalid' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_workspace_id::text, 0));

  WITH expired AS (
    SELECT id
      FROM rahjo.intake_raw_values
     WHERE workspace_id = p_workspace_id
       AND retention_until <= now()
     ORDER BY retention_until, id
     LIMIT p_batch_size
  )
  DELETE FROM rahjo.intake_raw_values AS raw
   USING expired
   WHERE raw.id = expired.id
     AND raw.workspace_id = p_workspace_id;
  GET DIAGNOSTICS intake_deleted = ROW_COUNT;

  WITH expired AS (
    SELECT id
      FROM rahjo.crm_restricted_raw_values
     WHERE workspace_id = p_workspace_id
       AND retention_until <= now()
     ORDER BY retention_until, id
     LIMIT p_batch_size
  )
  DELETE FROM rahjo.crm_restricted_raw_values AS raw
   USING expired
   WHERE raw.id = expired.id
     AND raw.workspace_id = p_workspace_id;
  GET DIAGNOSTICS crm_deleted = ROW_COUNT;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION rahjo.cleanup_expired_raw_values(uuid, integer) FROM PUBLIC, rahjo_app, rahjo_worker;
GRANT EXECUTE ON FUNCTION rahjo.cleanup_expired_raw_values(uuid, integer) TO rahjo_worker;

COMMENT ON FUNCTION rahjo.cleanup_expired_raw_values(uuid, integer) IS
  'Idempotently deletes expired raw values for the current worker workspace only; canonical CRM and intake rows are not deleted.';
