CREATE SCHEMA IF NOT EXISTS rahjo;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS rahjo.schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rahjo.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 160),
  relaticle_team_id text UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rahjo.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rahjo.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES rahjo.users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer', 'intake')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  authz_version integer NOT NULL DEFAULT 1 CHECK (authz_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS rahjo.password_credentials (
  user_id uuid PRIMARY KEY REFERENCES rahjo.users(id) ON DELETE CASCADE,
  password_salt text NOT NULL CHECK (password_salt ~ '^[a-f0-9]{32}$'),
  password_hash text NOT NULL CHECK (password_hash ~ '^[a-f0-9]{128}$'),
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rahjo.web_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES rahjo.memberships(id) ON DELETE CASCADE,
  membership_authz_version integer NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  csrf_hash text NOT NULL CHECK (csrf_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rahjo.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 120),
  scopes text[] NOT NULL DEFAULT ARRAY['read']::text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION rahjo.authenticate_api_token(p_token_hash text)
RETURNS TABLE (
  workspace_id uuid,
  workspace_slug text,
  workspace_name text,
  membership_id uuid,
  user_id uuid,
  user_email text,
  display_name text,
  role text,
  scopes text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
BEGIN
  RETURN QUERY
  UPDATE rahjo.api_tokens token
     SET last_used_at = now()
    FROM rahjo.memberships membership
    JOIN rahjo.workspaces workspace ON workspace.id = membership.workspace_id
    JOIN rahjo.users app_user ON app_user.id = membership.user_id
   WHERE token.token_hash = p_token_hash
     AND token.membership_id = membership.id
     AND token.workspace_id = membership.workspace_id
     AND token.revoked_at IS NULL
     AND (token.expires_at IS NULL OR token.expires_at > now())
     AND membership.status = 'active'
     AND workspace.status = 'active'
     AND app_user.status = 'active'
  RETURNING workspace.id, workspace.slug, workspace.name, membership.id,
            app_user.id, app_user.email, app_user.display_name,
            membership.role, token.scopes;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.lookup_password_login(p_workspace_slug text, p_email text)
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
  SELECT membership.id, credential.password_salt, credential.password_hash
    FROM rahjo.workspaces workspace
    JOIN rahjo.memberships membership ON membership.workspace_id=workspace.id
    JOIN rahjo.users app_user ON app_user.id=membership.user_id
    JOIN rahjo.password_credentials credential ON credential.user_id=app_user.id
   WHERE workspace.slug=p_workspace_slug
     AND app_user.email=p_email
     AND workspace.status='active'
     AND membership.status='active'
     AND app_user.status='active'
$$;

CREATE OR REPLACE FUNCTION rahjo.create_web_session(
  p_membership_id uuid,
  p_token_hash text,
  p_csrf_hash text,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE created_id uuid;
BEGIN
  INSERT INTO rahjo.web_sessions(membership_id,membership_authz_version,token_hash,csrf_hash,expires_at)
  SELECT membership.id,membership.authz_version,p_token_hash,p_csrf_hash,p_expires_at
    FROM rahjo.memberships membership
   WHERE membership.id=p_membership_id AND membership.status='active'
  RETURNING id INTO created_id;
  RETURN created_id;
END;
$$;

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
              ELSE ARRAY['read','intake:write','approval:decide','action:write','action:execute','outcome:write']::text[]
            END,
            session.csrf_hash;
END;
$$;

CREATE OR REPLACE FUNCTION rahjo.revoke_web_session(p_token_hash text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
  WITH revoked AS (
    UPDATE rahjo.web_sessions SET revoked_at=now()
     WHERE token_hash=p_token_hash AND revoked_at IS NULL
     RETURNING id
  ) SELECT EXISTS(SELECT 1 FROM revoked)
$$;

CREATE OR REPLACE FUNCTION rahjo.current_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('rahjo.workspace_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION rahjo.verify_workspace_binding(p_workspace_id uuid, p_relaticle_team_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
  SELECT EXISTS(
    SELECT 1 FROM rahjo.workspaces workspace
     WHERE workspace.id=p_workspace_id
       AND workspace.relaticle_team_id=p_relaticle_team_id
       AND workspace.status='active'
  )
$$;

CREATE TABLE IF NOT EXISTS rahjo.crm_entity_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (entity_type IN ('account', 'contact', 'opportunity', 'task', 'interaction')),
  rahjo_id text NOT NULL CHECK (length(rahjo_id) BETWEEN 1 AND 120),
  relaticle_id text NOT NULL CHECK (length(relaticle_id) BETWEEN 1 AND 120),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, entity_type, rahjo_id),
  UNIQUE (workspace_id, entity_type, relaticle_id),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS rahjo.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL CHECK (length(public_id) BETWEEN 1 AND 120),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  capability_status text NOT NULL CHECK (capability_status IN ('under_review', 'pilot_candidate', 'evidence_required', 'unavailable', 'active')),
  execution_mode text NOT NULL DEFAULT 'human' CHECK (execution_mode IN ('human', 'sandbox', 'provider_api')),
  owner_membership_id uuid,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, owner_membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.service_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL DEFAULT ('CAP-' || gen_random_uuid()::text),
  service_id uuid NOT NULL,
  capability_code text NOT NULL CHECK (capability_code ~ '^[a-z0-9][a-z0-9._-]{1,119}$'),
  eligibility_status text NOT NULL CHECK (eligibility_status IN ('unknown', 'ineligible', 'review_required', 'eligible')),
  environment_status text NOT NULL CHECK (environment_status IN ('unverified', 'sandbox', 'degraded', 'available')),
  risk_class text NOT NULL CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
  evidence_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, capability_code),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, service_id) REFERENCES rahjo.services(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL CHECK (length(public_id) BETWEEN 1 AND 120),
  account_ref text,
  contact_ref text,
  status text NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'qualified', 'disqualified', 'converted')),
  source_channel text NOT NULL,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_identity jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS rahjo.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL CHECK (length(public_id) BETWEEN 1 AND 120),
  account_ref text NOT NULL,
  contact_ref text,
  lead_id uuid,
  service_id uuid NOT NULL,
  purpose text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 1200),
  status text NOT NULL DEFAULT 'waiting_approval' CHECK (status IN ('intake', 'waiting_approval', 'approved', 'rejected', 'ready_action', 'executing', 'blocked', 'resolved')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  owner_membership_id uuid,
  source_channel text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, lead_id) REFERENCES rahjo.leads(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, service_id) REFERENCES rahjo.services(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, owner_membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  case_id uuid NOT NULL,
  policy_ref text NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'expired', 'cancelled')),
  requested_by uuid NOT NULL,
  decided_by uuid,
  reason text NOT NULL DEFAULT '',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, case_id) REFERENCES rahjo.cases(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, requested_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, decided_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS approvals_one_open_per_case
  ON rahjo.approvals(workspace_id, case_id)
  WHERE status = 'requested';

CREATE TABLE IF NOT EXISTS rahjo.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  case_id uuid NOT NULL,
  approval_id uuid NOT NULL,
  action_type text NOT NULL,
  execution_mode text NOT NULL CHECK (execution_mode IN ('human', 'sandbox', 'provider_api')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  idempotency_key text NOT NULL,
  requested_by uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, idempotency_key),
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, id, case_id),
  FOREIGN KEY (workspace_id, case_id) REFERENCES rahjo.cases(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, approval_id) REFERENCES rahjo.approvals(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, requested_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION rahjo.require_approved_action()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM rahjo.approvals approval
     WHERE approval.workspace_id = NEW.workspace_id
       AND approval.id = NEW.approval_id
       AND approval.case_id = NEW.case_id
       AND approval.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'approved human gate required' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS actions_require_approved_gate ON rahjo.actions;
CREATE TRIGGER actions_require_approved_gate
  BEFORE INSERT OR UPDATE OF approval_id, case_id ON rahjo.actions
  FOR EACH ROW EXECUTE FUNCTION rahjo.require_approved_action();

CREATE TABLE IF NOT EXISTS rahjo.action_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  action_id uuid NOT NULL,
  attempt integer NOT NULL CHECK (attempt > 0),
  state text NOT NULL CHECK (state IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  request_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, action_id, attempt),
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, id, action_id),
  FOREIGN KEY (workspace_id, action_id) REFERENCES rahjo.actions(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.execution_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  action_id uuid NOT NULL,
  run_id uuid NOT NULL,
  result_status text NOT NULL CHECK (result_status IN ('succeeded', 'failed', 'cancelled')),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  external_ref text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, run_id),
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, id, action_id),
  FOREIGN KEY (workspace_id, action_id) REFERENCES rahjo.actions(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, run_id, action_id) REFERENCES rahjo.action_runs(workspace_id, id, action_id) ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION rahjo.reject_immutable_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'immutable evidence cannot be changed' USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS execution_receipts_immutable ON rahjo.execution_receipts;
