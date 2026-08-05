import React, { useState, useMemo } from 'react';
import { InventoryItem, User } from '../types';
import {
    InventoryIcon, SearchIcon, PlusIcon,
    PrinterIcon, FilterIcon, TrashIcon, EditIcon,
    ArrowUpRight, ChevronRightIcon
} from './icons';
import { parseLocationCode, formatLocationCode, getNextSequenceForItem } from '../locationParser';
import { LabelPrinterModal } from './LabelPrinterModal';

interface InventoryCatalogProps {
    items: InventoryItem[];
    user: User;
    onAddItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
    onUpdateItem: (item: InventoryItem) => Promise<void>;
    onDeleteItem: (id: number) => Promise<void>;
    onSelectItem: (item: InventoryItem) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const InventoryCatalog: React.FC<InventoryCatalogProps> = ({
    items = [],
    user,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onSelectItem,
    showToast
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);

    // Check if the current browser is running on the Printer Workstation (PC B / localhost)
    const isPrinterWorkstation = useMemo(() => {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const hasFlag = localStorage.getItem('is_printer_workstation') === 'true';
        return isLocal || hasFlag;
    }, []);

    // Categories list derived dynamically
    const categories = useMemo(() => {
        const set = new Set(items.map(i => i.category || 'Uncategorized'));
        return ['ALL', ...Array.from(set).sort()];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const itemCat = item.category || 'Uncategorized';
            if (selectedCategory !== 'ALL' && itemCat !== selectedCategory) return false;
            if (search) {
                const term = search.toLowerCase();
                return (
                    (item.title || '').toLowerCase().includes(term) ||
                    (item.location_code || '').toLowerCase().includes(term) ||
                    (item.qr_code || '').toLowerCase().includes(term) ||
                    (item.zone || '').toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [items, search, selectedCategory]);

    const canEdit = user.is_admin || user.permissions?.inventory_edit !== false;

    return (
        <div className="space-y-6 font-sans">
            {/* Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-dark border border-brand-border p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <InventoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Inventář dílny</h1>
                        <p className="text-xs text-gray-300">Seznam položek a index umístění (schéma XY-ZAAA)</p>
                    </div>
                </div>

                {canEdit && isPrinterWorkstation && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black text-xs font-bold rounded-xl transition"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Přidat novou položku
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
                        placeholder="Hledat název položky nebo kód umístění (např. 12-0001)..."
                        className="w-full pl-10 pr-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-teal font-mono"
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
                                {cat === 'ALL' ? 'Všechny kategorie' : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inventory Table List */}
            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#343b47] text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">NÁZEV POLOŽKY</th>
                                <th scope="col" className="px-6 py-4">KATEGORIE</th>
                                <th scope="col" className="px-6 py-4">UMÍSTĚNÍ (ID)</th>
                                <th scope="col" className="px-6 py-4 text-right">AKCE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    return (
                                        <tr key={item.id} className="bg-brand-dark border-b border-brand-border/60 hover:bg-[#343b47]/40 transition">
                                            {/* Item Name */}
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => onSelectItem(item)}
                                                    className="font-bold text-white text-sm hover:text-brand-teal transition text-left"
                                                >
                                                    {item.title}
                                                </button>
                                                {item.notes && (
                                                    <div className="text-[10px] text-gray-400 truncate max-w-[250px] mt-0.5">
                                                        {item.notes}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Category */}
                                            <td className="px-6 py-4 font-semibold text-gray-300">
                                                {item.category}
                                            </td>

                                            {/* Location ID */}
                                            <td className="px-6 py-4 font-mono">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-darker rounded-lg border border-brand-border text-brand-teal font-bold text-xs">
                                                    <span>{item.location_code || 'N/A'}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onSelectItem(item)}
                                                    className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black font-bold rounded-xl shadow transition inline-flex items-center justify-center gap-1.5"
                                                    title="Zobrazit detail položky"
                                                >
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-mono">
                                        Žádné položky neodpovídají zadaným filtrům.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            showToast("Item updated successfully", "success");
                        } else {
                            await onAddItem(itemData);
                            showToast("Item added successfully", "success");
                            // Open print modal immediately for the newly registered item
                            const newItem = items.find(i => i.location_code === itemData.location_code) || {
                                id: Date.now(),
                                ...itemData
                            };
                            setPrintingItem(newItem as InventoryItem);
                        }
                        setIsAddModalOpen(false);
                    }}
                />
            )}

