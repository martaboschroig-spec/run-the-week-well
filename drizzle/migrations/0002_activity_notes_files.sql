CREATE TABLE public.activity_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  author_member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  body text NOT NULL,
  notify_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_notes TO authenticated;
GRANT ALL ON public.activity_notes TO service_role;
ALTER TABLE public.activity_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY note_select ON public.activity_notes FOR SELECT TO authenticated USING (public.is_household_member(public.activity_household(activity_id)));
CREATE POLICY note_insert ON public.activity_notes FOR INSERT TO authenticated WITH CHECK (
  public.is_household_member(public.activity_household(activity_id))
  AND EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = author_member_id AND m.user_id = auth.uid()));
CREATE POLICY note_update ON public.activity_notes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = notify_member_id AND m.user_id = auth.uid()));
CREATE POLICY note_delete ON public.activity_notes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.family_members m WHERE m.id = author_member_id AND m.user_id = auth.uid()));
CREATE INDEX activity_notes_activity_idx ON public.activity_notes(activity_id);
CREATE INDEX activity_notes_notify_idx ON public.activity_notes(notify_member_id);

CREATE TABLE public.activity_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  uploaded_by_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  name text NOT NULL,
  path text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_files TO authenticated;
GRANT ALL ON public.activity_files TO service_role;
ALTER TABLE public.activity_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY file_all ON public.activity_files FOR ALL TO authenticated
  USING (public.is_household_member(public.activity_household(activity_id)))
  WITH CHECK (public.is_household_member(public.activity_household(activity_id)));
CREATE INDEX activity_files_activity_idx ON public.activity_files(activity_id);

CREATE POLICY docs_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'activity-docs' AND public.is_household_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY docs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'activity-docs' AND public.is_household_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY docs_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'activity-docs' AND public.is_household_member(((storage.foldername(name))[1])::uuid));