CREATE TRIGGER execution_receipts_immutable
  BEFORE UPDATE OR DELETE ON rahjo.execution_receipts
  FOR EACH ROW EXECUTE FUNCTION rahjo.reject_immutable_mutation();

CREATE TABLE IF NOT EXISTS rahjo.outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  case_id uuid NOT NULL,
  action_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  result_status text NOT NULL CHECK (result_status IN ('recorded', 'accepted', 'rejected')),
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 1200),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_by uuid NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, case_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, case_id) REFERENCES rahjo.cases(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, action_id, case_id) REFERENCES rahjo.actions(workspace_id, id, case_id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, receipt_id, action_id) REFERENCES rahjo.execution_receipts(workspace_id, id, action_id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, recorded_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.document_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  case_id uuid,
  account_ref text,
  object_key text NOT NULL,
  filename text NOT NULL,
  media_type text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, object_key),
  FOREIGN KEY (workspace_id, case_id) REFERENCES rahjo.cases(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.intake_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 180),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  source_channel text NOT NULL,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed_review')),
  response jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, idempotency_key),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, created_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  public_id text NOT NULL,
  source_name text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'reviewing', 'applied', 'rolled_back', 'failed')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  UNIQUE (workspace_id, public_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, created_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  batch_id uuid NOT NULL,
  row_number integer NOT NULL CHECK (row_number > 0),
  raw_record jsonb NOT NULL,
  normalized_record jsonb NOT NULL,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'create', 'link', 'skip', 'error')),
  decision_reason text,
  applied_entity_ref uuid,
  UNIQUE (workspace_id, batch_id, row_number),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, batch_id) REFERENCES rahjo.import_batches(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, applied_entity_ref) REFERENCES rahjo.crm_entity_refs(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.duplicate_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  import_row_id uuid NOT NULL,
  candidate_ref uuid NOT NULL,
  score numeric(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  reasons jsonb NOT NULL,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'same', 'different')),
  decided_by uuid,
  decided_at timestamptz,
  FOREIGN KEY (workspace_id, import_row_id) REFERENCES rahjo.import_rows(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, candidate_ref) REFERENCES rahjo.crm_entity_refs(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, decided_by) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rahjo.source_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  source_type text NOT NULL,
  source_ref text NOT NULL,
  source_sha256 text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (source_sha256 IS NULL OR source_sha256 ~ '^[a-f0-9]{64}$'),
  UNIQUE (workspace_id, source_type, source_ref),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS rahjo.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  actor_membership_id uuid,
  source text NOT NULL,
  correlation_id text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, actor_membership_id) REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

