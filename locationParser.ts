export interface ParsedLocation {
    rack: number;       // X: Rack / Wall / Shelf Number
    sector: number;     // Y: Shelf / Sector Number
    box: number;        // Z: Box Number (0 if no box)
    itemId: string;     // AAA: 3-digit Item ID (e.g. "001", "012", "123")
    formatted: string;  // XY-ZAAA
    description: string;
}

export function parseLocationCode(code: string): ParsedLocation | null {
    if (!code || typeof code !== 'string') return null;
    const clean = code.trim().toUpperCase();
    
    // Match XY-ZAAA (e.g. 12-0123, 34-5674)
    const match = clean.match(/^(\d)(\d)-(\d)(\d{3})$/);
    if (!match) {
        return null;
    }

    const rack = parseInt(match[1], 10);
    const sector = parseInt(match[2], 10);
    const box = parseInt(match[3], 10);
    const itemId = match[4];

    const boxDesc = box === 0 ? "No Box (Direct on shelf)" : `Box #${box}`;
    const description = `Rack/Wall #${rack}, Sector/Shelf #${sector}, ${boxDesc}, Item ID #${itemId}`;

    return {
        rack,
        sector,
        box,
        itemId,
        formatted: `${rack}${sector}-${box}${itemId}`,
        description
    };
}

export function formatLocationCode(rack: number, sector: number, box: number, itemId: number | string): string {
    const r = Math.max(0, Math.min(9, rack));
    const s = Math.max(0, Math.min(9, sector));
    const b = Math.max(0, Math.min(9, box));
    
    let numStr = String(itemId).padStart(3, '0');
    if (numStr.length > 3) {
        numStr = numStr.slice(-3);
    }

    return `${r}${s}-${b}${numStr}`;
}

// Automatically calculate next available sequential 3-digit AAA item ID (filling in deleted gaps) for location prefix XY-Z
export function getNextSequenceForItem(
    items: { location_code: string }[],
    rack: number,
    sector: number,
    box: number
): string {
    const prefix = `${rack}${sector}-${box}`;
    const usedIds = new Set<number>();

    for (const item of items) {
        if (item.location_code && item.location_code.startsWith(prefix)) {
            const parsed = parseLocationCode(item.location_code);
            if (parsed) {
                const idVal = parseInt(parsed.itemId, 10);
                if (!isNaN(idVal) && idVal > 0) {
                    usedIds.add(idVal);
                }
            }
        }
    }

    // Find the smallest missing integer starting from 1 (reuses deleted IDs)
    let nextId = 1;
    while (usedIds.has(nextId)) {
        nextId++;
    }

    return String(nextId).padStart(3, '0');
}

// Convert Rack # (X) to approximate coordinates on Dílna floorplan outline (0-100%)
export function getRackCoordinates(rackNumber: number): { x: number; y: number } {
    switch (rackNumber) {
        case 1:
            return { x: 20, y: 25 }; // Rack 1: West Wall (Woodworking)
        case 2:
            return { x: 45, y: 25 }; // Rack 2: North Center Rack
        case 3:
            return { x: 75, y: 25 }; // Rack 3: East Wall (Metal Lab)
        case 4:
            return { x: 20, y: 70 }; // Rack 4: South West (Electronics)
        case 5:
            return { x: 55, y: 70 }; // Rack 5: South Center (3D Print)
        case 6:
            return { x: 82, y: 70 }; // Rack 6: South East (Entrance Door)
        case 7:
            return { x: 20, y: 50 }; // Rack 7: Middle West Wall (id X7)
        case 8:
            return { x: 20, y: 90 }; // Rack 8: Bottom West Wall (ids X8Y1, X8Y2, X8Y3)
        default:
            return { x: 50, y: 50 }; // Center Default
    }
}
