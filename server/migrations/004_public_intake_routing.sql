-- CRM Core public intake routing without a browser/runtime intake secret.
-- The public HTTP route remains origin-allowlisted and rate limited in the BFF.
-- This table is private; the runtime role can only resolve one exact origin through
-- the SECURITY DEFINER function below. No direct table grant is given.

CREATE TABLE IF NOT EXISTS rahjo.public_intake_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL UNIQUE
    CHECK (origin ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'),
  workspace_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  service_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, membership_id)
    REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, service_id)
    REFERENCES rahjo.services(workspace_id, id) ON DELETE RESTRICT
);

ALTER TABLE rahjo.public_intake_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.public_intake_routes FORCE ROW LEVEL SECURITY;

REVOKE ALL ON rahjo.public_intake_routes FROM PUBLIC;
REVOKE ALL ON rahjo.public_intake_routes FROM rahjo_app;
REVOKE ALL ON rahjo.public_intake_routes FROM rahjo_worker;

CREATE OR REPLACE FUNCTION rahjo.resolve_public_intake(p_origin text)
RETURNS TABLE (
  workspace_id uuid,
  workspace_slug text,
  workspace_name text,
  membership_id uuid,
  user_id uuid,
  user_email text,
  display_name text,
  role text,
  scopes text[],
  service_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
  SELECT workspace.id,
         workspace.slug,
         workspace.name,
         membership.id,
         app_user.id,
         app_user.email,
         app_user.display_name,
         membership.role,
         ARRAY['intake:write']::text[],
         service.public_id
    FROM rahjo.public_intake_routes route
    JOIN rahjo.workspaces workspace
      ON workspace.id = route.workspace_id
    JOIN rahjo.memberships membership
      ON membership.workspace_id = route.workspace_id
     AND membership.id = route.membership_id
    JOIN rahjo.users app_user
      ON app_user.id = membership.user_id
    JOIN rahjo.services service
      ON service.workspace_id = route.workspace_id
     AND service.id = route.service_id
   WHERE route.origin = p_origin
     AND route.enabled = true
     AND workspace.status = 'active'
     AND membership.status = 'active'
     AND membership.role = 'intake'
     AND app_user.status = 'active'
   LIMIT 1
$$;

REVOKE ALL ON FUNCTION rahjo.resolve_public_intake(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.resolve_public_intake(text) TO rahjo_app;
