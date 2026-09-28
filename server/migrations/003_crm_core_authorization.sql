-- CRM Core standardization: add provider-neutral CRM write scope to browser sessions.
-- The existing rahjo schema remains a legacy storage namespace during the safe cutover.

CREATE OR REPLACE FUNCTION rahjo.authenticate_web_session(p_token_hash text)
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
  csrf_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
BEGIN
  RETURN QUERY
  UPDATE rahjo.web_sessions session
     SET last_seen_at=now()
    FROM rahjo.memberships membership
    JOIN rahjo.workspaces workspace ON workspace.id=membership.workspace_id
    JOIN rahjo.users app_user ON app_user.id=membership.user_id
   WHERE session.token_hash=p_token_hash
     AND session.membership_id=membership.id
     AND session.membership_authz_version=membership.authz_version
     AND session.revoked_at IS NULL
     AND session.expires_at>now()
     AND membership.status='active'
     AND workspace.status='active'
     AND app_user.status='active'
  RETURNING workspace.id,workspace.slug,workspace.name,membership.id,app_user.id,
            app_user.email,app_user.display_name,membership.role,
            CASE membership.role
              WHEN 'viewer' THEN ARRAY['read']::text[]
              WHEN 'intake' THEN ARRAY['read','intake:write']::text[]
              ELSE ARRAY['read','crm:write','intake:write','approval:decide','action:write','action:execute','outcome:write']::text[]
            END,
            session.csrf_hash;
END;
$$;

REVOKE ALL ON FUNCTION rahjo.authenticate_web_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.authenticate_web_session(text) TO rahjo_app;

COMMENT ON SCHEMA rahjo IS 'Legacy storage namespace retained during CRM Core standardization; not a product identity.';
