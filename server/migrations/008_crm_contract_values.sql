CREATE TABLE IF NOT EXISTS rahjo.crm_entity_contract_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  entity_ref_id uuid NOT NULL,
  deadline_kind text CHECK (deadline_kind IN ('date-only', 'instant')),
  deadline_date date,
  deadline_at timestamptz,
  deadline_timezone text,
  deadline_calendar text CHECK (deadline_calendar IN ('gregorian', 'jalali')),
  money_currency text CHECK (money_currency IS NULL OR money_currency = 'IRR'),
  money_amount_irr numeric,
  money_input_unit text CHECK (money_input_unit IN ('IRR', 'TOMAN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, entity_ref_id),
  UNIQUE (workspace_id, id),
  FOREIGN KEY (workspace_id, entity_ref_id)
    REFERENCES rahjo.crm_entity_refs(workspace_id, id) ON DELETE CASCADE,
  CHECK (
    (deadline_kind IS NULL AND deadline_date IS NULL AND deadline_at IS NULL
      AND deadline_timezone IS NULL AND deadline_calendar IS NULL)
    OR (deadline_kind = 'date-only' AND deadline_date IS NOT NULL AND deadline_at IS NULL
      AND deadline_timezone IS NULL AND deadline_calendar IS NOT NULL)
    OR (deadline_kind = 'instant' AND deadline_date IS NULL AND deadline_at IS NOT NULL
      AND deadline_timezone IS NOT NULL AND deadline_calendar IS NULL)
  ),
  CHECK (
    (money_currency IS NULL AND money_amount_irr IS NULL AND money_input_unit IS NULL)
    OR (money_currency = 'IRR' AND money_amount_irr IS NOT NULL
      AND money_amount_irr = trunc(money_amount_irr)
      AND abs(money_amount_irr) < 1e38 AND money_input_unit IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS rahjo.crm_entity_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  entity_ref_id uuid NOT NULL,
  identifier_type text NOT NULL CHECK (identifier_type ~ '^[a-z][a-z0-9._:-]*$'),
  normalized_value text NOT NULL CHECK (length(normalized_value) BETWEEN 1 AND 256),
  unique_scope text CHECK (
    unique_scope IS NULL
    OR (unique_scope = 'workspace' AND identifier_type IN ('rahjo_contact_id', 'relaticle_contact_id'))
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, entity_ref_id, identifier_type, normalized_value),
  FOREIGN KEY (workspace_id, entity_ref_id)
    REFERENCES rahjo.crm_entity_refs(workspace_id, id) ON DELETE CASCADE
);

INSERT INTO rahjo.crm_entity_identifiers(workspace_id, entity_ref_id, identifier_type, normalized_value, unique_scope)
SELECT workspace_id, id, 'rahjo_contact_id', rahjo_id, 'workspace'
  FROM rahjo.crm_entity_refs
 WHERE entity_type='contact'
ON CONFLICT DO NOTHING;
INSERT INTO rahjo.crm_entity_identifiers(workspace_id, entity_ref_id, identifier_type, normalized_value, unique_scope)
SELECT workspace_id, id, 'relaticle_contact_id', relaticle_id, 'workspace'
  FROM rahjo.crm_entity_refs
 WHERE entity_type='contact'
ON CONFLICT DO NOTHING;

ALTER TABLE rahjo.duplicate_candidates
  ADD COLUMN IF NOT EXISTS candidate_import_row_id uuid;
ALTER TABLE rahjo.duplicate_candidates
  ADD COLUMN IF NOT EXISTS candidate_import_batch_id uuid;
ALTER TABLE rahjo.duplicate_candidates
  ADD COLUMN IF NOT EXISTS source_import_batch_id uuid;
UPDATE rahjo.duplicate_candidates duplicate
   SET source_import_batch_id = source_row.batch_id
  FROM rahjo.import_rows source_row
 WHERE source_row.workspace_id=duplicate.workspace_id
   AND source_row.id=duplicate.import_row_id
   AND duplicate.source_import_batch_id IS NULL;
ALTER TABLE rahjo.duplicate_candidates
  ALTER COLUMN source_import_batch_id SET NOT NULL;
ALTER TABLE rahjo.duplicate_candidates
  ALTER COLUMN candidate_ref DROP NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='import_rows_workspace_batch_id_id_unique'
       AND conrelid='rahjo.import_rows'::regclass
  ) THEN
    ALTER TABLE rahjo.import_rows
      ADD CONSTRAINT import_rows_workspace_batch_id_id_unique UNIQUE (workspace_id, batch_id, id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='duplicate_candidates_one_target'
       AND conrelid='rahjo.duplicate_candidates'::regclass
  ) THEN
    ALTER TABLE rahjo.duplicate_candidates
      ADD CONSTRAINT duplicate_candidates_one_target
      CHECK (
        (candidate_ref IS NOT NULL AND candidate_import_row_id IS NULL AND candidate_import_batch_id IS NULL)
        OR (candidate_ref IS NULL AND candidate_import_row_id IS NOT NULL
          AND candidate_import_batch_id IS NOT NULL
          AND candidate_import_batch_id = source_import_batch_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='duplicate_candidates_source_import_row_fkey'
       AND conrelid='rahjo.duplicate_candidates'::regclass
  ) THEN
    ALTER TABLE rahjo.duplicate_candidates
      ADD CONSTRAINT duplicate_candidates_source_import_row_fkey
      FOREIGN KEY (workspace_id, source_import_batch_id, import_row_id)
      REFERENCES rahjo.import_rows(workspace_id, batch_id, id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='duplicate_candidates_import_row_fkey'
       AND conrelid='rahjo.duplicate_candidates'::regclass
  ) THEN
    ALTER TABLE rahjo.duplicate_candidates
      ADD CONSTRAINT duplicate_candidates_import_row_fkey
      FOREIGN KEY (workspace_id, candidate_import_batch_id, candidate_import_row_id)
      REFERENCES rahjo.import_rows(workspace_id, batch_id, id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE rahjo.import_batches
  ADD COLUMN IF NOT EXISTS fuzzy_candidates_truncated boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS rahjo.crm_restricted_raw_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  entity_ref_id uuid,
  import_row_id uuid,
  captured_by uuid NOT NULL,
  raw_values jsonb NOT NULL CHECK (jsonb_typeof(raw_values) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  retention_until timestamptz,
  CHECK (num_nonnulls(entity_ref_id, import_row_id) = 1),
  CHECK (retention_until IS NULL OR retention_until >= created_at),
  FOREIGN KEY (workspace_id, entity_ref_id)
    REFERENCES rahjo.crm_entity_refs(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, import_row_id)
    REFERENCES rahjo.import_rows(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, captured_by)
    REFERENCES rahjo.memberships(workspace_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_restricted_raw_entity_uq
  ON rahjo.crm_restricted_raw_values(workspace_id, entity_ref_id)
  WHERE entity_ref_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_restricted_raw_import_row_uq
  ON rahjo.crm_restricted_raw_values(workspace_id, import_row_id)
  WHERE import_row_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_entity_identifiers_search_idx
  ON rahjo.crm_entity_identifiers(workspace_id, identifier_type, normalized_value);
CREATE UNIQUE INDEX IF NOT EXISTS crm_entity_identifiers_workspace_unique_idx
  ON rahjo.crm_entity_identifiers(workspace_id, identifier_type, normalized_value)
  WHERE unique_scope = 'workspace';
CREATE INDEX IF NOT EXISTS crm_entity_contract_values_deadline_idx
  ON rahjo.crm_entity_contract_values(workspace_id, deadline_date, deadline_at);
CREATE INDEX IF NOT EXISTS crm_restricted_raw_values_retention_idx
  ON rahjo.crm_restricted_raw_values(retention_until)
  WHERE retention_until IS NOT NULL;

ALTER TABLE rahjo.crm_entity_contract_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.crm_entity_contract_values FORCE ROW LEVEL SECURITY;
ALTER TABLE rahjo.crm_entity_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.crm_entity_identifiers FORCE ROW LEVEL SECURITY;
ALTER TABLE rahjo.crm_restricted_raw_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE rahjo.crm_restricted_raw_values FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_role_access ON rahjo.crm_entity_contract_values;
CREATE POLICY workspace_role_access ON rahjo.crm_entity_contract_values
  AS PERMISSIVE FOR ALL TO rahjo_app USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS workspace_isolation ON rahjo.crm_entity_contract_values;
CREATE POLICY workspace_isolation ON rahjo.crm_entity_contract_values
  AS RESTRICTIVE FOR ALL TO rahjo_app
  USING (workspace_id = rahjo.current_workspace_id())
  WITH CHECK (workspace_id = rahjo.current_workspace_id());

DROP POLICY IF EXISTS workspace_role_access ON rahjo.crm_entity_identifiers;
CREATE POLICY workspace_role_access ON rahjo.crm_entity_identifiers
  AS PERMISSIVE FOR ALL TO rahjo_app USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS workspace_isolation ON rahjo.crm_entity_identifiers;
CREATE POLICY workspace_isolation ON rahjo.crm_entity_identifiers
  AS RESTRICTIVE FOR ALL TO rahjo_app
  USING (workspace_id = rahjo.current_workspace_id())
  WITH CHECK (workspace_id = rahjo.current_workspace_id());

DROP POLICY IF EXISTS crm_restricted_raw_app_insert ON rahjo.crm_restricted_raw_values;
CREATE POLICY crm_restricted_raw_app_insert ON rahjo.crm_restricted_raw_values
  FOR INSERT TO rahjo_app
  WITH CHECK (
    workspace_id = rahjo.current_workspace_id()
    AND captured_by = nullif(current_setting('rahjo.membership_id', true), '')::uuid
  );
DROP POLICY IF EXISTS crm_restricted_raw_worker_read ON rahjo.crm_restricted_raw_values;
CREATE POLICY crm_restricted_raw_worker_read ON rahjo.crm_restricted_raw_values
  FOR SELECT TO rahjo_worker USING (workspace_id = rahjo.current_workspace_id());
DROP POLICY IF EXISTS crm_restricted_raw_worker_delete ON rahjo.crm_restricted_raw_values;
CREATE POLICY crm_restricted_raw_worker_delete ON rahjo.crm_restricted_raw_values
  FOR DELETE TO rahjo_worker USING (workspace_id = rahjo.current_workspace_id());

REVOKE ALL ON rahjo.crm_entity_contract_values, rahjo.crm_entity_identifiers,
  rahjo.crm_restricted_raw_values FROM PUBLIC, rahjo_app, rahjo_worker;
GRANT SELECT, INSERT, UPDATE ON rahjo.crm_entity_contract_values,
  rahjo.crm_entity_identifiers TO rahjo_app;
GRANT INSERT ON rahjo.crm_restricted_raw_values TO rahjo_app;
GRANT SELECT, DELETE ON rahjo.crm_restricted_raw_values TO rahjo_worker;

COMMENT ON TABLE rahjo.crm_entity_contract_values IS
  'Typed CRM deadline and money values; date-only and instant have separate columns.';
COMMENT ON TABLE rahjo.crm_entity_identifiers IS
  'Canonical type plus normalized identifier values; uniqueness is limited to registry-declared scopes.';
COMMENT ON TABLE rahjo.crm_restricted_raw_values IS
  'Restricted raw CRM/import inputs. Retention deadline remains owner-configurable; normal APIs cannot read this table.';
