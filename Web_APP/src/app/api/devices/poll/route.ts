import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceIp = searchParams.get('deviceIp');
    
    if (!deviceIp) {
      return NextResponse.json({ error: 'Device IP is required' }, { status: 400 });
    }

    // Update heartbeat first
    await supabaseServiceRole
      .from('device_heartbeats')
      .upsert({
        device_ip: deviceIp,
        last_seen: new Date().toISOString(),
        status: 'online'
      });

    // Get pending tasks for this device
    const { data: tasks, error } = await supabaseServiceRole
      .from('device_tasks')
      .select('*')
      .eq('device_ip', deviceIp)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5); // Limit to 5 tasks per poll

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json({ 
      tasks: tasks || [],
      deviceIp,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in poll endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, status, result } = body;
    
    if (!taskId || !status) {
      return NextResponse.json({ error: 'Task ID and status are required' }, { status: 400 });
    }

    // Update task status
    const { error } = await supabaseServiceRole
      .from('device_tasks')
      .update({
        status,
        completed_at: new Date().toISOString(),
        payload: result ? { result } : null
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 