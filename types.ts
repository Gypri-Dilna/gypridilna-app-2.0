export enum AccessResult {
    GRANTED = 'GRANTED',
    GRANTED_REMOTE = 'GRANTED (REMOTE)',
    GRANTED_SERVICE = 'GRANTED (SERVICE)',
    DENIED_BLOCKED = 'DENIED (BLOCKED)',
    DENIED_UNKNOWN = 'DENIED (UNKNOWN_CHIP)',
    DENIED_EXPIRED = 'DENIED (EXPIRED)',
}

export interface Permissions {
    service_mode: boolean;
    add_chips: boolean;
    view_logs: boolean;
    remote_opening: boolean;
    erase_logs: boolean;
    inventory_edit: boolean;
}

export interface User {
    id: number;
    username: string;
    email?: string | null;
    is_admin: boolean;
    permissions: Permissions;
    chip_id: string | null;
    picture_url?: string | null;
}

export interface Chip {
    id: number;
    chip_id: string;
    name: string;
    is_allowed: boolean;
    is_one_time: boolean;
    valid_until: string | null;
}

export interface AccessLog {
    id: number;
    timestamp: string;
    chip_id: string;
    name: string;
    result: string;
}

export interface InventoryItem {
    id: number;
    title: string;
    category: string;
    quantity: number;
    unit: string;
    min_quantity: number;
    location_code: string;
    location_x: float;
    location_y: float;
    zone: string;
    qr_code: string;
    notes?: string;
    last_updated?: string;
}

export interface MapZone {
    id: number;
    name: string;
    code: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    description?: string;
}

export interface PrintLabelData {
    title: string;
    qr_code: string;
    location_code: string;
    category: string;
    quantity: number;
    unit: string;
}

export interface PrintQueueItem {
    item: InventoryItem;
    tape_size: '18mm' | '9mm';
    addedAt: number;
}

type float = number;