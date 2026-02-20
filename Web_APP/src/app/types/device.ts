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