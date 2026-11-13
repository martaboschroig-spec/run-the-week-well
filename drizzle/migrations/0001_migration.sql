
ALTER TABLE public.reassignment_requests ADD COLUMN acknowledged_at timestamptz;

CREATE OR REPLACE FUNCTION public.acknowledge_decline(_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r reassignment_requests;
BEGIN
  SELECT * INTO _r FROM reassignment_requests WHERE id = _request;
  IF _r.id IS NULL OR NOT public.is_household_member((SELECT household_id FROM family_members WHERE id = _r.from_member_id)) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE reassignment_requests SET acknowledged_at = now() WHERE id = _request AND status = 'declined';
  UPDATE notifications SET read_at = coalesce(read_at, now()) WHERE request_id = _request;
END $$;
REVOKE EXECUTE ON FUNCTION public.acknowledge_decline(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.acknowledge_decline(uuid) TO authenticated;
