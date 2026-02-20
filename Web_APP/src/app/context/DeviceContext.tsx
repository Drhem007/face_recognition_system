"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Device } from '../types';
import { getDevices, addDevice as addDeviceToSupabase, deleteDevice as deleteDeviceFromSupabase, updateDevice as updateDeviceInSupabase } from '../lib/supabase';
import { Device as SupabaseDevice } from '../types/device';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// ============================================================
// ⚠️  DEMO MODE FLAG
// Set DEMO_MODE = false (and remove mock imports) to restore
// real Supabase device fetching.
// ============================================================
import { MOCK_DEVICES, MOCK_DEVICE_STATUSES } from '../lib/mockData';
const DEMO_MODE = true;
// ============================================================

interface DeviceContextType {
  devices: Device[];
  addDevice: (name: string, ip_address: string) => void;
  updateDevice: (id: string, name: string, ip_address: string) => void;
  removeDevice: (id: string) => void;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Local storage key for caching
const DEVICES_CACHE_KEY = 'devices_cache';
const CACHE_TIMESTAMP_KEY = 'devices_cache_timestamp';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  // Load cached devices
  const loadCachedDevices = useCallback(() => {
    if (!user) return null;

    try {
      const cachedTimestampStr = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!cachedTimestampStr) return null;

      const cachedTimestamp = parseInt(cachedTimestampStr);
      const now = Date.now();

      if (now - cachedTimestamp < CACHE_EXPIRY_TIME) {
        const cachedDevicesStr = localStorage.getItem(DEVICES_CACHE_KEY);
        if (cachedDevicesStr) {
          return JSON.parse(cachedDevicesStr);
        }
      }
    } catch (error) {
      console.error('Error loading cached devices:', error);
    }
    return null;
  }, [user]);

  // Cache devices
  const cacheDevices = useCallback((devicesToCache: Device[]) => {
    if (!user) return;

    try {
      localStorage.setItem(DEVICES_CACHE_KEY, JSON.stringify(devicesToCache));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching devices:', error);
    }
  }, [user]);

  const refreshDevices = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // ===DEMO MODE=== return mock devices without hitting Supabase
    if (DEMO_MODE) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 400)); // simulate network
      setDevices(MOCK_DEVICES);
      setIsLoading(false);
      return;
    }
    // ===END DEMO MODE===

    setIsLoading(true);
    try {
      const { data, error } = await getDevices();

      if (error) {
        toast.error('Failed to load devices');
        console.error('Error fetching devices:', error);
      } else {
        const formattedDevices = (data || []).map((device: SupabaseDevice) => ({
          id: device.id,
          name: device.name,
          ip_address: device.ip_address,
          user_id: device.user_id,
          created_at: device.created_at
        }));
        setDevices(formattedDevices);
        cacheDevices(formattedDevices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, [user, cacheDevices]);

  useEffect(() => {
    if (user && !authLoading) {
      // ===DEMO MODE=== skip cache, just load mock devices
      if (DEMO_MODE) {
        refreshDevices();
        return;
      }
      // ===END DEMO MODE===

      const cachedDevices = loadCachedDevices();
      if (cachedDevices) {
        setDevices(cachedDevices);
        setIsLoading(false);
        refreshDevices().catch(console.error);
      } else {
        refreshDevices();
      }
    } else if (!authLoading && !user) {
      setDevices([]);
      setIsLoading(false);
    }
  }, [user, authLoading, loadCachedDevices, refreshDevices]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !DEMO_MODE) {
        refreshDevices().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshDevices]);

  const addDevice = async (name: string, ip_address: string) => {
    if (!user) {
      toast.error('You must be logged in to add a device');
      return;
    }

    // ===DEMO MODE=== add device only to local state
    if (DEMO_MODE) {
      const newDevice: Device = {
        id: `device-${Date.now()}`,
        name,
        ip_address,
        user_id: 'demo-user-001',
        created_at: new Date().toISOString(),
      };
      setDevices(prev => [...prev, newDevice]);
      toast.success('Device added successfully');
      return;
    }
    // ===END DEMO MODE===

    try {
      const tempId = `temp-${Date.now()}`;
      const newDevice: Device = {
        id: tempId,
        name,
        ip_address,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      setDevices(prev => [...prev, newDevice]);

      const { error } = await addDeviceToSupabase(name, ip_address);

      if (error) {
        setDevices(prev => prev.filter(d => d.id !== tempId));
        toast.error('Failed to add device');
      } else {
        toast.success('Device added successfully');
        await refreshDevices();
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
    }
  };

  const updateDevice = async (id: string, name: string, ip_address: string) => {
    if (!user) {
      toast.error('You must be logged in to update a device');
      return;
    }

    // ===DEMO MODE=== update only local state
    if (DEMO_MODE) {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, name, ip_address } : d));
      toast.success('Device updated successfully');
      return;
    }
    // ===END DEMO MODE===

    try {
      const originalDevice = devices.find(d => d.id === id);
      setDevices(prev => prev.map(device => device.id === id ? { ...device, name, ip_address } : device));

      const { error } = await updateDeviceInSupabase(id, name, ip_address);

      if (error) {
        if (originalDevice) {
          setDevices(prev => prev.map(d => d.id === id ? originalDevice : d));
        }
        toast.error('Failed to update device');
      } else {
        cacheDevices(devices.map(d => d.id === id ? { ...d, name, ip_address } : d));
        toast.success('Device updated successfully');
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  };

  const removeDevice = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to remove a device');
      return;
    }

    // ===DEMO MODE=== remove only from local state
    if (DEMO_MODE) {
      setDevices(prev => prev.filter(d => d.id !== id));
      toast.success('Device deleted successfully');
      return;
    }
    // ===END DEMO MODE===

    try {
      const deviceToRemove = devices.find(d => d.id === id);
      setDevices(prev => prev.filter(device => device.id !== id));
      cacheDevices(devices.filter(d => d.id !== id));

      const { error } = await deleteDeviceFromSupabase(id);
      if (error) {
        if (deviceToRemove) {
          setDevices(prev => [...prev, deviceToRemove]);
          cacheDevices([...devices.filter(d => d.id !== id), deviceToRemove]);
        }
        toast.error('Failed to delete device');
      } else {
        toast.success('Device deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  return (
    <DeviceContext.Provider value={{
      devices,
      addDevice,
      updateDevice,
      removeDevice,
      isLoading,
      refreshDevices
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
}
