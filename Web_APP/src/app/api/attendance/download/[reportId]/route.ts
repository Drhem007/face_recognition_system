import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that can bypass RLS
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    // Get the attendance report from database using service role (bypasses RLS)
    const { data: report, error: reportError } = await supabaseServiceRole
      .from('attendance_reports')
      .select(`
        *,
        devices!inner(name, ip_address)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate sample attendance data based on the report statistics
    const attendanceData = [];
    
    // Add header row
    attendanceData.push(['Student_Name', 'Status', 'Date']);
    
    // Generate sample student data based on the statistics
    const presentCount = report.present_students;
    const absentCount = report.absent_students;
    
    // Generate present students
    for (let i = 1; i <= presentCount; i++) {
      attendanceData.push([
        `Student ${i.toString().padStart(3, '0')}`,
        'Present',
        report.exam_date
      ]);
    }
    
    // Generate absent students
    for (let i = 1; i <= absentCount; i++) {
      attendanceData.push([
        `Student ${(presentCount + i).toString().padStart(3, '0')}`,
        'Absent',
        report.exam_date
      ]);
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(attendanceData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Extract original filename without extension from the stored file_name
    const getOriginalFileName = (fileName: string) => {
      // Remove the extension first
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      // Check if it has the pattern: originalname_YYYY-MM-DD_HH-MM_HH-MM
      // This pattern is added by the ConfigureModal when uploading
      const match = nameWithoutExt.match(/^(.+)_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_\d{2}-\d{2}$/);
      
      if (match) {
        return match[1]; // Return the original name part
      }
      
      // If no pattern match, return the name without extension
      return nameWithoutExt;
    };

    const originalFileName = getOriginalFileName(report.file_name);
    const deviceName = report.devices.name.replace(/\s+/g, '_');
    const formattedDate = report.exam_date.replace(/-/g, '');
    const formattedTime = report.exam_time.replace(/:/g, '');
    
    // Create filename: originalname_device_YYYYMMDD_HHMMSS.xlsx
    const fileName = `${originalFileName}_${deviceName}_${formattedDate}_${formattedTime}.xlsx`;
    
    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating Excel download:', error);
    return NextResponse.json({ 
      error: 'Internal server error while generating download' 
    }, { status: 500 });
  }
} 