import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for task creation
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceIp, taskType, fileUrl, fileName, payload } = body;
    
    if (!deviceIp || !taskType) {
      return NextResponse.json({ 
        error: 'Device IP and task type are required' 
      }, { status: 400 });
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Create supabase client with the auth header
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Verify user owns this device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('ip_address', deviceIp)
      .eq('user_id', user.id)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ 
        error: 'Device not found or not owned by user' 
      }, { status: 404 });
    }

    // Create task using service role to bypass RLS
    const { data: task, error: taskError } = await supabaseServiceRole
      .from('device_tasks')
      .insert({
        device_ip: deviceIp,
        task_type: taskType,
        file_url: fileUrl,
        file_name: fileName,
        payload: payload || {},
        status: 'pending'
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      taskId: task?.id,
      message: `Task queued for device ${deviceIp}`
    });

  } catch (error) {
    console.error('Error in queue-task endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 