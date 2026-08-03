

export enum AccessResult {
    GRANTED = 'GRANTED',
    GRANTED_OVERRIDE = 'GRANTED (OVERRIDE)',
    GRANTED_MOBILE = 'GRANTED (MOBILE)',
    DENIED_BLOCKED = 'DENIED (BLOCKED)',
    DENIED_UNKNOWN = 'DENIED (UNKNOWN_CHIP)',
    DENIED_EXPIRED = 'DENIED (EXPIRED)',
}

export interface Chip {
    id: number;
    chip_id: string;
    name: string;
    is_allowed: boolean;
    is_one_time: boolean;
    valid_until: string | null; // ISO 8601 string
}

export interface AccessLog {
    id: number;
    timestamp: string; // ISO 8601 string
    chip_id: string;
    name: string;
    result: AccessResult;
}

export interface Permissions {
    service_mode: boolean;
    add_chips: boolean;
    view_logs: boolean;
    remote_opening: boolean;
    erase_logs: boolean;
}

export interface User {
    id: number;
    username: string;
    is_admin: boolean;
    permissions: Permissions;
    chip_id: string | null;
}

// FIX: Add missing type definitions for Presence and HistoricalPresence, which are used in PresenceViewer.tsx.
export interface Presence {
    chip_id: string;
    name: string;
    entry_time: string; // ISO 8601 string
}

export interface HistoricalPresence {
    chip_id: string;
    name: string;
    entry_time: string; // ISO 8601 string
}