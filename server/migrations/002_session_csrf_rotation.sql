CREATE OR REPLACE FUNCTION rahjo.rotate_web_session_csrf(p_token_hash text, p_csrf_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rahjo
AS $$
DECLARE
  rotated boolean;
BEGIN
  UPDATE rahjo.web_sessions session
     SET csrf_hash = p_csrf_hash,
         last_seen_at = now()
   WHERE session.token_hash = p_token_hash
     AND session.revoked_at IS NULL
     AND session.expires_at > now()
  RETURNING true INTO rotated;
  RETURN coalesce(rotated, false);
END;
$$;

REVOKE ALL ON FUNCTION rahjo.rotate_web_session_csrf(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rahjo.rotate_web_session_csrf(text,text) TO rahjo_app;
