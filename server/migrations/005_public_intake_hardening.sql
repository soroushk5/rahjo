-- Defense in depth for the private public-intake route table.

CREATE INDEX IF NOT EXISTS public_intake_routes_membership_idx
  ON rahjo.public_intake_routes(workspace_id, membership_id);

CREATE INDEX IF NOT EXISTS public_intake_routes_service_idx
  ON rahjo.public_intake_routes(workspace_id, service_id);

DROP POLICY IF EXISTS public_intake_routes_runtime_deny ON rahjo.public_intake_routes;
CREATE POLICY public_intake_routes_runtime_deny
  ON rahjo.public_intake_routes
  AS RESTRICTIVE
  FOR ALL
  TO rahjo_app, rahjo_worker
  USING (false)
  WITH CHECK (false);