DROP TRIGGER IF EXISTS audit_events_immutable ON rahjo.audit_events;
CREATE TRIGGER audit_events_immutable
  BEFORE UPDATE OR DELETE ON rahjo.audit_events
  FOR EACH ROW EXECUTE FUNCTION rahjo.reject_immutable_mutation();

CREATE TABLE IF NOT EXISTS rahjo.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  published_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE TABLE IF NOT EXISTS rahjo.rate_limit_windows (
  workspace_id uuid NOT NULL REFERENCES rahjo.workspaces(id) ON DELETE CASCADE,
  token_id uuid NOT NULL,
  route_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (workspace_id, token_id, route_key, window_started_at),
  FOREIGN KEY (workspace_id, token_id) REFERENCES rahjo.api_tokens(workspace_id, id) ON DELETE CASCADE
);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_entity_refs','services','service_capabilities','leads','cases','approvals','actions','action_runs',
    'execution_receipts','outcomes','document_metadata','intake_requests','import_batches',
    'import_rows','duplicate_candidates','source_provenance','audit_events','outbox_events','rate_limit_windows'
  ] LOOP
    EXECUTE format('ALTER TABLE rahjo.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE rahjo.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS workspace_isolation ON rahjo.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS workspace_role_access ON rahjo.%I', table_name);
    EXECUTE format(
      'CREATE POLICY workspace_role_access ON rahjo.%I AS PERMISSIVE FOR ALL TO rahjo_app, rahjo_worker USING (true) WITH CHECK (true)',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY workspace_isolation ON rahjo.%I AS RESTRICTIVE FOR ALL TO rahjo_app, rahjo_worker USING (workspace_id = rahjo.current_workspace_id()) WITH CHECK (workspace_id = rahjo.current_workspace_id())',
      table_name
    );
  END LOOP;
