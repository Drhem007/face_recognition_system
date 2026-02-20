'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceReport, AttendanceReportDB } from '../types';
import { getAttendanceReports, addAttendanceReport, deleteAttendanceReport } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// ============================================================
// ⚠️  DEMO MODE FLAG
// Set DEMO_MODE = false (and remove mock imports) to restore
// real Supabase attendance report fetching.
// ============================================================
import { MOCK_REPORTS, MOCK_DEVICES } from '../lib/mockData';
const DEMO_MODE = true;
// ============================================================

interface AttendanceContextType {
  reports: AttendanceReport[];
  isLoading: boolean;
  addReport: (
    deviceId: string,
    totalStudents: number,
    presentStudents: number,
    absentStudents: number,
    attendanceRate: number,
    fileName: string,
    examDate: string,
    examTime: string
  ) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendanceContext = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendanceContext must be used within an AttendanceProvider');
  }
  return context;
};

// Helper function to transform database data to frontend format
const transformReportData = (dbReport: AttendanceReportDB): AttendanceReport => {
  return {
    id: dbReport.id,
    deviceId: dbReport.device_id,
    deviceName: dbReport.devices.name,
    date: dbReport.exam_date,
    time: dbReport.exam_time,
    totalStudents: dbReport.total_students,
    presentStudents: dbReport.present_students,
    absentStudents: dbReport.absent_students,
    attendanceRate: dbReport.attendance_rate,
    fileName: dbReport.file_name
  };
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  const fetchReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    // ===DEMO MODE=== return mock reports without hitting Supabase
    if (DEMO_MODE) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate network delay
      setReports(MOCK_REPORTS);
      setIsLoading(false);
      return;
    }
    // ===END DEMO MODE===

    try {
      setIsLoading(true);
      const { data, error } = await getAttendanceReports();

      if (error) {
        console.error('Error fetching attendance reports:', error);
        if (!error.message.includes('not authenticated')) {
          toast.error('Failed to load attendance reports');
        }
        setReports([]);
        return;
      }

      if (data) {
        const transformedReports = data.map(transformReportData);
        setReports(transformedReports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching attendance reports:', error);
      if (user) {
        toast.error('Failed to load attendance reports');
      }
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addReport = async (
    deviceId: string,
    totalStudents: number,
    presentStudents: number,
    absentStudents: number,
    attendanceRate: number,
    fileName: string,
    examDate: string,
    examTime: string
  ) => {
    if (!user) {
      toast.error('Please sign in to add attendance reports');
      return;
    }

    // ===DEMO MODE=== add report only to local state
    if (DEMO_MODE) {
      const deviceName = MOCK_DEVICES.find(d => d.id === deviceId)?.name ?? 'Unknown Device';
      const newReport: AttendanceReport = {
        id: `report-${Date.now()}`,
        deviceId,
        deviceName,
        date: examDate,
        time: examTime,
        totalStudents,
        presentStudents,
        absentStudents,
        attendanceRate,
        fileName,
      };
      setReports(prev => [newReport, ...prev]);
      toast.success('Attendance report added successfully');
      return;
    }
    // ===END DEMO MODE===

    try {
      const { data, error } = await addAttendanceReport(
        deviceId,
        totalStudents,
        presentStudents,
        absentStudents,
        attendanceRate,
        fileName,
        examDate,
        examTime
      );

      if (error) {
        console.error('Error adding attendance report:', error);
        toast.error('Failed to add attendance report');
        return;
      }

      if (data && data[0]) {
        await fetchReports();
        toast.success('Attendance report added successfully');
      }
    } catch (error) {
      console.error('Unexpected error adding attendance report:', error);
      toast.error('Failed to add attendance report');
    }
  };

  const deleteReport = async (id: string) => {
    if (!user) {
      toast.error('Please sign in to delete attendance reports');
      return;
    }

    // ===DEMO MODE=== remove report only from local state
    if (DEMO_MODE) {
      setReports(prev => prev.filter(report => report.id !== id));
      toast.success('Attendance report deleted successfully');
      return;
    }
    // ===END DEMO MODE===

    try {
      const { error } = await deleteAttendanceReport(id);

      if (error) {
        console.error('Error deleting attendance report:', error);
        toast.error('Failed to delete attendance report');
        return;
      }

      setReports(prev => prev.filter(report => report.id !== id));
      toast.success('Attendance report deleted successfully');
    } catch (error) {
      console.error('Unexpected error deleting attendance report:', error);
      toast.error('Failed to delete attendance report');
    }
  };

  const refreshReports = async () => {
    await fetchReports();
  };

  useEffect(() => {
    if (!authLoading) {
      fetchReports();
    }
  }, [user, authLoading, fetchReports]);

  const value: AttendanceContextType = {
    reports,
    isLoading,
    addReport,
    deleteReport,
    refreshReports
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};