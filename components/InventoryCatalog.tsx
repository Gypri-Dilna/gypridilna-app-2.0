import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import { 
    InventoryIcon, SearchIcon, PlusIcon, MinusIcon, 
    PrinterIcon, MapPinIcon, FilterIcon, TrashIcon, EditIcon, 
    WarningIcon, TagIcon, RefreshIcon, BoxesIcon
} from './icons';
import { LabelPrinterModal } from './LabelPrinterModal';

interface InventoryCatalogProps {
    items: InventoryItem[];
    user: User;
    onAddItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
    onUpdateItem: (item: InventoryItem) => Promise<void>;
    onDeleteItem: (id: number) => Promise<void>;
    onAdjustStock: (id: number, delta: number) => Promise<void>;
    onSelectMinimapItem?: (itemId: number) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const InventoryCatalog: React.FC<InventoryCatalogProps> = ({
    items,
    user,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onAdjustStock,
    onSelectMinimapItem,
    showToast
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Categories list derived dynamically
    const categories = useMemo(() => {
        const set = new Set(items.map(i => i.category));
        return ['ALL', ...Array.from(set).sort()];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (showLowStockOnly && item.quantity > item.min_quantity) return false;
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
    }, [items, search, selectedCategory, showLowStockOnly]);

    const canEdit = user.is_admin || user.permissions?.inventory_edit !== false;

    return (
        <div className="space-y-6">
            {/* Header & Main Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 text-brand-cyan rounded-xl">
                            <InventoryIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Workshop Inventory Catalog</h1>
                            <p className="text-xs text-gray-400">Fast SQL-backed Tool, Parts & Consumables Tracking System</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition flex items-center gap-2 ${
                            showLowStockOnly 
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10' 
                                : 'bg-slate-900 border-brand-border text-gray-300 hover:border-gray-600'
                        }`}
                    >
                        <WarningIcon className="h-4 w-4" />
                        Low Stock Alerts ({items.filter(i => i.quantity <= i.min_quantity).length})
                    </button>

                    {canEdit && (
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setIsAddModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-cyan hover:bg-cyan-300 text-black text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add New Workshop Item
                        </button>
                    )}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-brand-card border border-brand-border p-4 rounded-2xl shadow-lg">
                <div className="relative flex-1 min-w-[240px]">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title, location code (A1-01), SKU, zone..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan"
                    />
                </div>

                {/* Category Select */}
                <div className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4 text-gray-400" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-slate-900 border border-brand-border text-xs rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-brand-cyan"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'ALL' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inventory Table / Grid */}
            <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-brand-border text-[11px] font-mono uppercase tracking-wider text-gray-400">
                                <th className="px-5 py-3.5">Item Name & SKU</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5">Location Code</th>
                                <th className="px-5 py-3.5">Stock Level</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isLowStock = item.quantity <= item.min_quantity;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                                            {/* Title & SKU */}
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-white text-sm">{item.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
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

                                            {/* Location Code & Minimap link */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => onSelectMinimapItem && onSelectMinimapItem(item.id)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-mono font-bold transition"
                                                >
                                                    <MapPinIcon className="h-3.5 w-3.5" />
                                                    {item.location_code}
                                                </button>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.zone}</div>
                                            </td>

                                            {/* Quantity & Increment Buttons */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-base font-black font-mono ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                                                    </span>

                                                    {canEdit && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => onAdjustStock(item.id, -1)}
                                                                className="p-1 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-gray-300 rounded transition"
                                                                title="Decrease 1"
                                                            >
                                                                <MinusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onAdjustStock(item.id, 1)}
                                                                className="p-1 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-300 rounded transition"
                                                                title="Increase 1"
                                                            >
                                                                <PlusIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {isLowStock && (
                                                    <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                                                        <WarningIcon className="h-3 w-3" /> Min Stock Alert ({item.min_quantity})
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="px-5 py-4 text-right space-x-2">
                                                {/* Print Label Button */}
                                                <button
                                                    onClick={() => setPrintingItem(item)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-brand-border rounded-lg font-bold text-xs transition inline-flex items-center gap-1.5"
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
                                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition inline-block"
                                                            title="Edit Item"
                                                        >
                                                            <EditIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteItem(item.id)}
                                                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition inline-block"
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
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500 font-mono">
                                        No inventory items found matching filter criteria.
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

            {/* Add / Edit Inventory Modal */}
            {isAddModalOpen && (
                <InventoryItemFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    item={editingItem}
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

// Form Modal Component for Inventory Items
interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onSave: (data: any) => Promise<void>;
}

const InventoryItemFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, item, onSave }) => {
    const [title, setTitle] = useState(item?.title || '');
    const [category, setCategory] = useState(item?.category || 'Power Tools');
    const [quantity, setQuantity] = useState(item?.quantity ?? 1);
    const [unit, setUnit] = useState(item?.unit || 'pcs');
    const [minQuantity, setMinQuantity] = useState(item?.min_quantity ?? 1);
    const [locationCode, setLocationCode] = useState(item?.location_code || 'A1-RACK-01');
    const [zone, setZone] = useState(item?.zone || 'Zone A: CNC & Woodworking');
    const [qrCode, setQrCode] = useState(item?.qr_code || `GYPRI-${Date.now().toString().slice(-6)}`);
    const [notes, setNotes] = useState(item?.notes || '');
    const [locationX, setLocationX] = useState(item?.location_x ?? 50);
    const [locationY, setLocationY] = useState(item?.location_y ?? 50);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            category,
            quantity: Number(quantity),
            unit,
            min_quantity: Number(minQuantity),
            location_code: locationCode,
            zone,
            qr_code: qrCode,
            notes,
            location_x: Number(locationX),
            location_y: Number(locationY)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-brand-card border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white">{item ? 'Edit Workshop Item' : 'Add New Inventory Item'}</h2>
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
                            className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
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
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">QR Code / SKU *</label>
                            <input
                                type="text"
                                required
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Current Stock *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
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
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Min Threshold *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={minQuantity}
                                onChange={(e) => setMinQuantity(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white font-mono focus:outline-none focus:border-brand-cyan"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Location Code *</label>
                            <input
                                type="text"
                                required
                                value={locationCode}
                                onChange={(e) => setLocationCode(e.target.value)}
                                placeholder="A1-RACK-02"
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-brand-cyan"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Workshop Zone *</label>
                            <select
                                value={zone}
                                onChange={(e) => setZone(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
                            >
                                <option value="Zone A: CNC & Woodworking">Zone A: CNC & Woodworking</option>
                                <option value="Zone B: Metal & Welding Lab">Zone B: Metal & Welding Lab</option>
                                <option value="Zone C: Electronics Bench">Zone C: Electronics Bench</option>
                                <option value="Zone D: 3D Printing Lab">Zone D: 3D Printing Lab</option>
                                <option value="Zone E: Entrance Gate">Zone E: Entrance Gate</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Description</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Optional item details, specs or maintenance notes..."
                            className="w-full px-3 py-2 bg-slate-900 border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-cyan"
                        />
                    </div>

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
                            className="flex-1 px-4 py-2.5 bg-brand-cyan hover:bg-cyan-300 text-black font-bold rounded-xl text-xs transition"
                        >
                            Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
