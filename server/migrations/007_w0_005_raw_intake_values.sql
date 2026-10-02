CREATE TABLE IF NOT EXISTS rahjo.intake_raw_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  intake_request_id uuid NOT NULL,
  captured_by uuid NOT NULL,
  raw_values jsonb NOT NULL CHECK (jsonb_typeof(raw_values) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  retention_until timestamptz,
  UNIQUE (workspace_id, intake_request_id),
  FOREIGN KEY (workspace_id, intake_request_id)
    REFERENCES rahjo.intake_requests(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, captured_by)
    REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT,
  CHECK (retention_until IS NULL OR retention_until >= created_at)
);

ALTER TABLE rahjo.intake_raw_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.intake_raw_values FORCE ROW LEVEL SECURITY;

CREATE POLICY intake_raw_values_app_insert
  ON rahjo.intake_raw_values
  FOR INSERT TO rahjo_app
  WITH CHECK (
    workspace_id = rahjo.current_workspace_id()
    AND captured_by = nullif(current_setting('rahjo.membership_id', true), '')::uuid
  );

CREATE POLICY intake_raw_values_worker_read
  ON rahjo.intake_raw_values
  FOR SELECT TO rahjo_worker
  USING (workspace_id = rahjo.current_workspace_id());

CREATE POLICY intake_raw_values_worker_delete
  ON rahjo.intake_raw_values
  FOR DELETE TO rahjo_worker
  USING (workspace_id = rahjo.current_workspace_id());

REVOKE ALL ON rahjo.intake_raw_values FROM PUBLIC, rahjo_app, rahjo_worker;
GRANT INSERT ON rahjo.intake_raw_values TO rahjo_app;
GRANT SELECT, DELETE ON rahjo.intake_raw_values TO rahjo_worker;

COMMENT ON TABLE rahjo.intake_raw_values IS
  'Restricted raw intake values for audit/debug. The runtime role can insert only; normal APIs do not read this table.';

CREATE INDEX IF NOT EXISTS intake_raw_values_retention_idx
  ON rahjo.intake_raw_values(retention_until)
  WHERE retention_until IS NOT NULL;
