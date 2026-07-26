CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin delete attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff insert attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff read all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff update attendance" ON public.attendance_records;
CREATE POLICY "Admin delete attendance" ON public.attendance_records FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff insert attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Staff read all attendance" ON public.attendance_records FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Staff update attendance" ON public.attendance_records FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admin manage face data" ON public.face_data;
DROP POLICY IF EXISTS "Staff read face data" ON public.face_data;
CREATE POLICY "Admin manage face data" ON public.face_data FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read face data" ON public.face_data FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admin manage hostel" ON public.hostel_records;
DROP POLICY IF EXISTS "Staff read hostel" ON public.hostel_records;
CREATE POLICY "Admin manage hostel" ON public.hostel_records FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read hostel" ON public.hostel_records FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admin manage parents" ON public.parents;
DROP POLICY IF EXISTS "Staff read parents" ON public.parents;
CREATE POLICY "Admin manage parents" ON public.parents FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read parents" ON public.parents FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff read all profiles" ON public.profiles;
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff read all profiles" ON public.profiles FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admin manage schedules" ON public.schedules;
CREATE POLICY "Admin manage schedules" ON public.schedules FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin read sms log" ON public.sms_log;
CREATE POLICY "Admin read sms log" ON public.sms_log FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Admins can insert tutorials" ON public.tutorials;
DROP POLICY IF EXISTS "Admins can update tutorials" ON public.tutorials;
CREATE POLICY "Admins can delete tutorials" ON public.tutorials FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert tutorials" ON public.tutorials FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tutorials" ON public.tutorials FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin read all roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read all roles" ON public.user_roles FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM service_role;