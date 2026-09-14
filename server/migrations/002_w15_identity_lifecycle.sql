CREATE TABLE IF NOT EXISTS rahjo.member_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(email)),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 160),
  role text NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, invited_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS member_invitations_one_active_email
  ON rahjo.member_invitations(workspace_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS member_invitations_token_idx ON rahjo.member_invitations(token_hash);

CREATE TABLE IF NOT EXISTS rahjo.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  issued_by uuid,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, issued_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON rahjo.password_reset_tokens(token_hash);

CREATE TABLE IF NOT EXISTS rahjo.account_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL,
  code_hash text NOT NULL UNIQUE CHECK (code_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_recovery_codes_member_idx
  ON rahjo.account_recovery_codes(workspace_id, membership_id, created_at DESC);

CREATE OR REPLACE FUNCTION rahjo.create_member_invitation(
  p_workspace_id uuid,
  p_invited_by uuid,
  p_email text,
  p_display_name text,
  p_role text,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS TABLE(invitation_id uuid, invitation_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_role text;
  v_id uuid;
BEGIN
  SELECT m.role INTO v_role
    FROM rahjo.memberships m
    JOIN rahjo.workspaces w ON w.id = m.workspace_id
   WHERE m.id = p_invited_by
     AND m.workspace_id = p_workspace_id
     AND m.status = 'active'
     AND w.status = 'active';

  IF v_role IS NULL OR v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'inviter is not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NULL OR lower(p_email) <> p_email OR position('@' in p_email) < 2 THEN
    RAISE EXCEPTION 'invalid email' USING ERRCODE = '22023';
  END IF;
  IF p_display_name IS NULL OR length(p_display_name) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'invalid display name' USING ERRCODE = '22023';
  END IF;
  IF p_role NOT IN ('admin', 'operator', 'viewer') THEN
    RAISE EXCEPTION 'invalid invitation role' USING ERRCODE = '22023';
  END IF;
  IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'invalid invitation token' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM rahjo.users u
    JOIN rahjo.memberships m ON m.user_id = u.id
    WHERE m.workspace_id = p_workspace_id AND u.email = p_email AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'member already exists' USING ERRCODE = '23505';
  END IF;

  UPDATE rahjo.member_invitations
     SET revoked_at = now()
   WHERE workspace_id = p_workspace_id
     AND email = p_email
     AND accepted_at IS NULL
     AND revoked_at IS NULL;

  INSERT INTO rahjo.member_invitations(workspace_id,email,display_name,role,token_hash,invited_by,expires_at)
  VALUES(p_workspace_id,p_email,p_display_name,p_role,p_token_hash,p_invited_by,p_expires_at)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, p_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.consume_member_invitation(
  p_token_hash text,
  p_password_salt text,
  p_password_hash text
)
RETURNS TABLE(
  workspace_id uuid,
  workspace_slug text,
  workspace_name text,
  membership_id uuid,
  user_id uuid,
  user_email text,
  display_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_invitation rahjo.member_invitations%ROWTYPE;
  v_user_id uuid;
  v_membership_id uuid;
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$'
     OR p_password_salt !~ '^[a-f0-9]{32}$'
     OR p_password_hash !~ '^[a-f0-9]{128}$' THEN
    RETURN;
  END IF;

  SELECT * INTO v_invitation
    FROM rahjo.member_invitations
   WHERE token_hash = p_token_hash
     AND accepted_at IS NULL
     AND revoked_at IS NULL
     AND expires_at > now()
   FOR UPDATE;

  IF NOT FOUND THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM rahjo.users WHERE email = v_invitation.email) THEN
    RETURN;
  END IF;

  INSERT INTO rahjo.users(email,display_name)
  VALUES(v_invitation.email,v_invitation.display_name)
  RETURNING id INTO v_user_id;

  INSERT INTO rahjo.memberships(workspace_id,user_id,role,status)
  VALUES(v_invitation.workspace_id,v_user_id,v_invitation.role,'active')
  RETURNING id INTO v_membership_id;

  INSERT INTO rahjo.password_credentials(user_id,password_salt,password_hash)
  VALUES(v_user_id,p_password_salt,p_password_hash);

  UPDATE rahjo.member_invitations SET accepted_at = now() WHERE id = v_invitation.id;

  RETURN QUERY
  SELECT w.id,w.slug,w.name,m.id,u.id,u.email,u.display_name,m.role
    FROM rahjo.workspaces w
    JOIN rahjo.memberships m ON m.workspace_id = w.id
    JOIN rahjo.users u ON u.id = m.user_id
   WHERE m.id = v_membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.list_workspace_members(
  p_workspace_id uuid,
  p_requester_membership_id uuid
)
RETURNS TABLE(
  membership_id uuid,
  email text,
  display_name text,
  role text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE v_role text;
BEGIN
  SELECT m.role INTO v_role
    FROM rahjo.memberships m
    JOIN rahjo.workspaces w ON w.id=m.workspace_id
   WHERE m.id=p_requester_membership_id AND m.workspace_id=p_workspace_id
     AND m.status='active' AND w.status='active';
  IF v_role IS NULL OR v_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'member list is not allowed' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
    SELECT m.id,u.email,u.display_name,m.role,m.status,m.created_at
      FROM rahjo.memberships m
      JOIN rahjo.users u ON u.id=m.user_id
     WHERE m.workspace_id=p_workspace_id
     ORDER BY m.created_at,u.email;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.create_password_reset_token(
  p_workspace_id uuid,
  p_membership_id uuid,
  p_issued_by uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM rahjo.memberships
   WHERE id=p_issued_by AND workspace_id=p_workspace_id AND status='active';
  IF v_role IS NULL OR v_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'reset link is not allowed' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM rahjo.memberships WHERE id=p_membership_id AND workspace_id=p_workspace_id AND status='active') THEN
    RETURN false;
  END IF;
  IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_expires_at <= now() THEN RETURN false; END IF;

  UPDATE rahjo.password_reset_tokens SET revoked_at=now()
   WHERE workspace_id=p_workspace_id AND membership_id=p_membership_id
     AND used_at IS NULL AND revoked_at IS NULL;

  INSERT INTO rahjo.password_reset_tokens(workspace_id,membership_id,token_hash,issued_by,expires_at)
  VALUES(p_workspace_id,p_membership_id,p_token_hash,p_issued_by,p_expires_at);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.consume_password_reset_token(
  p_token_hash text,
  p_password_salt text,
  p_password_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_token rahjo.password_reset_tokens%ROWTYPE;
  v_user_id uuid;
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$'
     OR p_password_salt !~ '^[a-f0-9]{32}$'
     OR p_password_hash !~ '^[a-f0-9]{128}$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_token FROM rahjo.password_reset_tokens
   WHERE token_hash=p_token_hash AND used_at IS NULL AND revoked_at IS NULL AND expires_at>now()
   FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT user_id INTO v_user_id FROM rahjo.memberships
   WHERE id=v_token.membership_id AND workspace_id=v_token.workspace_id AND status='active';
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  UPDATE rahjo.password_credentials
     SET password_salt=p_password_salt,password_hash=p_password_hash,changed_at=now()
   WHERE user_id=v_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  UPDATE rahjo.memberships SET authz_version=authz_version+1,updated_at=now()
   WHERE user_id=v_user_id AND status='active';
  UPDATE rahjo.web_sessions s SET revoked_at=COALESCE(s.revoked_at,now())
   WHERE s.membership_id IN (SELECT id FROM rahjo.memberships WHERE user_id=v_user_id)
     AND s.revoked_at IS NULL;
  UPDATE rahjo.password_reset_tokens SET used_at=now() WHERE id=v_token.id;
  RETURN v_token.membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.set_password_credential(
  p_workspace_id uuid,
  p_membership_id uuid,
  p_password_salt text,
  p_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE v_user_id uuid;
BEGIN
  IF p_password_salt !~ '^[a-f0-9]{32}$' OR p_password_hash !~ '^[a-f0-9]{128}$' THEN RETURN false; END IF;
  SELECT user_id INTO v_user_id FROM rahjo.memberships
   WHERE id=p_membership_id AND workspace_id=p_workspace_id AND status='active';
  IF v_user_id IS NULL THEN RETURN false; END IF;
  UPDATE rahjo.password_credentials
     SET password_salt=p_password_salt,password_hash=p_password_hash,changed_at=now()
   WHERE user_id=v_user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE rahjo.memberships SET authz_version=authz_version+1,updated_at=now()
   WHERE user_id=v_user_id AND status='active';
  UPDATE rahjo.web_sessions s SET revoked_at=COALESCE(s.revoked_at,now())
   WHERE s.membership_id IN (SELECT id FROM rahjo.memberships WHERE user_id=v_user_id)
     AND s.revoked_at IS NULL;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.replace_account_recovery_codes(
  p_workspace_id uuid,
  p_membership_id uuid,
  p_code_hashes text[],
  p_expires_at timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  v_hash text;
  v_count integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rahjo.memberships WHERE id=p_membership_id AND workspace_id=p_workspace_id AND status='active') THEN
    RETURN 0;
  END IF;
  IF p_expires_at <= now() OR array_length(p_code_hashes,1) IS NULL OR array_length(p_code_hashes,1) > 12 THEN RETURN 0; END IF;

  UPDATE rahjo.account_recovery_codes SET revoked_at=now()
   WHERE workspace_id=p_workspace_id AND membership_id=p_membership_id
     AND used_at IS NULL AND revoked_at IS NULL;

  FOREACH v_hash IN ARRAY p_code_hashes LOOP
    IF v_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid recovery hash' USING ERRCODE='22023'; END IF;
    INSERT INTO rahjo.account_recovery_codes(workspace_id,membership_id,code_hash,expires_at)
    VALUES(p_workspace_id,p_membership_id,v_hash,p_expires_at);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.consume_account_recovery_code(
  p_workspace_slug text,
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
BEGIN
  IF p_code_hash !~ '^[a-f0-9]{64}$'
     OR p_password_salt !~ '^[a-f0-9]{32}$'
     OR p_password_hash !~ '^[a-f0-9]{128}$' THEN RETURN NULL; END IF;

  SELECT c.* INTO v_code
    FROM rahjo.account_recovery_codes c
    JOIN rahjo.memberships m ON m.id=c.membership_id AND m.workspace_id=c.workspace_id
    JOIN rahjo.workspaces w ON w.id=m.workspace_id
    JOIN rahjo.users u ON u.id=m.user_id
   WHERE w.slug=p_workspace_slug AND u.email=p_email
     AND w.status='active' AND m.status='active' AND u.status='active'
     AND c.code_hash=p_code_hash AND c.used_at IS NULL AND c.revoked_at IS NULL AND c.expires_at>now()
   FOR UPDATE OF c;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT user_id INTO v_user_id FROM rahjo.memberships WHERE id=v_code.membership_id;
  UPDATE rahjo.password_credentials SET password_salt=p_password_salt,password_hash=p_password_hash,changed_at=now()
   WHERE user_id=v_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE rahjo.memberships SET authz_version=authz_version+1,updated_at=now()
   WHERE user_id=v_user_id AND status='active';
  UPDATE rahjo.web_sessions s SET revoked_at=COALESCE(s.revoked_at,now())
   WHERE s.membership_id IN (SELECT id FROM rahjo.memberships WHERE user_id=v_user_id)
     AND s.revoked_at IS NULL;
  UPDATE rahjo.account_recovery_codes SET used_at=now() WHERE id=v_code.id;
  RETURN v_code.membership_id;
END;
$$;

ALTER TABLE rahjo.member_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.member_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE rahjo.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.password_reset_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE rahjo.account_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.account_recovery_codes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_role_access ON rahjo.member_invitations;
DROP POLICY IF EXISTS workspace_isolation ON rahjo.member_invitations;
CREATE POLICY workspace_role_access ON rahjo.member_invitations AS PERMISSIVE FOR ALL TO rahjo_app USING (true) WITH CHECK (true);
CREATE POLICY workspace_isolation ON rahjo.member_invitations AS RESTRICTIVE FOR ALL TO rahjo_app USING (workspace_id=rahjo.current_workspace_id()) WITH CHECK (workspace_id=rahjo.current_workspace_id());

DROP POLICY IF EXISTS workspace_role_access ON rahjo.password_reset_tokens;
DROP POLICY IF EXISTS workspace_isolation ON rahjo.password_reset_tokens;
CREATE POLICY workspace_role_access ON rahjo.password_reset_tokens AS PERMISSIVE FOR ALL TO rahjo_app USING (true) WITH CHECK (true);
CREATE POLICY workspace_isolation ON rahjo.password_reset_tokens AS RESTRICTIVE FOR ALL TO rahjo_app USING (workspace_id=rahjo.current_workspace_id()) WITH CHECK (workspace_id=rahjo.current_workspace_id());

DROP POLICY IF EXISTS workspace_role_access ON rahjo.account_recovery_codes;
DROP POLICY IF EXISTS workspace_isolation ON rahjo.account_recovery_codes;
CREATE POLICY workspace_role_access ON rahjo.account_recovery_codes AS PERMISSIVE FOR ALL TO rahjo_app USING (true) WITH CHECK (true);
CREATE POLICY workspace_isolation ON rahjo.account_recovery_codes AS RESTRICTIVE FOR ALL TO rahjo_app USING (workspace_id=rahjo.current_workspace_id()) WITH CHECK (workspace_id=rahjo.current_workspace_id());

REVOKE ALL ON rahjo.member_invitations, rahjo.password_reset_tokens, rahjo.account_recovery_codes FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.create_member_invitation(uuid,uuid,text,text,text,text,timestamptz),
  rahjo.consume_member_invitation(text,text,text), rahjo.list_workspace_members(uuid,uuid),
  rahjo.create_password_reset_token(uuid,uuid,uuid,text,timestamptz), rahjo.consume_password_reset_token(text,text,text),
  rahjo.set_password_credential(uuid,uuid,text,text), rahjo.replace_account_recovery_codes(uuid,uuid,text[],timestamptz),
  rahjo.consume_account_recovery_code(text,text,text,text,text) TO rahjo_app;
