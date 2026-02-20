import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { addAttendanceReport, getDeviceByIpAddress } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const deviceIp = formData.get('deviceIp') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!deviceIp) {
      return NextResponse.json({ error: 'No device IP address provided' }, { status: 400 });
    }

    // Find device by IP address
    const { data: device, error: deviceError } = await getDeviceByIpAddress(deviceIp);
    
    if (deviceError || !device) {
      return NextResponse.json({ 
        error: `Device with IP address ${deviceIp} not found. Please make sure the device is registered in your account.` 
      }, { status: 404 });
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Invalid file type. Only Excel files are allowed.' }, { status: 400 });
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    if (data.length < 2) {
      return NextResponse.json({ error: 'Excel file must contain at least a header row and one data row' }, { status: 400 });
    }

    // Validate headers - only require Student_Name and Status
    const headers = data[0];
    const requiredHeaders = ['Student_Name', 'Status'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}. Required: Student_Name, Status` 
      }, { status: 400 });
    }

    // Get column indices - only need name and status
    const nameIndex = headers.indexOf('Student_Name');
    const statusIndex = headers.indexOf('Status');

    // Process data rows
    const students = data.slice(1).filter(row => row[nameIndex] && row[statusIndex]);
    
    if (students.length === 0) {
      return NextResponse.json({ error: 'No valid student data found in Excel file' }, { status: 400 });
    }

    // Calculate statistics
    let presentCount = 0;
    let absentCount = 0;
    
    for (const student of students) {
      const status = student[statusIndex]?.toString().toLowerCase();
      
      if (status === 'present') {
        presentCount++;
      } else if (status === 'absent') {
        absentCount++;
      } else {
        return NextResponse.json({ 
          error: `Invalid status "${student[statusIndex]}" for student "${student[nameIndex]}". Status must be "Present" or "Absent"` 
        }, { status: 400 });
      }
    }

    const totalStudents = presentCount + absentCount;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    // Extract time from filename or use current time
    // Get current time in Morocco timezone (UTC+1)
    const moroccoTime = new Date(Date.now() + (1 * 60 * 60 * 1000)); // Add 1 hour for Morocco timezone
    let examTime = moroccoTime.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    // Try to extract time from filename (format: attendance_devicename_YYYYMMDD_HHMMSS.xlsx)
    const filenameMatch = file.name.match(/attendance_.*_\d{8}_(\d{2})(\d{2})(\d{2})/);
    if (filenameMatch) {
      examTime = `${filenameMatch[1]}:${filenameMatch[2]}:${filenameMatch[3]}`;
    }

    // Always use current date when file is received (in Morocco timezone)
    const examDate = moroccoTime.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Save to database using the device UUID we found
    const { error } = await addAttendanceReport(
      device.id, // Use the UUID we found from the IP address
      totalStudents,
      presentCount,
      absentCount,
      attendanceRate,
      file.name,
      examDate,
      examTime
    );

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save attendance report to database' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Attendance report processed successfully',
      data: {
        deviceName: device.name,
        deviceIp: device.ip_address,
        totalStudents,
        presentStudents: presentCount,
        absentStudents: absentCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        fileName: file.name,
        examDate,
        examTime
      }
    });

  } catch (error) {
    console.error('Error processing attendance report:', error);
    return NextResponse.json({ 
      error: 'Internal server error while processing attendance report' 
    }, { status: 500 });
  }
} 