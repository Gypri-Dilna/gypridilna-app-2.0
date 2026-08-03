import axios from 'axios';
import { User, RfidChip, InventoryItem, MapZone, AuditLog } from '../types';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('jwt_token', res.data.access_token);
    localStorage.setItem('username', res.data.username);
    localStorage.setItem('role', res.data.role);
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  },
  getToken: () => localStorage.getItem('jwt_token'),
};

export const hardwareService = {
  unlockDoor: async () => {
    const res = await api.get('/manual-override');
    return res.data;
  },
  setServiceMode: async (enabled: boolean) => {
    const res = await api.get(`/service-mode?enabled=${enabled}`);
    return res.data;
  },
  getServiceModeStatus: async () => {
    const res = await api.get('/service-mode-status');
    return res.data.enabled as boolean;
  },
  getLastUnknownChip: async () => {
    const res = await api.get('/last-unknown-chip');
    return res.data.chip_id as string | null;
  },
};

export const inventoryService = {
  list: async (search?: string, rack?: number) => {
    const params: Record<string, any> = {};
    if (search) params.search = search;
    if (rack !== undefined) params.rack = rack;
    const res = await api.get<InventoryItem[]>('/inventory', { params });
    return res.data;
  },
  getItem: async (idOrCode: string) => {
    const res = await api.get<InventoryItem>(`/inventory/${encodeURIComponent(idOrCode)}`);
    return res.data;
  },
  create: async (data: { name: string; rack: number; pozice: number; box?: number; category?: string; note?: string; photo_url?: string }) => {
    const res = await api.post<InventoryItem>('/inventory', data);
    return res.data;
  },
  update: async (id: string, data: Partial<InventoryItem>) => {
    const res = await api.put<InventoryItem>(`/inventory/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/inventory/${id}`);
    return res.data;
  },
  queueLabelPrint: async (itemCode: string, itemName: string) => {
    const res = await api.post(`/print/label?item_code=${encodeURIComponent(itemCode)}&item_name=${encodeURIComponent(itemName)}`);
    return res.data;
  },
};

export const chipService = {
  list: async () => {
    const res = await api.get<RfidChip[]>('/chips');
    return res.data;
  },
  create: async (data: { chip_id: string; name: string; is_allowed?: boolean; is_one_time?: boolean }) => {
    const res = await api.post<RfidChip>('/chips', data);
    return res.data;
  },
};

export const userService = {
  list: async () => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
  create: async (data: { username: string; password: string; full_name: string; role: string; permissions: string[] }) => {
    const res = await api.post<User>('/users', data);
    return res.data;
  },
};

export const mapService = {
  getZones: async () => {
    const res = await api.get<MapZone[]>('/map/zones');
    return res.data;
  },
  createZone: async (data: Omit<MapZone, 'id'>) => {
    const res = await api.post<MapZone>('/map/zones', data);
    return res.data;
  },
  updateZone: async (id: number, data: Partial<MapZone>) => {
    const res = await api.put<MapZone>(`/map/zones/${id}`, data);
    return res.data;
  },
};

export const logService = {
  getLogs: async (limit = 20) => {
    const res = await api.get<AuditLog[]>(`/logs?limit=${limit}`);
    return res.data;
  },
};
