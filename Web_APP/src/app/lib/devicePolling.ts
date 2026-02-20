import { supabase } from './supabase';

// Queue a task for a device
export const queueDeviceTask = async (
  deviceIp: string, 
  taskType: string, 
  fileUrl?: string, 
  fileName?: string, 
  payload?: Record<string, unknown>
) => {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch('/api/devices/queue-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      deviceIp,
      taskType,
      fileUrl,
      fileName,
      payload
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to queue task');
  }

  return response.json();
};

// Check if device is online based on heartbeat
export const isDeviceOnline = async (deviceIp: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('device_heartbeats')
      .select('last_seen')
      .eq('device_ip', deviceIp)
      .single();

    if (error || !data) {
      return false;
    }

    // Device is online if heartbeat is within last 2 minutes
    // Use UTC for both timestamps to avoid timezone issues
    const lastSeen = new Date(data.last_seen + 'Z'); // Ensure UTC parsing
    const now = new Date(); // This is already in UTC when sent to server
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    return diffMinutes <= 2;
  } catch (error) {
    console.error('Error checking device status:', error);
    return false;
  }
};

// Get all device statuses for user's devices
export const getDeviceStatuses = async (): Promise<Record<string, boolean>> => {
  try {
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('ip_address');

    if (devicesError || !devices) {
      return {};
    }

    const deviceIps = devices.map(d => d.ip_address);
    
    const { data: heartbeats, error: heartbeatsError } = await supabase
      .from('device_heartbeats')
      .select('device_ip, last_seen')
      .in('device_ip', deviceIps);

    if (heartbeatsError) {
      return {};
    }

    const statuses: Record<string, boolean> = {};
    const now = new Date();

    // Initialize all devices as offline
    deviceIps.forEach(ip => {
      statuses[ip] = false;
    });

    // Update status for devices with recent heartbeats
    heartbeats?.forEach(hb => {
      const lastSeen = new Date(hb.last_seen + 'Z'); // Ensure UTC parsing
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      
      statuses[hb.device_ip] = diffMinutes <= 2;
    });

    return statuses;
  } catch (error) {
    console.error('Error getting device statuses:', error);
    return {};
  }
};

// Get pending tasks count for a device
export const getPendingTasksCount = async (deviceIp: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('device_tasks')
      .select('id', { count: 'exact' })
      .eq('device_ip', deviceIp)
      .eq('status', 'pending');

    if (error) {
      console.error('Error getting pending tasks count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting pending tasks count:', error);
    return 0;
  }
}; 