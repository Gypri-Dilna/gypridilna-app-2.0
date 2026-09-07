import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, User } from '../types';
import {
    InventoryIcon, SearchIcon, PlusIcon,
    PrinterIcon, FilterIcon, TrashIcon, EditIcon,
    ArrowUpRight, ChevronRightIcon, CloseIcon, CheckSquareIcon
} from './icons';
import { parseLocationCode, formatLocationCode, getNextSequenceForItem } from '../locationParser';
import { LabelPrinterModal } from './LabelPrinterModal';
import { ConfirmationModal } from './ConfirmationModal';

interface InventoryCatalogProps {
    items: InventoryItem[];
    user: User;
    onAddItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
    onUpdateItem: (item: InventoryItem) => Promise<void>;
    onDeleteItem: (id: number) => Promise<void>;
    onBatchDeleteItems?: (ids: number[]) => Promise<void>;
    onDeleteCategory?: (categoryName: string) => Promise<void>;
    onSelectItem: (item: InventoryItem) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    onAddToQueue?: (item: InventoryItem, tapeSize: '18mm' | '9mm') => void;
    queueCount?: number;
    onOpenPrintQueue?: () => void;
    isPrinterAvailable?: boolean;
}

export const InventoryCatalog: React.FC<InventoryCatalogProps> = ({
    items = [],
    user,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onBatchDeleteItems,
    onDeleteCategory,
    onSelectItem,
    showToast,
    onAddToQueue,
    queueCount = 0,
    onOpenPrintQueue,
    isPrinterAvailable = false
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);

    // Batch Selection Mode State
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
    const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

    // Responsive mobile device detection
    const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check permissions
    const canEdit = user.is_admin || user.permissions?.inventory_edit !== false;

    // Filter items by category & search query
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                (item.location_code && item.location_code.toLowerCase().includes(search.toLowerCase())) ||
                (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));

            const matchesCategory =
                selectedCategory === 'ALL' || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [items, search, selectedCategory]);

    // Unique category names
    const categories = useMemo(() => {
        const set = new Set<string>();
        items.forEach((item) => {
            if (item.category) set.add(item.category);
        });
        return ['ALL', ...Array.from(set).sort()];
    }, [items]);

    const toggleSelectItem = (id: number) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBatchAddToQueue = () => {
        if (!onAddToQueue) return;
        const selectedObjects = items.filter(i => selectedItemIds.has(i.id));
        selectedObjects.forEach(item => {
            onAddToQueue(item, '18mm');
        });
        showToast(`${selectedObjects.length} položek bylo přidáno do tiskové fronty (18mm).`, 'success');
        setSelectedItemIds(new Set());
        setIsSelectMode(false);
    };

    const handleBatchDelete = async () => {
        const ids = Array.from(selectedItemIds);
        if (ids.length === 0) return;

        if (onBatchDeleteItems) {
            await onBatchDeleteItems(ids);
        } else {
            for (const id of ids) {
                await onDeleteItem(id);
            }
        }
        setSelectedItemIds(new Set());
        setIsSelectMode(false);
        setIsBatchConfirmOpen(false);
    };

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
                        <p className="text-xs text-gray-300">Seznam položek a jejich ID</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Tisková fronta button - Greyed out if driver missing or on mobile */}
                    {onOpenPrintQueue && (
                        <button
                            type="button"
                            onClick={() => {
                                if (!isMobile && isPrinterAvailable) {
                                    onOpenPrintQueue();
                                } else {
                                    showToast("Driver nenainstalován (tiskový ovladač b-PAC není dostupný na tomto zařízení)", "error");
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition group ${
                                !isMobile && isPrinterAvailable
                                    ? 'bg-brand-darker hover:bg-slate-800 text-gray-200 border-brand-border'
                                    : 'bg-slate-900/80 text-gray-500 border-slate-800 cursor-not-allowed opacity-75'
                            }`}
                            title={!isMobile && isPrinterAvailable ? "Tisková fronta štítků" : "Driver nenainstalován"}
                        >
                            <PrinterIcon className={`h-4 w-4 ${!isMobile && isPrinterAvailable ? 'text-brand-teal' : 'text-gray-500'}`} />
                            <span>Tisková fronta</span>
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                                !isMobile && isPrinterAvailable && queueCount > 0 
                                    ? 'bg-brand-teal text-black font-extrabold animate-pulse' 
                                    : 'bg-slate-800 text-gray-500 border border-brand-border/40'
                            }`}>
                                {queueCount}
                            </span>
                        </button>
                    )}

                    {/* Přidat novou položku button - Greyed out if driver missing or on mobile */}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => {
                                if (!isMobile && isPrinterAvailable) {
                                    setEditingItem(null);
                                    setIsAddModalOpen(true);
                                } else {
                                    showToast("Driver nenainstalován (přidávání s tiskem vyžaduje ovladač b-PAC na PC)", "error");
                                }
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition ${
                                !isMobile && isPrinterAvailable
                                    ? 'bg-brand-teal hover:bg-brand-teal-hover text-black shadow-lg shadow-brand-teal/20'
                                    : 'bg-slate-900/80 text-gray-500 border border-slate-800 cursor-not-allowed opacity-75'
                            }`}
                            title={!isMobile && isPrinterAvailable ? "Přidat novou položku do zásob" : "Driver nenainstalován"}
                        >
                            <PlusIcon className="h-4 w-4" />
                            Přidat novou položku
                        </button>
                    )}
                </div>
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

            {/* Smooth Collapsible Animated Selection Bar directly ABOVE table */}
            <div className={`grid transition-all duration-300 ease-in-out ${
                isSelectMode ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'
            }`}>
                <div className="overflow-hidden">
                    <div className="bg-brand-dark border border-brand-teal/40 p-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (filteredItems.every(i => selectedItemIds.has(i.id))) {
                                        setSelectedItemIds(new Set());
                                    } else {
                                        setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
                                    }
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-gray-200 hover:text-white bg-brand-darker hover:bg-[#343b47] px-3 py-1.5 rounded-xl border border-brand-border transition active:scale-95"
                            >
                                <input
                                    type="checkbox"
                                    checked={filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.has(i.id))}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-brand-darker accent-brand-teal cursor-pointer pointer-events-none"
                                />
                                <span>Vybrat vše</span>
                            </button>

                            <span className="text-xs font-extrabold text-white font-mono bg-brand-darker px-3 py-1.5 rounded-xl border border-brand-border">
                                Vybráno: <span className="text-brand-teal font-extrabold">{selectedItemIds.size}</span> z {filteredItems.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {onAddToQueue && selectedItemIds.size > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBatchAddToQueue}
                                    className="px-3.5 py-1.5 bg-brand-teal/15 hover:bg-brand-teal text-brand-teal hover:text-black border border-brand-teal/40 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 animate-fadeIn"
                                >
                                    <PrinterIcon className="h-4 w-4" />
                                    <span>Přidat do tiskové fronty ({selectedItemIds.size})</span>
                                </button>
                            )}

                            {canEdit && selectedItemIds.size > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsBatchConfirmOpen(true)}
                                    className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 animate-fadeIn"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Smazat vybrané ({selectedItemIds.size})</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSelectMode(false);
                                    setSelectedItemIds(new Set());
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-brand-darker hover:bg-[#343b47] rounded-xl border border-brand-border transition flex items-center gap-1 active:scale-95"
                                title="Ukončit režim výběru"
                            >
                                <CloseIcon className="h-4 w-4" />
                                <span>Ukončit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                <style>{`
                    @keyframes slideDownRow {
                        0% {
                            opacity: 0;
                            transform: translateY(-14px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-slide-down {
                        animation: slideDownRow 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-darker text-gray-400 font-mono text-[11px] uppercase tracking-wider border-b border-brand-border/60">
                                <th scope="col" className="px-3 py-3 w-12 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSelectMode(!isSelectMode);
                                            if (isSelectMode) setSelectedItemIds(new Set());
                                        }}
                                        className={`p-1.5 rounded-lg border transition inline-flex items-center justify-center ${
                                            isSelectMode
                                                ? 'bg-brand-teal text-black border-brand-teal font-bold shadow-md'
                                                : 'bg-brand-darker text-gray-400 border-brand-border hover:text-white hover:bg-slate-800'
                                        }`}
                                        title={isSelectMode ? "Ukončit režim výběru" : "Aktivovat režim výběru"}
                                    >
                                        <CheckSquareIcon className="h-4 w-4" />
                                    </button>
                                </th>
                                <th scope="col" className="px-4 py-4 w-16 text-center">AKCE</th>
                                <th scope="col" className="px-6 py-4">NÁZEV POLOŽKY</th>
                                <th scope="col" className="px-6 py-4">KATEGORIE</th>
                                <th scope="col" className="px-6 py-4">UMÍSTĚNÍ (ID)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    return (
                                        <tr key={item.id} className={`border-b border-brand-border/60 transition-all duration-300 animate-slide-down ${
                                            selectedItemIds.has(item.id) ? 'bg-brand-teal/10' : 'bg-brand-dark hover:bg-[#343b47]/40'
                                        }`}>
                                            {/* Centered Checkbox Column */}
                                            <td className="px-3 py-4 text-center align-middle">
                                                {isSelectMode && (
                                                    <div className="flex items-center justify-center w-full">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItemIds.has(item.id)}
                                                            onChange={() => toggleSelectItem(item.id)}
                                                            className="w-4 h-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-brand-darker accent-brand-teal cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                            {/* Action Button FIRST */}
                                            <td className="px-4 py-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => onSelectItem(item)}
                                                    className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                    title="Zobrazit detail položky"
                                                >
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                </button>
                                            </td>

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
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isSelectMode ? 5 : 4} className="px-6 py-8 text-center text-gray-400 font-mono">
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
                            showToast("Položka byla úspěšně upravena", "success");
                        } else {
                            await onAddItem(itemData);
                            showToast("Položka byla úspěšně přidána do zásob", "success");
                            // Open print selection modal ONLY on desktop WITH active b-PAC printer driver!
                            if (!isMobile && isPrinterAvailable) {
                                const newItem = items.find(i => i.location_code === itemData.location_code) || {
                                    id: Date.now(),
                                    ...itemData
                                };
                                setPrintingItem(newItem as InventoryItem);
                            }
                        }
                        setIsAddModalOpen(false);
                    }}
                    onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
                />
            )}

            {/* Direct b-PAC Printer Modal for Brother PT-D460BTVP */}
            {printingItem && (
                <LabelPrinterModal
                    isOpen={!!printingItem}
                    onClose={() => setPrintingItem(null)}
                    item={printingItem}
                    onAddToQueue={onAddToQueue}
                />
            )}

            {/* Manage & Delete Categories Modal */}
            {isCategoryManagerOpen && onDeleteCategory && (
                <ManageCategoriesModal
                    isOpen={isCategoryManagerOpen}
                    onClose={() => setIsCategoryManagerOpen(false)}
                    items={items}
                    onDeleteCategory={onDeleteCategory}
                />
            )}

            {isBatchConfirmOpen && (
                <ConfirmationModal
                    isOpen={isBatchConfirmOpen}
                    onClose={() => setIsBatchConfirmOpen(false)}
                    onConfirm={handleBatchDelete}
                    title="Hromadné mazání položek"
                    message={`Opravdu chcete smazat ${selectedItemIds.size} vybraných položek ze zásob? Tato akce je nevratná.`}
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
    onOpenCategoryManager?: () => void;
}

const InventoryItemFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, item, allItems = [], onSave, onOpenCategoryManager }) => {
    const [title, setTitle] = useState(item?.title || '');

    // Lock background page scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Categories dropdown list derived dynamically from existing items
    const existingCategories = useMemo(() => {
        const set = new Set(allItems.map(i => i.category).filter(Boolean));
        if (set.size === 0) {
            set.add('General');
        }
        return Array.from(set).sort();
    }, [allItems]);

    const [selectedCatOption, setSelectedCatOption] = useState<string>(
        item?.category && existingCategories.includes(item.category) ? item.category : (item?.category ? '__NEW__' : existingCategories[0] || 'Power Tools')
    );
    const [customCategory, setCustomCategory] = useState<string>(
        item?.category && !existingCategories.includes(item.category) ? item.category : ''
    );

    const activeCategory = selectedCatOption === '__NEW__' ? customCategory : selectedCatOption;

    // When adding a new item, prefill the location scheme (X, Y, Z) from the most
    // recently added item so consecutive registrations are quick and consistent.
    const lastAddedItem = useMemo(() => {
        if (item) return null; // editing an existing item → keep its own location
        if (!allItems.length) return null;
        return [...allItems].sort((a, b) =>
            String(b.last_updated || '').localeCompare(String(a.last_updated || '')) || b.id - a.id
        )[0];
    }, [item, allItems]);

    // XY-ZAAA Fields
    const prefillCode = item?.location_code || lastAddedItem?.location_code || '12-0001';
    const parsedInitial = parseLocationCode(prefillCode);
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

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 180);
    };

    const parseLocationInput = () => {
        const validated = parseLocationCode(computedLocationCode);
        if (!validated) {
            setCodeError('Kód umístění musí striktně odpovídat schématu XY-ZAAA (např. 12-0001)');
            return null;
        }
        return validated;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError('');
        const validated = parseLocationInput();
        if (!validated) return;

        const finalCategory = activeCategory.trim() || 'General';

        onSave({
            title: title.slice(0, 30),
            category: finalCategory.slice(0, 22),
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
        handleClose();
    };

    return createPortal(
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans overflow-hidden ${
            isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'
        }`}>
            <div className={`bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] ${
                isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
            }`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker shrink-0">
                    <h2 className="text-lg font-bold text-white">{item ? 'Upravit položku' : 'Přidat novou položku'}</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Item Title Input + Live Letter Counter */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-gray-300">Název položky *</label>
                            <span className={`text-xs font-mono font-bold transition-colors ${
                                title.length >= 30 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-gray-400'
                            }`}>
                                {title.length}/30
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={30}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="např. Bosch Cordless Drill 18V"
                            className={`w-full px-3 py-2 bg-brand-darker border rounded-xl text-xs text-white focus:outline-none font-sans transition ${
                                title.length >= 30 ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30' : 'border-brand-border focus:border-brand-teal'
                            }`}
                        />
                    </div>

                    {/* Category Dropdown & Custom Input + Live Letter Counter */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1">
                                <label className="block text-xs font-semibold text-gray-300 truncate">Kategorie *</label>
                                {onOpenCategoryManager && (
                                    <button
                                        type="button"
                                        onClick={onOpenCategoryManager}
                                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono shrink-0 ml-1"
                                    >
                                        (Správa)
                                    </button>
                                )}
                            </div>
                            <span className={`text-xs font-mono font-bold transition-colors shrink-0 ${
                                activeCategory.length >= 22 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-gray-400'
                            }`}>
                                {activeCategory.length}/22
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
                                maxLength={22}
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Zadejte název kategorie..."
                                className={`w-full px-3 py-2 bg-brand-darker border rounded-xl text-xs text-white focus:outline-none font-sans transition ${
                                    customCategory.length >= 22 ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30' : 'border-brand-border focus:border-brand-teal'
                                }`}
                            />
                        )}
                    </div>

                    {/* Location Code Generator Section (XY-ZAAA) */}
                    <div className="p-4 sm:p-5 bg-brand-darker border border-brand-border rounded-2xl space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider">
                                Schéma lokace: XY-ZAAA
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                {computedLocationCode}
                            </span>
                        </div>

                        {/* 4 Equal Columns Grid with Symmetrical Gaps and Centered Titles */}
                        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 items-end">
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[10px] sm:text-[11px] font-bold text-gray-300 text-center mb-1.5 leading-tight">
                                    Rack / Skříň / Lokace (X)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="9"
                                    value={rack}
                                    onChange={(e) => setRack(Number(e.target.value))}
                                    className="w-full h-10 px-0 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[10px] sm:text-[11px] font-bold text-gray-300 text-center mb-1.5 leading-tight">
                                    Police / Sektor (Y)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={sector}
                                    onChange={(e) => setSector(Number(e.target.value))}
                                    className="w-full h-10 px-0 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[10px] sm:text-[11px] font-bold text-gray-300 text-center mb-1.5 leading-tight">
                                    Box / Krabice (Z)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={box}
                                    onChange={(e) => setBox(Number(e.target.value))}
                                    className="w-full h-10 px-0 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[10px] sm:text-[11px] font-bold text-gray-300 text-center mb-1.5 leading-tight">
                                    ID Položky (AAA)
                                </label>
                                <div className="w-full h-10 px-2 flex items-center justify-center bg-slate-950 border border-brand-teal/40 rounded-xl text-sm text-brand-teal font-mono font-bold text-center select-none">
                                    {itemNum}
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 text-center font-mono leading-relaxed pt-1">
                            ID se přiřazuje automaticky podle volných ID. <strong>(Není-li v boxu, nastavte Box na 0)</strong>.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Poznámky</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Případné poznámky, detaily..."
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
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold rounded-xl text-xs transition"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold rounded-xl text-xs transition"
                        >
                            Uložit položku
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

// Category Management Modal
interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    items: InventoryItem[];
    onDeleteCategory: (categoryName: string) => Promise<void>;
}

const ManageCategoriesModal: React.FC<CategoryManagerProps> = ({ isOpen, onClose, items = [], onDeleteCategory }) => {
    const [deletingCat, setDeletingCat] = useState<string | null>(null);

    const categoryStats = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(item => {
            const cat = item.category || 'General';
            map.set(cat, (map.get(cat) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);

    if (!isOpen) return null;

    const handleDelete = async (catName: string, count: number) => {
        if (catName.toLowerCase() === 'general' || catName.toLowerCase() === 'všechny') {
            alert('Systémovou kategorii "General" nelze smazat.');
            return;
        }

        if (window.confirm(`Opravdu chcete smazat kategorii "${catName}"?\n\nVšechny položky (${count}) v této kategorii budou přesunuty do výchozí kategorie "General".`)) {
            setDeletingCat(catName);
            try {
                await onDeleteCategory(catName);
            } finally {
                setDeletingCat(null);
            }
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-backdrop-fade font-sans overflow-y-auto">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop my-auto flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                            <TrashIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Správa a mazání kategorií</h2>
                            <p className="text-xs text-gray-400">Přehled a správa všech kategorií v inventáři</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {categoryStats.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 py-6">Žádné kategorie nebyly nalezeny.</div>
                    ) : (
                        categoryStats.map(([catName, count]) => {
                            const isSystemDefault = catName.toLowerCase() === 'general';
                            return (
                                <div
                                    key={catName}
                                    className="flex items-center justify-between p-3.5 bg-brand-darker border border-brand-border rounded-xl"
                                >
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{catName}</h4>
                                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">{count} {count === 1 ? 'položka' : (count < 5 ? 'položky' : 'položek')}</p>
                                    </div>

                                    {isSystemDefault ? (
                                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-slate-800 px-2 py-1 rounded">
                                            Systémová
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(catName, count)}
                                            disabled={deletingCat === catName}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition active:scale-95 disabled:opacity-50"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                            {deletingCat === catName ? 'Mazání...' : 'Smazat'}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-brand-border bg-brand-darker flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                    >
                        Zavřít
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
