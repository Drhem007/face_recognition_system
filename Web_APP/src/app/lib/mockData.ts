// ============================================================
// ⚠️  DEMO MODE — MOCK DATA FILE
// ============================================================
// This file is used for showcase/demo purposes only.
// Supabase is bypassed; any email + any password will log in.
//
// TO REMOVE DEMO MODE:
//   1. Delete this file (src/app/lib/mockData.ts)
//   2. In AuthContext.tsx  → set DEMO_MODE = false  (or delete the block)
//   3. In DeviceContext.tsx → remove the DEMO_MODE guard and mock branch
//   4. In AttendanceContext.tsx → remove the DEMO_MODE guard and mock branch
// ============================================================

import { Device } from '../types';
import { AttendanceReport } from '../types';

// ---- Mock Credentials (for display hint on sign-in page) ----
export const MOCK_EMAIL = 'admin@epa-demo.ma';
export const MOCK_PASSWORD = 'demo1234';

// ---- Mock User -----------------------------------------------
export const MOCK_USER = {
    id: 'demo-user-001',
    email: MOCK_EMAIL,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-09-01T08:00:00Z',
    app_metadata: {},
    user_metadata: { full_name: 'Admin Demo' },
};

// ---- Mock Devices --------------------------------------------
export const MOCK_DEVICES: Device[] = [
    {
        id: 'device-001',
        name: 'Lab A — Pi Camera',
        ip_address: '192.168.1.101',
        user_id: 'demo-user-001',
        created_at: '2025-01-10T09:00:00Z',
    },
    {
        id: 'device-002',
        name: 'Amphithéâtre B',
        ip_address: '192.168.1.102',
        user_id: 'demo-user-001',
        created_at: '2025-01-15T10:30:00Z',
    },
    {
        id: 'device-003',
        name: 'Salle Info 3',
        ip_address: '192.168.1.103',
        user_id: 'demo-user-001',
        created_at: '2025-02-01T08:15:00Z',
    },
    {
        id: 'device-004',
        name: 'Entrée Principale',
        ip_address: '192.168.1.104',
        user_id: 'demo-user-001',
        created_at: '2025-02-10T11:00:00Z',
    },
];

// ---- Mock Attendance Reports ---------------------------------
export const MOCK_REPORTS: AttendanceReport[] = [
    {
        id: 'report-001',
        deviceId: 'device-001',
        deviceName: 'Lab A — Pi Camera',
        date: '2025-02-17',
        time: '08:30',
        totalStudents: 35,
        presentStudents: 32,
        absentStudents: 3,
        attendanceRate: 91.4,
        fileName: 'GL3_Algo_2025-02-17_08-30_10-00.xlsx',
    },
    {
        id: 'report-002',
        deviceId: 'device-002',
        deviceName: 'Amphithéâtre B',
        date: '2025-02-17',
        time: '10:00',
        totalStudents: 120,
        presentStudents: 110,
        absentStudents: 10,
        attendanceRate: 91.7,
        fileName: 'GI2_Reseaux_2025-02-17_10-00_12-00.xlsx',
    },
    {
        id: 'report-003',
        deviceId: 'device-001',
        deviceName: 'Lab A — Pi Camera',
        date: '2025-02-18',
        time: '14:00',
        totalStudents: 35,
        presentStudents: 28,
        absentStudents: 7,
        attendanceRate: 80.0,
        fileName: 'GL3_BDD_2025-02-18_14-00_16-00.xlsx',
    },
    {
        id: 'report-004',
        deviceId: 'device-003',
        deviceName: 'Salle Info 3',
        date: '2025-02-18',
        time: '08:30',
        totalStudents: 42,
        presentStudents: 40,
        absentStudents: 2,
        attendanceRate: 95.2,
        fileName: 'GI3_IA_2025-02-18_08-30_10-30.xlsx',
    },
    {
        id: 'report-005',
        deviceId: 'device-002',
        deviceName: 'Amphithéâtre B',
        date: '2025-02-19',
        time: '09:00',
        totalStudents: 98,
        presentStudents: 85,
        absentStudents: 13,
        attendanceRate: 86.7,
        fileName: 'GE2_Maths_2025-02-19_09-00_11-00.xlsx',
    },
    {
        id: 'report-006',
        deviceId: 'device-004',
        deviceName: 'Entrée Principale',
        date: '2025-02-19',
        time: '13:30',
        totalStudents: 55,
        presentStudents: 53,
        absentStudents: 2,
        attendanceRate: 96.4,
        fileName: 'GL2_DevWeb_2025-02-19_13-30_15-30.xlsx',
    },
    {
        id: 'report-007',
        deviceId: 'device-003',
        deviceName: 'Salle Info 3',
        date: '2025-02-20',
        time: '10:00',
        totalStudents: 42,
        presentStudents: 38,
        absentStudents: 4,
        attendanceRate: 90.5,
        fileName: 'GI3_SystemeEmbarque_2025-02-20_10-00_12-00.xlsx',
    },
];

// ---- Mock Device Online Statuses ----------------------------
export const MOCK_DEVICE_STATUSES: Record<string, boolean> = {
    '192.168.1.101': true,
    '192.168.1.102': true,
    '192.168.1.103': false,
    '192.168.1.104': true,
};