END;
$$;

REVOKE ALL ON SCHEMA rahjo FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA rahjo FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA rahjo FROM PUBLIC;

GRANT USAGE ON SCHEMA rahjo TO rahjo_app;
GRANT USAGE ON SCHEMA rahjo TO rahjo_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON rahjo.crm_entity_refs, rahjo.services, rahjo.service_capabilities, rahjo.leads,
  rahjo.cases, rahjo.approvals, rahjo.actions, rahjo.action_runs, rahjo.outcomes,
  rahjo.document_metadata, rahjo.intake_requests, rahjo.import_batches, rahjo.import_rows,
  rahjo.duplicate_candidates, rahjo.source_provenance, rahjo.outbox_events, rahjo.rate_limit_windows TO rahjo_app;
GRANT SELECT, INSERT ON rahjo.execution_receipts, rahjo.audit_events TO rahjo_app;
GRANT SELECT, INSERT, UPDATE ON rahjo.outbox_events TO rahjo_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rahjo TO rahjo_app;
GRANT EXECUTE ON FUNCTION rahjo.authenticate_api_token(text), rahjo.lookup_password_login(text,text),
  rahjo.create_web_session(uuid,text,text,timestamptz), rahjo.authenticate_web_session(text),
  rahjo.revoke_web_session(text), rahjo.current_workspace_id(), rahjo.verify_workspace_binding(uuid,text) TO rahjo_app;
GRANT EXECUTE ON FUNCTION rahjo.current_workspace_id() TO rahjo_worker;

CREATE INDEX IF NOT EXISTS cases_workspace_updated_idx ON rahjo.cases(workspace_id, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS leads_workspace_updated_idx ON rahjo.leads(workspace_id, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS actions_workspace_updated_idx ON rahjo.actions(workspace_id, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_workspace_created_idx ON rahjo.audit_events(workspace_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS outbox_claim_idx ON rahjo.outbox_events(workspace_id, available_at, id) WHERE published_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS actions_one_active_per_case_kind
  ON rahjo.actions(workspace_id, case_id, action_type)
  WHERE status IN ('queued', 'running');

ALTER DEFAULT PRIVILEGES IN SCHEMA rahjo REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA rahjo REVOKE ALL ON FUNCTIONS FROM PUBLIC;
