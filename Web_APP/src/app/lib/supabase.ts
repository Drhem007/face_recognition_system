import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helper functions
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

export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Only log non-session errors to reduce noise
      if (!error.message.includes('session') && !error.message.includes('Auth session missing')) {
        console.error('Error getting user:', error.message);
      }
      return null;
    }
    return user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
};

// Device related functions
export const getDevices = async () => {
  const user = await getUser();
  
  if (!user) {
    console.error('No authenticated user found when trying to fetch devices');
    return { data: null, error: new Error('User not authenticated') };
  }
  
  // Get devices belonging to the current user
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error fetching devices:', error);
  } else {
    console.log('Fetched devices:', data?.length || 0);
  }
  
  return { data, error };
};

export const getDeviceByIpAddress = async (ipAddress: string) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot find device: User not authenticated');
    return { data: null, error: new Error('User not authenticated') };
  }
  
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('ip_address', ipAddress)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error finding device by IP address:', error);
    return { data: null, error };
  }
  
  return { data, error };
};

export const addDevice = async (name: string, ip_address: string) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot add device: User not authenticated');
    return { data: null, error: new Error('User not authenticated') };
  }
  
  const { data, error } = await supabase
    .from('devices')
    .insert([{ name, ip_address, user_id: user.id }])
    .select();
  
  return { data, error };
};

export const deleteDevice = async (id: string) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot delete device: User not authenticated');
    return { error: new Error('User not authenticated') };
  }
  
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', id);
  
  return { error };
};

export const updateDevice = async (id: string, name: string, ip_address: string) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot update device: User not authenticated');
    return { error: new Error('User not authenticated') };
  }
  
  const { data, error } = await supabase
    .from('devices')
    .update({ name, ip_address })
    .eq('id', id)
    .select();
  
  return { data, error };
};

// Attendance Reports functions
export const getAttendanceReports = async () => {
  const user = await getUser();
  
  if (!user) {
    // Don't log error for unauthenticated users - this is expected behavior
    return { data: null, error: new Error('User not authenticated') };
  }
  
  try {
    // Get attendance reports for devices belonging to the current user
    const { data, error } = await supabase
      .from('attendance_reports')
      .select(`
        *,
        devices!inner(name, user_id)
      `)
      .eq('devices.user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching attendance reports:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return { 
          data: null, 
          error: new Error('Attendance reports table does not exist. Please run the database schema first.') 
        };
      }
      
      return { data: null, error };
    } else {
      console.log('Fetched attendance reports:', data?.length || 0);
    }
    
    return { data, error };
  } catch (unexpectedError) {
    console.error('Unexpected error in getAttendanceReports:', unexpectedError);
    return { 
      data: null, 
      error: new Error('Unexpected error occurred while fetching attendance reports') 
    };
  }
};

export const addAttendanceReport = async (
  deviceId: string,
  totalStudents: number,
  presentStudents: number,
  absentStudents: number,
  attendanceRate: number,
  fileName: string,
  examDate: string,
  examTime: string
) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot add attendance report: User not authenticated');
    return { data: null, error: new Error('User not authenticated') };
  }
  
  const { data, error } = await supabase
    .from('attendance_reports')
    .insert([{
      device_id: deviceId,
      total_students: totalStudents,
      present_students: presentStudents,
      absent_students: absentStudents,
      attendance_rate: attendanceRate,
      file_name: fileName,
      exam_date: examDate,
      exam_time: examTime
    }])
    .select();
  
  return { data, error };
};

export const deleteAttendanceReport = async (id: string) => {
  const user = await getUser();
  
  if (!user) {
    console.error('Cannot delete attendance report: User not authenticated');
    return { error: new Error('User not authenticated') };
  }
  
  const { error } = await supabase
    .from('attendance_reports')
    .delete()
    .eq('id', id);
  
  return { error };
}; 