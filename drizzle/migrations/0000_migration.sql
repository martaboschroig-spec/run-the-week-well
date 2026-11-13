
-- Households and people
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Our family',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_label text NOT NULL DEFAULT 'Caregiver',
  email text,
  user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX family_members_household_email ON public.family_members (household_id, lower(email)) WHERE email IS NOT NULL;
CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  age int,
  color text NOT NULL DEFAULT 'lavender',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text NOT NULL DEFAULT '',
  recurrence text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','weekly')),
  weekdays int[] NOT NULL DEFAULT '{}',
  until_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE TABLE public.activity_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  label text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.activity_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('dropoff','pickup')),
  member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, kind)
);
CREATE TABLE public.reassignment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.activity_assignments(id) ON DELETE CASCADE,
  from_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  to_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  requested_by_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE UNIQUE INDEX one_pending_per_assignment ON public.reassignment_requests (assignment_id) WHERE status = 'pending';
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES public.reassignment_requests(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('request','accepted','declined','cancelled')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.households, public.family_members, public.children, public.activities, public.activity_items, public.activity_assignments TO authenticated;
GRANT SELECT ON public.reassignment_requests TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.households, public.family_members, public.children, public.activities, public.activity_items, public.activity_assignments, public.reassignment_requests, public.notifications TO service_role;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reassignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Membership helpers
CREATE OR REPLACE FUNCTION public.is_household_member(_household uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM family_members WHERE household_id = _household AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.activity_household(_activity uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.household_id FROM activities a JOIN children c ON c.id = a.child_id WHERE a.id = _activity
$$;

CREATE POLICY hh_select ON public.households FOR SELECT TO authenticated USING (public.is_household_member(id));
CREATE POLICY hh_update ON public.households FOR UPDATE TO authenticated USING (public.is_household_member(id));

CREATE POLICY fm_all ON public.family_members FOR ALL TO authenticated
  USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY ch_all ON public.children FOR ALL TO authenticated
  USING (public.is_household_member(household_id)) WITH CHECK (public.is_household_member(household_id));
CREATE POLICY act_all ON public.activities FOR ALL TO authenticated
  USING (public.is_household_member((SELECT household_id FROM public.children WHERE id = child_id)))
  WITH CHECK (public.is_household_member((SELECT household_id FROM public.children WHERE id = child_id)));
CREATE POLICY item_all ON public.activity_items FOR ALL TO authenticated
  USING (public.is_household_member(public.activity_household(activity_id)))
  WITH CHECK (public.is_household_member(public.activity_household(activity_id)));
CREATE POLICY asg_all ON public.activity_assignments FOR ALL TO authenticated
  USING (public.is_household_member(public.activity_household(activity_id)))
  WITH CHECK (public.is_household_member(public.activity_household(activity_id)));
CREATE POLICY req_select ON public.reassignment_requests FOR SELECT TO authenticated
  USING (public.is_household_member((SELECT household_id FROM public.family_members WHERE id = from_member_id)));
CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = recipient_member_id AND m.user_id = auth.uid()));
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = recipient_member_id AND m.user_id = auth.uid()));

-- Assigned members must belong to the activity's household
CREATE OR REPLACE FUNCTION public.check_assignment_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.member_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM family_members WHERE id = NEW.member_id AND household_id = activity_household(NEW.activity_id)
  ) THEN
    RAISE EXCEPTION 'That person is not part of this family';
  END IF;
  -- A direct change of the responsible person cancels any open request for it
  IF TG_OP = 'UPDATE' AND NEW.member_id IS DISTINCT FROM OLD.member_id THEN
    NEW.updated_at := now();
    UPDATE reassignment_requests SET status = 'cancelled', responded_at = now()
      WHERE assignment_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_check_assignment BEFORE INSERT OR UPDATE ON public.activity_assignments
  FOR EACH ROW EXECUTE FUNCTION public.check_assignment_member();

-- Every activity gets a drop-off and pickup slot
CREATE OR REPLACE FUNCTION public.create_assignment_slots()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO activity_assignments (activity_id, kind) VALUES (NEW.id, 'dropoff'), (NEW.id, 'pickup')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_activity_slots AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.create_assignment_slots();

-- Link a signed-in user to the family member with their email
CREATE OR REPLACE FUNCTION public.link_me()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _id FROM family_members WHERE user_id = auth.uid();
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  UPDATE family_members SET user_id = auth.uid()
    WHERE id = (SELECT id FROM family_members WHERE user_id IS NULL AND lower(email) = lower(_email) ORDER BY created_at LIMIT 1)
    RETURNING id INTO _id;
  RETURN _id;
END $$;