            {/* Direct b-PAC Printer Modal for Brother PT-D460BTVP */}
            {printingItem && (
                <LabelPrinterModal
                    isOpen={!!printingItem}
                    onClose={() => setPrintingItem(null)}
                    item={printingItem}
                />
            )}
        </div>
    );
};

// Form Modal Component for Inventory Items with Read-Only Auto-Assigned Location ID
interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    allItems: InventoryItem[];
    onSave: (data: any) => Promise<void>;
}

const InventoryItemFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, item, allItems = [], onSave }) => {
    const [title, setTitle] = useState(item?.title || '');

    // Categories dropdown list derived dynamically from existing items
    const existingCategories = useMemo(() => {
        const set = new Set(allItems.map(i => i.category).filter(Boolean));
        const defaults = ['Power Tools', '3D Printing', 'Electronics', 'Consumables', 'Fasteners'];
        defaults.forEach(d => set.add(d));
        return Array.from(set).sort();
    }, [allItems]);

    const [selectedCatOption, setSelectedCatOption] = useState<string>(
        item?.category && existingCategories.includes(item.category) ? item.category : (item?.category ? '__NEW__' : existingCategories[0] || 'Power Tools')
    );
    const [customCategory, setCustomCategory] = useState<string>(
        item?.category && !existingCategories.includes(item.category) ? item.category : ''
    );

    const activeCategory = selectedCatOption === '__NEW__' ? customCategory : selectedCatOption;

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

        const finalCategory = activeCategory.trim() || 'General';

        const validated = parseLocationCode(computedLocationCode);
        if (!validated) {
            setCodeError('Kód umístění musí striktně odpovídat schématu XY-ZAAA (např. 12-0001)');
            return;
        }

        onSave({
            title: title.slice(0, 24),
            category: finalCategory.slice(0, 16),
            quantity: 1,
            unit: "pcs",
            min_quantity: 0,
            location_code: validated.formatted,
            zone: `Rack ${validated.rack}`,
            qr_code: validated.formatted,
            notes,
            location_x: 50,
            location_y: 50
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-backdrop-fade font-sans">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-modal-pop">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <h2 className="text-lg font-bold text-white">{item ? 'Upravit položku' : 'Přidat novou položku'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Item Title Input + Live Letter Counter */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-gray-300">Název položky / Title *</label>
                            <span className={`text-xs font-mono font-bold transition-colors ${
                                title.length >= 24 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-gray-400'
                            }`}>
                                {title.length}/24
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={24}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="např. Bosch Cordless Drill 18V"
                            className={`w-full px-3 py-2 bg-brand-darker border rounded-xl text-xs text-white focus:outline-none font-sans transition ${
                                title.length >= 24 ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30' : 'border-brand-border focus:border-brand-teal'
                            }`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category Dropdown & Custom Input + Live Letter Counter */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-gray-300">Kategorie / Category *</label>
                                <span className={`text-xs font-mono font-bold transition-colors ${
                                    activeCategory.length >= 16 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-gray-400'
                                }`}>
                                    {activeCategory.length}/16
                                </span>
                            </div>

                            <select
                                value={selectedCatOption}
                                onChange={(e) => setSelectedCatOption(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal font-sans mb-2"
                            >
                                {existingCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="__NEW__" className="text-brand-teal font-bold bg-slate-900">
                                    + Přidat novou kategorii...
                                </option>
                            </select>

                            {selectedCatOption === '__NEW__' && (
                                <input
                                    type="text"
                                    required
                                    maxLength={16}
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    placeholder="Zadejte název kategorie..."
                                    className={`w-full px-3 py-2 bg-brand-darker border rounded-xl text-xs text-white focus:outline-none font-sans transition ${
                                        customCategory.length >= 16 ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30' : 'border-brand-border focus:border-brand-teal'
                                    }`}
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Kód umístění / Location ID</label>
                            <div className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs font-mono font-bold text-brand-teal">
                                {computedLocationCode}
                            </div>
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
                                <div className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border/60 rounded text-xs text-brand-teal font-mono font-bold text-center select-none">
                                    {itemNum}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">
                            Auto-assigned sequence ID based on registration order at location <strong>{rack}{sector}-{box}</strong> (reuses deleted IDs).
                        </p>
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
