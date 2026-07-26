
-- Revoke direct execute of has_role from client roles; policies (run as definer) still work
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Students can view their own hostel records
CREATE POLICY "Students can view own hostel records"
ON public.hostel_records
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can view their own parent contacts
CREATE POLICY "Students can view own parents"
ON public.parents
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can view their own SMS logs
CREATE POLICY "Students can view own sms logs"
ON public.sms_log
FOR SELECT
TO authenticated
USING (student_id = auth.uid());
