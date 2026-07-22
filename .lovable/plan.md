## Goal

Turn the current mock-data attendance app into a real, usable system with authenticated users, real face recognition, real SMS alerts to parents, and persistent data.

Given the scope, I'll ship it in 4 phases. Each phase leaves the app in a working state.

---

## Phase 1 — Backend, Auth, Roles (foundation)

Enable Lovable Cloud and set up the real database + auth.

**Database schema:**
- `profiles` (id → auth.users, full_name, email, phone, student_id, class_section, created_at)
- `user_roles` (id, user_id, role: 'student' | 'teacher' | 'admin') — separate table, prevents privilege escalation
- `parents` (id, student_id, parent_name, parent_phone, parent_email, relationship)
- `face_data` (id, student_id UNIQUE, face_descriptor jsonb, registered_by, created_at) — stores the 128-float face-api descriptor
- `attendance_records` (id, student_id, date, status, check_in_time, method, marked_by) — unique(student_id, date)
- `schedules` (id, class_section, day_of_week, start_time, end_time, subject, is_active)
- `hostel_records` (id, student_id, room_number, check_in_time, check_out_time, status, date)
- `sms_log` (id, student_id, parent_phone, message, status, sent_at)

Security-definer `has_role(user_id, role)` function + RLS policies scoped to `auth.uid()`. GRANTs to `authenticated` and `service_role`. Auto-create profile on signup via trigger.

**Auth flow:**
- Signup page: email + password + role selector + name/student_id/class
- Login page: real email/password against Cloud
- `/reset-password` route
- ProtectedRoute wrapper reads role from `user_roles` and redirects unauthorized tabs
- Admin approval flow: signup creates profile with `pending` role; admin promotes to student/teacher/admin

**Removes:** all `students = [...]` mock arrays, mock parent objects, hardcoded stats.

---

## Phase 2 — Real Face Recognition (face-api.js)

Replace `Math.random()` face logic with real ML.

- Add `face-api.js`, load TinyFaceDetector + FaceLandmark68Net + FaceRecognitionNet from CDN
- **Admin Face Registration**: capture 3 frames from the live video, extract 128-dim descriptors, average them, save to `face_data.face_descriptor` for the selected student
- **Teacher Mark Attendance**: continuously detect faces in the live video, compute descriptor, compare (Euclidean distance ≤ 0.5) against all `face_data` rows loaded for the class, mark that student present
- Fallback UI: manual search + "Mark Present" button stays as backup
- Confidence indicator + duplicate-scan prevention (don't mark same student twice in 30s)

---

## Phase 3 — Twilio SMS + Alerts

Connect Twilio via the standard connector.

- Edge function `send-parent-sms` — takes `student_id, message`, looks up parents, sends via Twilio gateway, logs to `sms_log`
- Postgres trigger on `attendance_records`: when a row is inserted with status = 'absent', enqueue an SMS by calling the edge function (or write to a queue table + cron)
- Edge function `check-risk-students` (scheduled daily): calculates 30-day attendance %, if < 75% sends SMS to admins listed in `user_roles` with role = 'admin'
- Admin UI: "Send test SMS" button + `sms_log` viewer

---

## Phase 4 — Real Schedules, Hostel, QR Geofencing

- Admin Schedule tab: real CRUD on `schedules` table (add/edit/delete class periods per class_section per weekday)
- Attendance marking checks current time against active schedule for the student's class; blocks marking outside scheduled window
- Hostel tab: real CRUD on `hostel_records`, live occupancy counts from actual data
- QR Attendance: generates time-limited QR (contains signed token + class_section), scanner checks geolocation vs school coords (admin-configurable in settings) within radius before accepting

---

## What's out of scope for this pass

- Native mobile build (Capacitor wrap) — can add after web is stable
- Video tutorial uploads — keeping the tab, but upload UI can wait
- Encrypted local storage — Lovable Cloud (Postgres) is encrypted at rest; "local encrypted cloud" isn't a real category, will clarify if you want on-device caching

---

## Technical notes

- Face descriptors stored as `jsonb` (array of 128 floats). Comparison happens client-side after loading all descriptors for the class (fast for < a few thousand students).
- face-api.js models (~6 MB) loaded from CDN on first use; cached by browser.
- Twilio uses the connector gateway pattern — no keys in frontend.
- All secrets (Twilio SID/token) via `standard_connectors--connect`.
- Signup will require the user to know their `student_id` for students. Admin creates the record first, then student signs up matching that ID — or open signup with admin approval, your call.

---

## Order of execution

I'll start with **Phase 1** now (Cloud + schema + auth + roles). That's the largest single chunk (~30 min of edits) and every later phase depends on it. Once you can sign up and log in with real roles, I'll move to Phase 2 (face-api). Confirm the plan and I'll begin.
