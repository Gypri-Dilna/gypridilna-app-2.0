import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, User } from '../types';
import { 
    PrinterIcon, EditIcon, TrashIcon, ArrowLeftIcon, CloseIcon,
    MapPinIcon, ClipboardIcon
} from './icons';
import { DilnaFloorplanOutline } from './DilnaFloorplanOutline';
import { LabelPrinterModal } from './LabelPrinterModal';
import { parseLocationCode, formatLocationCode, getNextSequenceForItem } from '../locationParser';

interface ItemDetailViewProps {
    item: InventoryItem;
    user: User;
    allItems: InventoryItem[];
    onBack: () => void;
    onUpdateItem: (item: InventoryItem) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onDeleteCategory?: (categoryName: string) => Promise<void>;
    onAddToQueue?: (item: InventoryItem, tapeSize: '18mm' | '9mm') => void;
    isPrinterAvailable?: boolean;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
    item,
    user,
    allItems = [],
    onBack,
    onUpdateItem,
    onDelete,
    onAddToQueue,
    isPrinterAvailable = false
}) => {
    const [isPrintingLabel, setIsPrintingLabel] = useState(false);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    
    // Mobile device detection
    const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Null guard to prevent blank screen crash
    if (!item) {
        return (
            <div className="p-8 text-center text-gray-400 font-sans bg-brand-dark border border-brand-border rounded-2xl max-w-xl mx-auto my-12">
                <p className="text-sm font-bold text-white mb-2">Položka nebyla nalezena</p>
                <p className="text-xs text-gray-400 mb-4">Položka možná byla smazána nebo přesunuta.</p>
                <button 
                    onClick={onBack} 
                    className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl transition shadow"
                >
                    Zpět do katalogu
                </button>
            </div>
        );
    }

    const parsedLoc = parseLocationCode(item.location_code || '');
    const canEdit = user.is_admin || user.permissions?.inventory_edit !== false;

    return (
        <div className="space-y-6 font-sans max-w-4xl mx-auto item-page-slide-up">
            {/* CSS Keyframe Animation for Smooth Entry */}
            <style>{`
                @keyframes slideUpFadeIn {
                    from {
                        transform: translateY(28px) scale(0.98);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
                .item-page-slide-up {
                    animation: slideUpFadeIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between bg-brand-dark border border-brand-border p-4 rounded-2xl">
                <button
                    onClick={onBack}
                    className="p-2.5 bg-brand-darker hover:bg-slate-800 text-gray-200 font-bold rounded-xl border border-brand-border transition flex items-center justify-center active:scale-95"
                    title="Return / Close Item View"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (isPrinterAvailable) {
                                setIsPrintingLabel(true);
                            }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition ${
                            isPrinterAvailable
                                ? 'bg-brand-darker hover:bg-brand-teal/20 text-brand-teal border-brand-border'
                                : 'bg-slate-900/80 text-gray-500 border-slate-800 cursor-not-allowed opacity-75'
                        }`}
                        title={isPrinterAvailable ? "Tisknout štítek" : "Driver nenainstalován"}
                    >
                        <PrinterIcon className={`h-4 w-4 ${isPrinterAvailable ? 'text-brand-teal' : 'text-gray-500'}`} />
                        Tisknout štítek
                    </button>

                    {canEdit && (
                        <>
                            <button
                                onClick={() => setIsEditingModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-darker hover:bg-slate-700 text-gray-200 font-bold text-xs rounded-xl border border-brand-border transition"
                            >
                                <EditIcon className="h-4 w-4" />
                                Upravit
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Smazat položku '${item.title}'?`)) {
                                        await onDelete(item.id);
                                        onBack();
                                    }
                                }}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition"
                                title="Delete Item"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Item Header Card */}
            <div className="bg-brand-dark border border-brand-border p-6 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-lg border border-brand-teal/30">
                            {item.category}
                        </span>
                        <h1 className="text-2xl font-black text-white tracking-tight mt-2">{item.title}</h1>
                    </div>

                    {/* Location Badge */}
                    <div className="bg-brand-darker border border-amber-500/40 px-4 py-2.5 rounded-xl text-right">
                        <p className="text-[10px] text-gray-400 font-sans font-semibold uppercase">Location Code</p>
                        <p className="text-base font-mono font-extrabold text-amber-400 mt-0.5">{item.location_code}</p>
                    </div>
                </div>

                {/* Location Grid breakdown */}
                {parsedLoc && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-brand-border/60 font-sans">
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Rack</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">#{parsedLoc.rack}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Sektor/Police</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">#{parsedLoc.sector}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Číslo boxu</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">{parsedLoc.box === 0 ? '0 (None)' : `#${parsedLoc.box}`}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">ID položky</span>
                            <span className="text-emerald-400 font-bold font-mono text-sm mt-0.5 block">#{parsedLoc.itemId}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Grid Layout: Floorplan Minimap & Item Specifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dílna Floorplan Outline Minimap */}
                <div className="lg:col-span-2 bg-brand-dark border border-brand-border p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-brand-teal" />
                        Floorplan Location Pin
                    </h3>
                    <DilnaFloorplanOutline 
                        locationCode={item.location_code}
                        itemTitle={item.title}
                        className="h-[340px] w-full"
                    />
                </div>

                {/* Information Card */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ClipboardIcon className="h-4 w-4 text-brand-teal" />
                        Item Details
                    </h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between py-2 border-b border-brand-border/60">
                            <span className="text-gray-400">Kategorie:</span>
                            <span className="font-semibold text-white">{item.category}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-border/60">
                            <span className="text-gray-400">Umístění (ID):</span>
                            <span className="font-mono font-bold text-amber-400">{item.location_code}</span>
                        </div>
                        {item.notes && (
                            <div className="pt-2">
                                <span className="text-gray-400 block mb-1">Poznámka:</span>
                                <p className="text-gray-300 bg-brand-darker p-3 rounded-xl border border-brand-border leading-relaxed font-sans">{item.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Brother Label Print Engine Modal */}
            {isPrintingLabel && (
                <LabelPrinterModal
                    isOpen={isPrintingLabel}
                    onClose={() => setIsPrintingLabel(false)}
                    item={item}
                    onAddToQueue={onAddToQueue}
                    showPrintLater={false}
                />
            )}

            {/* Edit Item Modal */}
            {isEditingModalOpen && (
                <EditItemModal
                    isOpen={isEditingModalOpen}
                    onClose={() => setIsEditingModalOpen(false)}
                    item={item}
                    allItems={allItems}
                    onSave={async (updatedData) => {
                        await onUpdateItem({ ...item, ...updatedData });
                        setIsEditingModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem;
    allItems: InventoryItem[];
    onSave: (data: any) => Promise<void>;
}

const EditItemModal: React.FC<EditModalProps> = ({ isOpen, onClose, item, allItems = [], onSave }) => {
    const itemCategory = item?.category || 'General';
    const itemLocation = item?.location_code || '11-0001';

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

    const existingCategories = useMemo(() => {
        const set = new Set(allItems.map(i => i.category).filter(Boolean));
        if (set.size === 0) set.add('General');
        return Array.from(set).sort();
    }, [allItems]);

    const [selectedCatOption, setSelectedCatOption] = useState<string>(
        existingCategories.includes(itemCategory) ? itemCategory : '__NEW__'
    );
    const [customCategory, setCustomCategory] = useState<string>(
        !existingCategories.includes(itemCategory) ? itemCategory : ''
    );

    const activeCategory = selectedCatOption === '__NEW__' ? customCategory : selectedCatOption;

    const parsedInitial = parseLocationCode(itemLocation);
    const [rack, setRack] = useState<number>(parsedInitial ? parsedInitial.rack : 1);
    const [sector, setSector] = useState<number>(parsedInitial ? parsedInitial.sector : 2);
    const [box, setBox] = useState<number>(parsedInitial ? parsedInitial.box : 0);
    const [itemNum, setItemNum] = useState<string>(parsedInitial ? parsedInitial.itemId : '001');
    const [notes, setNotes] = useState(item?.notes || '');

    if (!isOpen || !item) return null;

    const computedLocationCode = formatLocationCode(rack, sector, box, itemNum);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = activeCategory.trim() || 'General';

        await onSave({
            title: title.slice(0, 30),
            category: finalCategory.slice(0, 22),
            location_code: computedLocationCode,
            zone: `Rack ${rack}`,
            qr_code: computedLocationCode,
            notes
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans overflow-hidden">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker shrink-0">
                    <h2 className="text-lg font-bold text-white">Upravit položku</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Item Title Input + Live Letter Counter */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-gray-300 font-sans">Název položky *</label>
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
                            className={`w-full px-3 py-2 bg-brand-darker border rounded-xl text-xs text-white focus:outline-none font-sans transition ${
                                title.length >= 30 ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/30' : 'border-brand-border focus:border-brand-teal'
                            }`}
                        />
                    </div>

                    {/* Category Dropdown & Custom Input */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-gray-300 font-sans">Kategorie *</label>
                            <span className={`text-xs font-mono font-bold transition-colors ${
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

                    {/* Location Scheme (XY-ZAAA) */}
                    <div className="p-4 sm:p-5 bg-brand-darker border border-brand-border rounded-2xl space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="block text-xs font-bold text-brand-teal uppercase tracking-wider font-sans">
                                Schéma lokace: XY-ZAAA
                            </label>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                {computedLocationCode}
                            </span>
                        </div>

                        {/* 4 Equal Columns Grid with Symmetrical Gaps and Centered Titles */}
                        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 items-end">
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[11px] font-bold text-gray-300 font-sans text-center mb-1.5 whitespace-nowrap">
                                    Regál (X)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="9"
                                    value={rack}
                                    onChange={(e) => setRack(Number(e.target.value))}
                                    className="w-full h-10 px-2 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[11px] font-bold text-gray-300 font-sans text-center mb-1.5 whitespace-nowrap">
                                    Sektor (Y)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={sector}
                                    onChange={(e) => setSector(Number(e.target.value))}
                                    className="w-full h-10 px-2 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[11px] font-bold text-gray-300 font-sans text-center mb-1.5 whitespace-nowrap">
                                    Box (Z)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9"
                                    value={box}
                                    onChange={(e) => setBox(Number(e.target.value))}
                                    className="w-full h-10 px-2 bg-slate-900 border border-brand-border rounded-xl text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-brand-teal transition"
                                />
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <label className="block text-[11px] font-bold text-gray-300 font-sans text-center mb-1.5 whitespace-nowrap">
                                    ID Položky
                                </label>
                                <div className="w-full h-10 px-2 flex items-center justify-center bg-slate-950 border border-brand-teal/40 rounded-xl text-sm text-brand-teal font-mono font-bold text-center select-none">
                                    {itemNum}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Poznámky / Popis</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal font-sans"
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
                            className="flex-1 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold rounded-xl text-xs shadow-lg transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
