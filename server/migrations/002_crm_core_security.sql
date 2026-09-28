-- CRM Core production hardening.
-- Keep the legacy rahjo schema only as a compatibility boundary until the full
-- production backup/restore gate permits a physical namespace cutover.
-- Pin function search_path now so SECURITY DEFINER/trigger execution cannot be
-- redirected through caller-controlled schemas.

ALTER FUNCTION rahjo.current_workspace_id()
  SET search_path = rahjo, pg_catalog;

ALTER FUNCTION rahjo.reject_immutable_mutation()
  SET search_path = rahjo, pg_catalog;

ALTER FUNCTION rahjo.require_approved_action()
  SET search_path = rahjo, pg_catalog;
