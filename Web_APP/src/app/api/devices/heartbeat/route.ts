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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceIp, status = 'online', deviceInfo = {} } = body;
    
    if (!deviceIp) {
      return NextResponse.json({ error: 'Device IP is required' }, { status: 400 });
    }

    // Update device heartbeat with explicit UTC timestamp
    const utcTimestamp = new Date().toISOString();
    
    const { error } = await supabaseServiceRole
      .from('device_heartbeats')
      .upsert({
        device_ip: deviceIp,
        last_seen: utcTimestamp,
        status,
        device_info: deviceInfo
      });

    if (error) {
      console.error('Error updating heartbeat:', error);
      return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in heartbeat endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 