export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
  permissions: string[];
  is_active: boolean;
}

export interface RfidChip {
  id: number;
  chip_id: string;
  name: string;
  is_allowed: boolean;
  is_one_time: boolean;
  expires_at?: string;
}

export interface InventoryItem {
  id: string;
  item_code: string; // XY-ZAAA e.g. 61-0001
  name: string;
  rack: number;
  pozice: number;
  box: number;
  number: number;
  category?: string;
  note?: string;
  barcode: string;
  photo_url?: string;
  created_at: string;
}

export interface MapZone {
  id: number;
  zone_code: string;
  rack_number: number;
  display_name: string;
  grid_x: number;
  grid_y: number;
  width: number;
  height: number;
  color_hex: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  actor_name: string;
  result: string;
  details?: Record<string, any>;
}
