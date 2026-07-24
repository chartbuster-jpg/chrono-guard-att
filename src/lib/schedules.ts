import { supabase } from "@/integrations/supabase/client";

export interface Schedule {
  id: string;
  class_section: string;
  day_of_week: number; // 0 = Sunday
  start_time: string; // "HH:MM:SS"
  end_time: string;
  subject: string | null;
  is_active: boolean;
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const listSchedules = async (): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .order("class_section")
    .order("day_of_week")
    .order("start_time");
  if (error) return [];
  return (data as Schedule[]) || [];
};

export const createSchedule = async (s: Omit<Schedule, "id">) => {
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from("schedules").insert({ ...s, created_by: user.user?.id });
  return { error };
};

export const updateSchedule = async (id: string, patch: Partial<Schedule>) => {
  const { error } = await supabase.from("schedules").update(patch).eq("id", id);
  return { error };
};

export const deleteSchedule = async (id: string) => {
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  return { error };
};

// Is there an active schedule for this class_section right now?
export const isClassInSession = (schedules: Schedule[], classSection: string, at: Date = new Date()): Schedule | null => {
  const day = at.getDay();
  const hhmm = at.toTimeString().slice(0, 8); // HH:MM:SS
  return (
    schedules.find(
      (s) =>
        s.is_active &&
        s.class_section === classSection &&
        s.day_of_week === day &&
        s.start_time <= hhmm &&
        s.end_time >= hhmm,
    ) || null
  );
};