-- Create a household prefilled with the example family; caller becomes one of the adults
CREATE OR REPLACE FUNCTION public.create_household(_name text, _me text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hh uuid; _email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already belong to a family';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO households (name, created_by) VALUES (coalesce(nullif(trim(_name),''),'Our family'), auth.uid()) RETURNING id INTO _hh;
  INSERT INTO family_members (household_id, name, role_label, email, user_id) VALUES
    (_hh, 'Sarah', 'Mom', CASE WHEN _me = 'Sarah' THEN _email END, CASE WHEN _me = 'Sarah' THEN auth.uid() END),
    (_hh, 'Michael', 'Dad', CASE WHEN _me = 'Michael' THEN _email END, CASE WHEN _me = 'Michael' THEN auth.uid() END),
    (_hh, 'Grandma', 'Caregiver', CASE WHEN _me = 'Grandma' THEN _email END, CASE WHEN _me = 'Grandma' THEN auth.uid() END);
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE household_id = _hh AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Pick who you are';
  END IF;
  INSERT INTO children (household_id, name, age, color) VALUES
    (_hh, 'Emma', 12, 'lavender'), (_hh, 'Leo', 9, 'blue'), (_hh, 'Sophie', 6, 'coral');
  RETURN _hh;
END $$;

-- Change requests: requesting never moves the responsibility
CREATE OR REPLACE FUNCTION public.request_change(_assignment uuid, _to uuid, _message text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a activity_assignments; _hh uuid; _me uuid; _req uuid;
BEGIN
  SELECT * INTO _a FROM activity_assignments WHERE id = _assignment;
  IF _a.id IS NULL THEN RAISE EXCEPTION 'Responsibility not found'; END IF;
  _hh := activity_household(_a.activity_id);
  SELECT id INTO _me FROM family_members WHERE user_id = auth.uid() AND household_id = _hh;
  IF _me IS NULL THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _a.member_id IS NULL THEN RAISE EXCEPTION 'Nobody is assigned yet — assign someone instead'; END IF;
  IF _a.member_id <> _me THEN RAISE EXCEPTION 'Only the person responsible can ask for a change'; END IF;
  IF _to = _a.member_id THEN RAISE EXCEPTION 'Pick someone else'; END IF;
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE id = _to AND household_id = _hh) THEN
    RAISE EXCEPTION 'That person is not part of this family';
  END IF;
  IF EXISTS (SELECT 1 FROM reassignment_requests WHERE assignment_id = _assignment AND status = 'pending') THEN
    RAISE EXCEPTION 'There is already a pending request for this';
  END IF;
  INSERT INTO reassignment_requests (assignment_id, from_member_id, to_member_id, requested_by_member_id, message)
    VALUES (_assignment, _a.member_id, _to, _me, nullif(trim(_message),'')) RETURNING id INTO _req;
  INSERT INTO notifications (recipient_member_id, request_id, type) VALUES (_to, _req, 'request');
  RETURN _req;
END $$;

CREATE OR REPLACE FUNCTION public.respond_change(_request uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r reassignment_requests;
BEGIN
  SELECT * INTO _r FROM reassignment_requests WHERE id = _request FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE id = _r.to_member_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the person asked can answer';
  END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'This request was already answered'; END IF;
  UPDATE reassignment_requests SET status = CASE WHEN _accept THEN 'accepted' ELSE 'declined' END, responded_at = now()
    WHERE id = _request;
  IF _accept THEN
    UPDATE activity_assignments SET member_id = _r.to_member_id WHERE id = _r.assignment_id;
  END IF;
  UPDATE notifications SET read_at = coalesce(read_at, now()) WHERE request_id = _request AND type = 'request';
  INSERT INTO notifications (recipient_member_id, request_id, type)
    VALUES (_r.requested_by_member_id, _request, CASE WHEN _accept THEN 'accepted' ELSE 'declined' END);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_change(_request uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r reassignment_requests;
BEGIN
  SELECT * INTO _r FROM reassignment_requests WHERE id = _request FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE id = _r.requested_by_member_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the person who asked can cancel';
  END IF;
  IF _r.status <> 'pending' THEN RAISE EXCEPTION 'This request was already answered'; END IF;
  UPDATE reassignment_requests SET status = 'cancelled', responded_at = now() WHERE id = _request;
  UPDATE notifications SET read_at = coalesce(read_at, now()) WHERE request_id = _request AND type = 'request';
END $$;

REVOKE EXECUTE ON FUNCTION public.link_me(), public.create_household(text,text), public.request_change(uuid,uuid,text), public.respond_change(uuid,boolean), public.cancel_change(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.link_me(), public.create_household(text,text), public.request_change(uuid,uuid,text), public.respond_change(uuid,boolean), public.cancel_change(uuid), public.is_household_member(uuid), public.activity_household(uuid) TO authenticated;
