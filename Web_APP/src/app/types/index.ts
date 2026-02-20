export interface Device {
  id: string;
  name: string;
  ip_address: string;
  user_id: string;
  created_at: string;
}

export interface NewDevice {
  name: string;
  ip_address: string;
}

export interface AttendanceReport {
  id: string;
  deviceId: string;
  deviceName: string;
  date: string;
  time: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  attendanceRate: number;
  fileName: string;
}

// Database schema version
export interface AttendanceReportDB {
  id: string;
  device_id: string;
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_rate: number;
  file_name: string;
  exam_date: string;
  exam_time: string;
  created_at: string;
  devices: {
    name: string;
    user_id: string;
  };
}

export interface ExamTiming {
  startTime: string;
  endTime: string;
} 