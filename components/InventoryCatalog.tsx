import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import { 
    InventoryIcon, SearchIcon, PlusIcon, MinusIcon, 
    PrinterIcon, MapPinIcon, FilterIcon, TrashIcon, EditIcon, 
    CloseIcon
} from './icons';
import { LabelPrinterModal } from './LabelPrinterModal';
import { DilnaFloorplanOutline } from './DilnaFloorplanOutline';
import { parseLocationCode, formatLocationCode } from '../locationParser';

interface InventoryCatalogProps {
    items: InventoryItem[];
    user: User;
    onAddItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
    onUpdateItem: (item: InventoryItem) => Promise<void>;
    onDeleteItem: (id: number) => Promise<void>;
    onAdjustStock: (id: number, delta: number) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const InventoryCatalog: React.FC<InventoryCatalogProps> = ({
    items,
    user,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onAdjustStock,
    showToast
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);
    const [viewingLocationItem, setViewingLocationItem] = useState<InventoryItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Categories list derived dynamically
    const categories = useMemo(() => {
        const set = new Set(items.map(i => i.category));
        return ['ALL', ...Array.from(set).sort()];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
            if (search) {
                const term = search.toLowerCase();
                return (
                    item.title.toLowerCase().includes(term) ||
                    item.location_code.toLowerCase().includes(term) ||
                    item.qr_code.toLowerCase().includes(term) ||
                    item.zone.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [items, search, selectedCategory]);

    const canEdit = user.is_admin || user.permissions?.inventory_edit !== false;

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-dark border border-brand-border p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <InventoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Workshop Inventory</h1>
                        <p className="text-xs text-gray-300">Tool, Part & Consumables Catalog (XY-ZAAA Scheme)</p>
                    </div>
                </div>

                {canEdit && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black text-xs font-bold rounded-xl transition"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add New Item
                    </button>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-brand-dark border border-brand-border p-4 rounded-2xl">
                <div className="relative flex-1 min-w-[240px]">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, location code (XY-ZAAA e.g. 12-0123), SKU..."
                        className="w-full pl-10 pr-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-teal"
                    />
                </div>

                {/* Category Select */}
                <div className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4 text-gray-400" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-brand-darker border border-brand-border text-xs rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-brand-teal"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'ALL' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-brand-dark border border-brand-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-darker border-b border-brand-border text-[11px] font-mono uppercase tracking-wider text-gray-400">
                                <th className="px-5 py-3.5">Item Name & SKU</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5">Location Code (XY-ZAAA)</th>
                                <th className="px-5 py-3.5">Quantity</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const parsedLoc = parseLocationCode(item.location_code);
                                    return (
                                        <tr key={item.id} className="hover:bg-brand-darker/60 transition">
                                            {/* Title & SKU */}
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-white text-sm">{item.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-mono text-[10px] text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/30">
                                                        {item.qr_code}
                                                    </span>
                                                    {item.notes && (
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                                            {item.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-4 font-semibold text-gray-300">
                                                {item.category}
                                            </td>

                                            {/* Location Code (XY-ZAAA) & Outline View Trigger */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => setViewingLocationItem(item)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-mono font-bold transition"
                                                    title="View location outline pin"
                                                >
                                                    <MapPinIcon className="h-3.5 w-3.5" />
                                                    {item.location_code}
                                                </button>
                                                {parsedLoc && (
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        Rack #{parsedLoc.rack}, Sector #{parsedLoc.sector}, Box #{parsedLoc.box}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Quantity & Increment Buttons */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base font-bold font-mono text-emerald-400">
                                                        {item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                                                    </span>

                                                    {canEdit && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => onAdjustStock(item.id, -1)}
                                                                className="p-1 bg-brand-darker hover:bg-rose-500/20 hover:text-rose-400 text-gray-300 rounded border border-brand-border transition"
                                                                title="Decrease 1"
                                                            >
                                                                <MinusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onAdjustStock(item.id, 1)}
                                                                className="p-1 bg-brand-darker hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-300 rounded border border-brand-border transition"
                                                                title="Increase 1"
                                                            >
                                                                <PlusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-5 py-4 text-right space-x-2">
                                                {/* Print Label Button */}
                                                <button
                                                    onClick={() => setPrintingItem(item)}
                                                    className="px-3 py-1.5 bg-brand-darker hover:bg-brand-teal/20 text-brand-teal border border-brand-border rounded-lg font-bold text-xs transition inline-flex items-center gap-1.5"
                                                    title="Print Brother PT-D460BTVP 18mm Tape Label"
                                                >
                                                    <PrinterIcon className="h-3.5 w-3.5" />
                                                    Label
                                                </button>

                                                {canEdit && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setIsAddModalOpen(true);
                                                            }}
                                                            className="p-1.5 bg-brand-darker hover:bg-slate-700 text-gray-300 rounded-lg border border-brand-border transition inline-block"
                                                            title="Edit Item"
                                                        >
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteItem(item.id)}
                                                            className="p-1.5 bg-brand-darker hover:bg-rose-500/20 text-rose-400 rounded-lg border border-brand-border transition inline-block"
                                                            title="Delete Item"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400 font-mono">
                                        No inventory items found matching search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Brother Label Printer Modal */}
            {printingItem && (
                <LabelPrinterModal
                    isOpen={!!printingItem}
                    onClose={() => setPrintingItem(null)}
                    item={printingItem}
                />
            )}

            {/* Item Location Floorplan Outline Modal */}
            {viewingLocationItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                            <div>
                                <h3 className="font-bold text-white text-base">{viewingLocationItem.title}</h3>
                                <p className="text-xs text-gray-400 font-mono">Location Code: {viewingLocationItem.location_code}</p>
                            </div>
                            <button onClick={() => setViewingLocationItem(null)} className="p-2 text-gray-400 hover:text-white">
                                <CloseIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <DilnaFloorplanOutline 
                            locationCode={viewingLocationItem.location_code} 
                            itemTitle={viewingLocationItem.title} 
                        />

                        <button
                            onClick={() => setViewingLocationItem(null)}
                            className="w-full py-2 bg-brand-darker text-gray-300 font-bold rounded-xl border border-brand-border text-xs"
                        >
                            Close Location View
                        </button>
                    </div>
                </div>
            )}

            {/* Add / Edit Inventory Modal */}
            {isAddModalOpen && (
                <InventoryItemFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    item={editingItem}
                    allItems={items}
                    onSave={async (itemData) => {
                        if (editingItem) {
                            await onUpdateItem({ ...editingItem, ...itemData });
                        } else {
                            await onAddItem(itemData);
                        }
                        setIsAddModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

// Form Modal Component for Inventory Items with XY-ZAAA Auto-Sequencer
interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    allItems: InventoryItem[];
    onSave: (data: any) => Promise<void>;
}

const InventoryItemFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, item, allItems = [], onSave }) => {
    const [title, setTitle] = useState(item?.title || '');
    const [category, setCategory] = useState(item?.category || 'Power Tools');
    const [quantity, setQuantity] = useState(item?.quantity ?? 1);
    const [unit, setUnit] = useState(item?.unit || 'pcs');

    // XY-ZAAA Fields
    const parsedInitial = parseLocationCode(item?.location_code || '12-0001');
    const [rack, setRack] = useState<number>(parsedInitial ? parsedInitial.rack : 1);
    const [sector, setSector] = useState<number>(parsedInitial ? parsedInitial.sector : 2);
    const [box, setBox] = useState<number>(parsedInitial ? parsedInitial.box : 0);
    
    // Auto-calculate initial sequence ID if creating new item
    const initialSeq = item 
        ? (parsedInitial ? parsedInitial.itemId : '001')
        : getNextSequenceForItem(allItems, 1, 2, 0);

    const [itemNum, setItemNum] = useState<string>(initialSeq);
    const [qrCode, setQrCode] = useState(item?.qr_code || `GYPRI-${Date.now().toString().slice(-6)}`);
    const [notes, setNotes] = useState(item?.notes || '');
    const [codeError, setCodeError] = useState<string>('');

    // Auto-assign next sequential 3-digit AAA ID whenever location prefix (rack, sector, box) changes for new items
    React.useEffect(() => {
        if (!item) {
            const nextSeq = getNextSequenceForItem(allItems, rack, sector, box);
            setItemNum(nextSeq);
        }
    }, [rack, sector, box, allItems, item]);

    if (!isOpen) return null;

    const computedLocationCode = formatLocationCode(rack, sector, box, itemNum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError('');

        const validated = parseLocationCode(computedLocationCode);
        if (!validated) {
            setCodeError('Location code must strictly follow XY-ZAAA scheme (e.g. 12-0123, 34-5674)');
            return;
        }

        onSave({
            title,
            category,
            quantity: Number(quantity),
            unit,
            min_quantity: 0,
            location_code: validated.formatted,
            zone: `Rack ${validated.rack}`,
            qr_code: qrCode,
            notes,
            location_x: 50,
            location_y: 50
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 font-sans">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <h2 className="text-lg font-bold text-white">{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Item Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Bosch Cordless Drill 18V"
                            className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Category *</label>
                            <input
                                type="text"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Power Tools"
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">QR Code / SKU *</label>
                            <input
                                type="text"
                                required
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                    </div>

                    {/* Location Code Generator Section (XY-ZAAA) */}
                    <div className="p-4 bg-brand-darker border border-brand-border rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider">
                                Location Scheme: XY-ZAAA
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                                {computedLocationCode}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400">Rack (X)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="9"
                                    value={rack}
                                    onChange={(e) => setRack(Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border rounded text-xs text-white font-mono text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400">Sector/Shelf (Y)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={sector}
                                    onChange={(e) => setSector(Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border rounded text-xs text-white font-mono text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400">Box # (Z: 0=None)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={box}
                                    onChange={(e) => setBox(Number(e.target.value))}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border rounded text-xs text-white font-mono text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400">Item ID (AAA)</label>
                                <input
                                    type="text"
                                    maxLength={3}
                                    value={itemNum}
                                    onChange={(e) => setItemNum(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123"
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border rounded text-xs text-white font-mono text-center"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">
                            Auto-assigned sequence ID based on registration order at location <strong>{rack}{sector}-{box}</strong> (e.g. 12-0001, 12-0002).
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Current Quantity *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Unit *</label>
                            <input
                                type="text"
                                required
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                placeholder="pcs, kg, meters"
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Description</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Optional item details or notes..."
                            className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
                        />
                    </div>

                    {codeError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                            {codeError}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-xl text-xs transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold rounded-xl text-xs transition"
                        >
                            Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
