import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Edit2, MapPin, Tag, Box } from 'lucide-react';
import { inventoryService, mapService } from '../services/api';
import { InventoryItem, MapZone } from '../types';
import { WorkshopMinimap } from '../components/WorkshopMinimap';

export const InventoryCatalog: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rack, setRack] = useState(6);
  const [pozice, setPozice] = useState(1);
  const [boxNum, setBoxNum] = useState(0);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchZones();
  }, []);

  const fetchInventory = async (query = search) => {
    setLoading(true);
    try {
      const data = await inventoryService.list(query);
      setItems(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await mapService.getZones();
      setZones(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await inventoryService.create({
        name,
        rack,
        pozice,
        box: boxNum,
        category,
        note,
      });
      setShowAddModal(false);
      setName('');
      fetchInventory();
    } catch (e) {
      alert('Error creating item: ' + e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await inventoryService.delete(id);
      setSelectedItem(null);
      fetchInventory();
    } catch (e) {
      alert('Delete failed: ' + e);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-paper tracking-wider">
            INVENTORY CATALOG
          </h2>
          <p className="text-xs text-brand-paperMuted mt-1">
            Exact storage scheme XY-ZAAA (Rack-Position-Box-ID)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-brand-mint absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchInventory(e.target.value);
              }}
              placeholder="Search item or XY-ZAAA..."
              className="w-full bg-brand-surface border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-brand-paper focus:outline-none focus:border-brand-mint"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-brand-mint text-brand-dark font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-mintLight transition-colors shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Item List | Right 2D Map Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Item List (5 cols) */}
        <div className="lg:col-span-5 bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-xl space-y-3">
          {loading ? (
            <p className="text-xs text-brand-paperMuted text-center py-8">Loading inventory catalog...</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-brand-paperMuted text-center py-8">No inventory items found</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-mint/20 border-brand-mint text-brand-paper shadow-md'
                        : 'bg-brand-dark/40 border-brand-border/60 hover:bg-brand-dark/80 text-brand-paperMuted'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-brand-paper">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-brand-paperMuted flex items-center space-x-2">
                        <span>Rack {item.rack}, Pos {item.pozice} {item.box > 0 && `(Box ${item.box})`}</span>
                        {item.category && <span>• {item.category}</span>}
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-brand-dark border border-brand-mint/40 text-brand-mintLight text-xs font-black rounded-lg font-mono">
                      {item.item_code}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Item Details & Interactive 2D Minimap (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedItem ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-brand-mint text-brand-dark text-xs font-black rounded-lg font-mono">
                      LOC: {selectedItem.item_code}
                    </span>
                    <h3 className="text-xl font-black text-brand-paper">{selectedItem.name}</h3>
                  </div>
                  <p className="text-xs text-brand-paperMuted mt-1">
                    Added to system: {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="text-brand-paperMuted hover:text-brand-denied p-2 rounded-lg transition-colors"
                  title="Delete Item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-brand-dark/60 border border-brand-border/60 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-brand-paperMuted font-semibold">Rack Storage (X):</span>
                  <p className="font-bold text-brand-paper text-sm">Rack #{selectedItem.rack}</p>
                </div>
                <div>
                  <span className="text-brand-paperMuted font-semibold">Position/Shelf (Y):</span>
                  <p className="font-bold text-brand-paper text-sm">Position #{selectedItem.pozice}</p>
                </div>
                <div>
                  <span className="text-brand-paperMuted font-semibold">Box Number (Z):</span>
                  <p className="font-bold text-brand-paper text-sm">
                    {selectedItem.box > 0 ? `Box #${selectedItem.box}` : '0 (No Box)'}
                  </p>
                </div>
                <div>
                  <span className="text-brand-paperMuted font-semibold">Item Barcode:</span>
                  <p className="font-mono text-brand-mintLight font-bold">{selectedItem.barcode}</p>
                </div>
              </div>

              {selectedItem.note && (
                <div className="bg-brand-dark/40 border border-brand-border/40 p-3 rounded-xl text-xs text-brand-paperMuted">
                  <span className="font-bold text-brand-paper">Notes: </span>
                  {selectedItem.note}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-xs text-brand-paperMuted">
              Select an item from the left catalog to view details and map location.
            </div>
          )}

          {/* Interactive 2D Minimap Floorplan Pin inspector */}
          <WorkshopMinimap
            zones={zones}
            selectedRack={selectedItem?.rack}
            onRefreshZones={fetchZones}
          />
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-brand-paper mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-brand-mint" />
              <span>Add New Inventory Item</span>
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Šroubovák červený křížový"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                    Rack (X) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="9"
                    value={rack}
                    onChange={(e) => setRack(parseInt(e.target.value) || 1)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                    Position (Y) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="9"
                    value={pozice}
                    onChange={(e) => setPozice(parseInt(e.target.value) || 1)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                    Box (Z)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={boxNum}
                    onChange={(e) => setBoxNum(parseInt(e.target.value) || 0)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Hand Tools"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint h-20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-brand-paperMuted hover:text-brand-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-mint text-brand-dark font-bold rounded-lg text-sm hover:bg-brand-mintLight transition-colors"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
