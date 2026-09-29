-- CRM Core email-first login and recovery.
-- Resolve a credential only when the email has exactly one active workspace
-- membership. Multi-workspace identities fail closed and can use a future
-- explicit workspace selector without weakening tenant isolation.

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

CREATE OR REPLACE FUNCTION rahjo.consume_account_recovery_code_by_email(
  p_email text,
  p_code_hash text,
  p_password_salt text,
  p_password_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_code rahjo.account_recovery_codes%ROWTYPE;
  v_user_id uuid;
  v_matches integer;
BEGIN
  IF p_code_hash !~ '^[a-f0-9]{64}$'
     OR p_password_salt !~ '^[a-f0-9]{32}$'
     OR p_password_hash !~ '^[a-f0-9]{128}$' THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_matches
    FROM rahjo.account_recovery_codes c
    JOIN rahjo.memberships m ON m.id=c.membership_id AND m.workspace_id=c.workspace_id
    JOIN rahjo.workspaces w ON w.id=m.workspace_id
    JOIN rahjo.users u ON u.id=m.user_id
   WHERE u.email=p_email
     AND w.status='active' AND m.status='active' AND u.status='active'
     AND c.code_hash=p_code_hash AND c.used_at IS NULL AND c.revoked_at IS NULL AND c.expires_at>now();

  IF v_matches <> 1 THEN RETURN NULL; END IF;

  SELECT c.* INTO v_code
    FROM rahjo.account_recovery_codes c
    JOIN rahjo.memberships m ON m.id=c.membership_id AND m.workspace_id=c.workspace_id
    JOIN rahjo.workspaces w ON w.id=m.workspace_id
    JOIN rahjo.users u ON u.id=m.user_id
   WHERE u.email=p_email
     AND w.status='active' AND m.status='active' AND u.status='active'
     AND c.code_hash=p_code_hash AND c.used_at IS NULL AND c.revoked_at IS NULL AND c.expires_at>now()
   FOR UPDATE OF c;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT user_id INTO v_user_id FROM rahjo.memberships WHERE id=v_code.membership_id;
  UPDATE rahjo.password_credentials
     SET password_salt=p_password_salt,password_hash=p_password_hash,changed_at=now()
   WHERE user_id=v_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE rahjo.memberships
     SET authz_version=authz_version+1,updated_at=now()
   WHERE user_id=v_user_id AND status='active';

  UPDATE rahjo.web_sessions s
     SET revoked_at=COALESCE(s.revoked_at,now())
   WHERE s.membership_id IN (SELECT id FROM rahjo.memberships WHERE user_id=v_user_id)
     AND s.revoked_at IS NULL;

  UPDATE rahjo.account_recovery_codes SET used_at=now() WHERE id=v_code.id;
  RETURN v_code.membership_id;
END;
$$;

REVOKE ALL ON FUNCTION rahjo.lookup_password_login_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION rahjo.consume_account_recovery_code_by_email(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.lookup_password_login_by_email(text) TO rahjo_app;
GRANT EXECUTE ON FUNCTION rahjo.consume_account_recovery_code_by_email(text,text,text,text) TO rahjo_app;
