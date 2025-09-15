import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  class_section?: string;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  student_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  relationship: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
  check_out_time?: string;
  method: string;
  location?: any;
  marked_by?: string;
  notes?: string;
  created_at: string;
  student?: Profile;
}

export interface FaceData {
  id: string;
  student_id: string;
  face_encoding: string;
  confidence_threshold: number;
  registered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface HostelRecord {
  id: string;
  student_id: string;
  room_number: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  date: string;
  created_at: string;
}

export interface AttendanceSchedule {
  id: string;
  class_section: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface SMSNotification {
  id: string;
  student_id: string;
  parent_phone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

// Authentication functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// Student management functions
export const getAllStudents = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name');
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return data || [];
};

export const getStudentsByStatus = async (date: string = new Date().toISOString().split('T')[0]) => {
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return { present: [], absent: [], risk: [] };
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', date);

  if (attendanceError) {
    console.error('Error fetching attendance:', attendanceError);
    return { present: [], absent: [], risk: [] };
  }

  const { data: riskStudents, error: riskError } = await supabase
    .from('risk_students')
    .select('*');

  if (riskError) {
    console.error('Error fetching risk students:', riskError);
  }

  const presentStudentIds = attendance?.filter(a => a.status === 'present').map(a => a.student_id) || [];
  const absentStudentIds = attendance?.filter(a => a.status === 'absent').map(a => a.student_id) || [];
  
  const present = students?.filter(s => presentStudentIds.includes(s.id)) || [];
  const absent = students?.filter(s => absentStudentIds.includes(s.id)) || [];
  const risk = riskStudents || [];

  return { present, absent, risk };
};

// Attendance functions
export const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late', method: string, location?: any) => {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert({
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      status,
      check_in_time: new Date().toISOString(),
      method,
      location,
      marked_by: (await getCurrentUser())?.id
    });
  
  return { data, error };
};

export const getAttendanceRecords = async (studentId?: string, date?: string): Promise<AttendanceRecord[]> => {
  let query = supabase
    .from('attendance_records')
    .select(`
      *,
      student:profiles(*)
    `)
    .order('created_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
  
  return data || [];
};

// Face recognition functions
export const registerFaceData = async (studentId: string, faceEncoding: string) => {
  const { data, error } = await supabase
    .from('face_data')
    .upsert({
      student_id: studentId,
      face_encoding: faceEncoding,
      registered_by: (await getCurrentUser())?.id
    });
  
  return { data, error };
};

export const getFaceData = async (studentId?: string): Promise<FaceData[]> => {
  let query = supabase.from('face_data').select('*');
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching face data:', error);
    return [];
  }
  
  return data || [];
};

// Parent management functions
export const addParent = async (parent: Omit<Parent, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('parents')
    .insert(parent);
  
  return { data, error };
};

export const getParentsByStudent = async (studentId: string): Promise<Parent[]> => {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('student_id', studentId);
  
  if (error) {
    console.error('Error fetching parents:', error);
    return [];
  }
  
  return data || [];
};

// Hostel management functions
export const getHostelRecords = async (): Promise<HostelRecord[]> => {
  const { data, error } = await supabase
    .from('hostel_records')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching hostel records:', error);
    return [];
  }
  
  return data || [];
};

export const updateHostelStatus = async (studentId: string, status: string, roomNumber?: string) => {
  const updateData: any = {
    student_id: studentId,
    status,
    date: new Date().toISOString().split('T')[0]
  };

  if (status === 'checked_in' && roomNumber) {
    updateData.room_number = roomNumber;
    updateData.check_in_time = new Date().toISOString();
  } else if (status === 'checked_out') {
    updateData.check_out_time = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('hostel_records')
    .upsert(updateData);
  
  return { data, error };
};