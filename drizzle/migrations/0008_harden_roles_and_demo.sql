CREATE OR REPLACE FUNCTION public.is_demo_household(_household uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM households h JOIN auth.users u ON u.id = h.created_by
                 WHERE h.id = _household AND lower(u.email) = 'demo@runtheweek.app')
$$;
REVOKE EXECUTE ON FUNCTION public.is_demo_household(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_demo_household(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_me()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _id FROM family_members WHERE user_id = auth.uid();
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  PERFORM set_config('app.linking', 'on', true);
  UPDATE family_members SET user_id = auth.uid()
    WHERE id = (SELECT id FROM family_members
                WHERE user_id IS NULL AND lower(email) = lower(_email)
                  AND NOT public.is_demo_household(household_id)
                ORDER BY created_at LIMIT 1)
    RETURNING id INTO _id;
  PERFORM set_config('app.linking', 'off', true);
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.create_household(_name text, _me text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hh uuid; _email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM family_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already belong to a family';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  PERFORM set_config('app.linking', 'on', true);
  INSERT INTO households (name, created_by) VALUES (coalesce(nullif(trim(_name),''),'Our family'), auth.uid()) RETURNING id INTO _hh;
  INSERT INTO family_members (household_id, name, role_label, email, user_id) VALUES
    (_hh, 'Sarah', 'Mom', CASE WHEN _me = 'Sarah' THEN _email END, CASE WHEN _me = 'Sarah' THEN auth.uid() END),
    (_hh, 'Michael', 'Dad', CASE WHEN _me = 'Michael' THEN _email END, CASE WHEN _me = 'Michael' THEN auth.uid() END),
    (_hh, 'Grandma', 'Caregiver', CASE WHEN _me = 'Grandma' THEN _email END, CASE WHEN _me = 'Grandma' THEN auth.uid() END);
  PERFORM set_config('app.linking', 'off', true);
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE household_id = _hh AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Pick who you are';
  END IF;
  INSERT INTO children (household_id, name, age, color) VALUES
    (_hh, 'Emma', 12, 'lavender'), (_hh, 'Leo', 9, 'blue'), (_hh, 'Sophie', 6, 'coral');
  RETURN _hh;
END $$;

CREATE OR REPLACE FUNCTION public.guard_family_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Server/admin work (no signed-in user) and the system linking step are allowed.
  IF auth.uid() IS NULL OR current_setting('app.linking', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN RAISE EXCEPTION 'Accounts are linked automatically'; END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Accounts are linked automatically'; END IF;
  IF public.is_demo_household(NEW.household_id) AND (
       (TG_OP = 'INSERT' AND (NEW.email IS NOT NULL OR NEW.phone IS NOT NULL)) OR
       (TG_OP = 'UPDATE' AND (NEW.email IS DISTINCT FROM OLD.email OR NEW.phone IS DISTINCT FROM OLD.phone))) THEN
    RAISE EXCEPTION 'Emails and phone numbers can''t be changed in the demo';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_family_member() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_guard_family_member BEFORE INSERT OR UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_family_member();

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (_user_id = auth.uid() OR auth.uid() IS NULL)
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS docs_insert ON storage.objects;
CREATE POLICY docs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'activity-docs'
  AND public.is_household_member(((storage.foldername(name))[1])::uuid)
  AND NOT public.is_demo_household(((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS pt_all ON public.push_tokens;
CREATE POLICY pt_select ON public.push_tokens FOR SELECT TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY pt_delete ON public.push_tokens FOR DELETE TO authenticated USING (public.is_household_member(household_id));
CREATE POLICY pt_insert ON public.push_tokens FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM family_members m WHERE m.id = member_id AND m.household_id = push_tokens.household_id AND m.user_id = auth.uid()));
CREATE POLICY pt_update ON public.push_tokens FOR UPDATE TO authenticated
  USING (public.is_household_member(household_id))
  WITH CHECK (EXISTS (SELECT 1 FROM family_members m WHERE m.id = member_id AND m.household_id = push_tokens.household_id AND m.user_id = auth.uid()));