import React, { useState } from 'react';
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
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
    item,
    user,
    allItems = [],
    onBack,
    onUpdateItem,
    onDelete
}) => {
    const [isPrintingLabel, setIsPrintingLabel] = useState(false);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const parsedLoc = parseLocationCode(item.location_code);
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
                        onClick={() => setIsPrintingLabel(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-darker hover:bg-brand-teal/20 text-brand-teal font-bold text-xs rounded-xl border border-brand-border transition"
                    >
                        <PrinterIcon className="h-4 w-4" />
                        Print Label
                    </button>

                    {canEdit && (
                        <>
                            <button
                                onClick={() => setIsEditingModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-darker hover:bg-slate-700 text-gray-200 font-bold text-xs rounded-xl border border-brand-border transition"
                            >
                                <EditIcon className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm(`Delete item '${item.title}'?`)) {
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

                {/* Parsed Location Breakdown (Montserrat labels, Mono numbers) */}
                {parsedLoc && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-brand-border/60 font-sans">
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Rack (X)</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">#{parsedLoc.rack}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Sector/Shelf (Y)</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">#{parsedLoc.sector}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Box # (Z)</span>
                            <span className="text-white font-bold font-mono text-sm mt-0.5 block">{parsedLoc.box === 0 ? '0 (None)' : `#${parsedLoc.box}`}</span>
                        </div>
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[11px] font-sans font-semibold">Item ID (AAA)</span>
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
                        <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                            <span className="text-gray-400 block text-[10px] uppercase font-sans font-semibold">QR Payload / SKU</span>
                            <span className="text-brand-teal font-mono font-bold text-sm block mt-0.5">{item.qr_code}</span>
                        </div>

                        {item.notes ? (
                            <div className="bg-brand-darker p-3 rounded-xl border border-brand-border">
                                <span className="text-gray-400 block text-[10px] uppercase font-sans font-semibold">Notes & Description</span>
                                <p className="text-gray-200 mt-1 leading-relaxed">{item.notes}</p>
                            </div>
                        ) : (
                            <div className="bg-brand-darker p-3 rounded-xl border border-brand-border text-gray-500 font-sans text-[11px]">
                                No additional notes recorded.
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

// Edit Item Modal
interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem;
    allItems: InventoryItem[];
    onSave: (data: any) => Promise<void>;
}

const EditItemModal: React.FC<EditModalProps> = ({ isOpen, onClose, item, allItems, onSave }) => {
    const [title, setTitle] = useState(item.title);
    const [category, setCategory] = useState(item.category);
    const parsedInitial = parseLocationCode(item.location_code || '12-0001');
    const [rack, setRack] = useState<number>(parsedInitial ? parsedInitial.rack : 1);
    const [sector, setSector] = useState<number>(parsedInitial ? parsedInitial.sector : 2);
    const [box, setBox] = useState<number>(parsedInitial ? parsedInitial.box : 0);
    const [itemNum, setItemNum] = useState<string>(parsedInitial ? parsedInitial.itemId : '001');
    const [notes, setNotes] = useState(item.notes || '');

    React.useEffect(() => {
        const nextSeq = getNextSequenceForItem(allItems, rack, sector, box);
        // Keep existing item sequence if rack/sector/box haven't changed
        if (parsedInitial && rack === parsedInitial.rack && sector === parsedInitial.sector && box === parsedInitial.box) {
            setItemNum(parsedInitial.itemId);
        } else {
            setItemNum(nextSeq);
        }
    }, [rack, sector, box, allItems, item, parsedInitial]);

    if (!isOpen) return null;

    const computedLocationCode = formatLocationCode(rack, sector, box, itemNum);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            title,
            category,
            location_code: computedLocationCode,
            zone: `Rack ${rack}`,
            qr_code: computedLocationCode,
            notes
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 font-sans">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <h2 className="text-lg font-bold text-white">Edit Inventory Item</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Item Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
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
                                className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Location ID / QR Payload</label>
                            <div className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs font-mono font-bold text-brand-teal">
                                {computedLocationCode}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-brand-darker border border-brand-border rounded-xl space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 font-sans">Rack (X)</label>
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
                                <label className="block text-[10px] font-semibold text-gray-400 font-sans">Sector/Shelf (Y)</label>
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
                                <label className="block text-[10px] font-semibold text-gray-400 font-sans">Box # (Z)</label>
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
                                <label className="block text-[10px] font-semibold text-gray-400 font-sans">Item ID (AAA)</label>
                                <div className="w-full px-2 py-1.5 bg-slate-900 border border-brand-border/60 rounded text-xs text-brand-teal font-mono font-bold text-center select-none">
                                    {itemNum}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Description</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal"
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
                            className="flex-1 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold rounded-xl text-xs transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
