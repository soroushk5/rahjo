-- CRM Core email-first browser login.
-- Resolve a password credential only when the email has exactly one active
-- workspace membership. Multi-workspace identities fail closed and can use a
-- future explicit workspace selector without weakening tenant isolation.

CREATE OR REPLACE FUNCTION rahjo.lookup_password_login_by_email(p_email text)
RETURNS TABLE (
  membership_id uuid,
  password_salt text,
  password_hash text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
  WITH candidates AS (
    SELECT membership.id AS membership_id,
           credential.password_salt,
           credential.password_hash,
           count(*) OVER () AS candidate_count
      FROM rahjo.memberships membership
      JOIN rahjo.workspaces workspace ON workspace.id=membership.workspace_id
      JOIN rahjo.users app_user ON app_user.id=membership.user_id
      JOIN rahjo.password_credentials credential ON credential.user_id=app_user.id
     WHERE app_user.email=p_email
       AND workspace.status='active'
       AND membership.status='active'
       AND app_user.status='active'
  )
  SELECT membership_id,password_salt,password_hash
    FROM candidates
   WHERE candidate_count=1
$$;

REVOKE ALL ON FUNCTION rahjo.lookup_password_login_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.lookup_password_login_by_email(text) TO rahjo_app;
