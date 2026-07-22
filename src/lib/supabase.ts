// Data helpers for the attendance app. Real Lovable Cloud backend.
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string | null;
  class_section: string | null;
  created_at?: string;
}

export interface Parent {
  id: string;
  student_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  relationship: string;
}

export interface HostelRecord {
  id: string;
  student_id: string;
  room_number: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late";
  method: string;
  check_in_time: string | null;
}

// --------- Students / Profiles ---------
export const getAllStudents = async (): Promise<Profile[]> => {
  // Get IDs of users with the "student" role, then their profiles
  const { data: roleRows, error: roleErr } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");
  if (roleErr || !roleRows) return [];
  const ids = roleRows.map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids)
    .order("full_name");
  if (error) return [];
  return (data as Profile[]) || [];
};

// --------- Parents ---------
export const getParentsByStudent = async (studentId: string): Promise<Parent[]> => {
  const { data, error } = await supabase
    .from("parents")
    .select("*")
    .eq("student_id", studentId);
  if (error) return [];
  return (data as Parent[]) || [];
};

export const addParent = async (parent: Omit<Parent, "id">) => {
  const { error } = await supabase.from("parents").insert(parent);
  return { error };
};

// --------- Hostel ---------
export const getHostelRecords = async (): Promise<HostelRecord[]> => {
  const { data, error } = await supabase
    .from("hostel_records")
    .select("*")
    .order("date", { ascending: false });
  if (error) return [];
  return (data as HostelRecord[]) || [];
};

export const updateHostelStatus = async (
  studentId: string,
  status: "checked_in" | "checked_out",
  roomNumber?: string,
) => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();
  if (status === "checked_in") {
    const { error } = await supabase.from("hostel_records").insert({
      student_id: studentId,
      room_number: roomNumber || "",
      status,
      check_in_time: now,
      date: today,
    });
    return { error };
  } else {
    const { data: existing } = await supabase
      .from("hostel_records")
      .select("id")
      .eq("student_id", studentId)
      .eq("status", "checked_in")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!existing) return { error: new Error("No active check-in found") };
    const { error } = await supabase
      .from("hostel_records")
      .update({ status, check_out_time: now })
      .eq("id", (existing as any).id);
    return { error };
  }
};

// --------- Attendance ---------
export const markAttendance = async (
  studentId: string,
  status: "present" | "absent" | "late",
  method: string = "manual",
) => {
  const today = new Date().toISOString().split("T")[0];
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("attendance_records").upsert(
    {
      student_id: studentId,
      date: today,
      status,
      method,
      check_in_time: status !== "absent" ? new Date().toISOString() : null,
      marked_by: user.user?.id ?? null,
    },
    { onConflict: "student_id,date" },
  );
  return { error };
};

export const getAttendanceForDate = async (date: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("date", date);
  if (error) return [];
  return (data as AttendanceRecord[]) || [];
};
