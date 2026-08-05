import React, { useState, useCallback, useEffect, useRef } from 'react';
import Login from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AccessControl } from './components/AccessControl';
import { InventoryCatalog } from './components/InventoryCatalog';
import { QrScanner } from './components/QrScanner';
import { UserManagement } from './components/UserManagement';
import { ItemDetailView } from './components/ItemDetailView';
import { Header, TabType } from './components/Header';
import { Toast } from './components/Toast';
import { User, Chip, AccessLog, InventoryItem, PrintQueueItem } from './types';
import { PrintQueueModal } from './components/PrintQueueModal';

const API_BASE_URL = '';

const parseResponseError = async (res: Response, fallbackMessage: string): Promise<string> => {
    try {
        const text = await res.text();
        if (text) {
            try {
                const json = JSON.parse(text);
                return json.detail || json.message || text;
            } catch {
                return text;
            }
        }
    } catch {
        // empty response
    }
    return `${fallbackMessage} (Status ${res.status})`;
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const [chips, setChips] = useState<Chip[]>([]);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Print Queue State with localStorage persistence
    const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>(() => {
        try {
            const saved = localStorage.getItem('gypri_print_queue');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isPrintQueueOpen, setIsPrintQueueOpen] = useState<boolean>(false);

    useEffect(() => {
        try {
            localStorage.setItem('gypri_print_queue', JSON.stringify(printQueue));
        } catch (e) {
            console.error('Failed to persist print queue:', e);
        }
    }, [printQueue]);

    const handleAddToPrintQueue = (item: InventoryItem, tape_size: '18mm' | '9mm') => {
        const newItem: PrintQueueItem = {
            item,
            tape_size,
            addedAt: Date.now()
        };
        setPrintQueue(prev => [...prev, newItem]);
        showToast(`Položka '${item.title}' přidána do tiskové fronty (${tape_size})`, 'success');
    };

    const handleRemoveFromPrintQueue = (index: number) => {
        setPrintQueue(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearPrintQueue = () => {
        setPrintQueue([]);
        showToast('Tisková fronta byla vyprázdněna.', 'success');
    };

    const handleUpdateQueueItemTape = (index: number, tape_size: '18mm' | '9mm') => {
        setPrintQueue(prev => prev.map((q, i) => i === index ? { ...q, tape_size } : q));
    };

    const handlePrintQueueBatch = async () => {
        if (printQueue.length === 0) return;
        
        const payloadItems = printQueue.map(q => ({
            title: q.item.title,
            location_code: q.item.location_code,
            qr_code: q.item.qr_code || q.item.location_code,
            category: q.item.category || 'General',
            tape_size: q.tape_size
        }));

        const res = await fetch(`${API_BASE_URL}/api/inventory/print-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payloadItems })
        });

        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
            showToast(data.message || `Úspěšně vytisknuto ${printQueue.length} štítků z fronty!`, 'success');
            setPrintQueue([]);
            setIsPrintQueueOpen(false);
        } else {
            throw new Error(data.detail || data.message || 'Chyba dávkového tisku b-PAC.');
        }
    };

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    }, []);

    // Check localStorage session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('savedUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.removeItem('savedUser');
            }
        }
    }, []);

    const [isPrinterAvailable, setIsPrinterAvailable] = useState<boolean>(false);

    // Fetch all platform data safely without trigger loops
    const fetchAllData = useCallback(async (isSilent = false) => {
        if (!isAuthenticated || !user) return;
        if (!isSilent) setIsLoading(true);
        try {
            const canViewLogs = user.is_admin || user.permissions?.view_logs;

            const [chipsRes, logsRes, invRes, printerRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/chips`),
                canViewLogs ? fetch(`${API_BASE_URL}/api/logs`) : Promise.resolve(null),
                fetch(`${API_BASE_URL}/api/inventory`),
                fetch(`${API_BASE_URL}/api/inventory/printer-status`).catch(() => null)
            ]);

            if (chipsRes.ok) {
                const chipsData = await chipsRes.json();
                setChips(chipsData);
            }

            if (logsRes && logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData);
            }

            if (invRes.ok) {
                const invData = await invRes.json();
                setInventoryItems(invData);
            }

            if (printerRes && printerRes.ok) {
                const pData = await printerRes.json();
                setIsPrinterAvailable(!!pData.available);
            } else {
                setIsPrinterAvailable(false);
            }
        } catch (error) {
            if (!isSilent) {
                console.error('Data sync error:', error);
                showToast('Error syncing with backend server.', 'error');
            }
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [isAuthenticated, user, showToast]);

    // Initial fetch & setup 4-second real-time auto-polling interval
    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData(false);

            const interval = setInterval(() => {
                fetchAllData(true); // silent background update
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchAllData]);

    // Tab switcher always clears open item view
    const handleTabChange = (tab: TabType) => {
        setSelectedItem(null);
        setActiveTab(tab);
    };

    // Handle Login
    const handleLoginSuccess = (loggedInUser: User, rememberMe: boolean) => {
        setUser(loggedInUser);
        setIsAuthenticated(true);
        if (rememberMe) {
            localStorage.setItem('savedUser', JSON.stringify(loggedInUser));
        }
        showToast(`Welcome back, ${loggedInUser.username}!`, 'success');
    };

    // Handle Logout
    const handleLogout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setSelectedItem(null);
        localStorage.removeItem('savedUser');
        showToast('Logged out successfully.', 'success');
    };

    // RFID API Handlers
    const handleAddChip = async (newChip: Omit<Chip, 'id'>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChip)
            });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to add chip');
                throw new Error(err);
            }
            showToast(`RFID Chip for ${newChip.name} added.`, 'success');
            fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Error adding chip.', 'error');
        }
    };

    const handleUpdateChip = async (updatedChip: Chip) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chips/${updatedChip.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedChip)
            });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to update chip');
                throw new Error(err);
            }
            showToast(`Chip for ${updatedChip.name} updated.`, 'success');
            fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Error updating chip.', 'error');
        }
    };

    const handleDeleteChip = async (chipId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chips/${chipId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to delete chip');
                throw new Error(err);
            }
            showToast('RFID Chip deleted.', 'success');
            fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Error deleting chip.', 'error');
        }
    };

    const handleRemoteOpening = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/remote-opening`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Door unlock failed');
                throw new Error(err);
            }
            showToast('Remote door unlock signal transmitted!', 'success');
            setTimeout(fetchAllData, 1000);
        } catch (e: any) {
            showToast(e.message || 'Error sending remote door unlock signal.', 'error');
        }
    };

    const handleToggleServiceMode = async (enabled: boolean) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/service-mode?enabled=${enabled}&username=${user.username}`);
            if (!res.ok) {
                const err = await parseResponseError(res, 'Service mode command failed');
                throw new Error(err);
            }
            showToast(`Door service mode set to ${enabled ? 'ENABLED' : 'DISABLED'}.`, 'success');
        } catch (e: any) {
            showToast(e.message || 'Error setting service mode.', 'error');
        }
    };

    // Inventory API Handlers
    const handleAddInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to add item');
                throw new Error(err);
            }
            const created = await res.json();
            showToast(`Added item '${itemData.title}'.`, 'success');
            await fetchAllData();
            setSelectedItem(created);
        } catch (e: any) {
            showToast(e.message || 'Error adding inventory item.', 'error');
        }
    };

    const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/${updatedItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItem)
            });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to update item');
                throw new Error(err);
            }
            const saved = await res.json();
            showToast(`Updated '${updatedItem.title}'.`, 'success');
            await fetchAllData();
            setSelectedItem(saved);
        } catch (e: any) {
            showToast(e.message || 'Error updating item.', 'error');
        }
    };

    const handleDeleteInventoryItem = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to delete item');
                throw new Error(err);
            }
            showToast('Inventory item deleted.', 'success');
            setSelectedItem(null);
            fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Error deleting item.', 'error');
        }
    };

    const handleLookupQrItem = async (qrCode: string): Promise<InventoryItem | null> => {
        if (!qrCode) return null;
        const clean = qrCode.trim().toUpperCase();

        // 1. Instant local state search by location_code or qr_code
        const match = inventoryItems.find(
            i => (i.location_code && i.location_code.trim().toUpperCase() === clean) ||
                 (i.qr_code && i.qr_code.trim().toUpperCase() === clean)
        );
        if (match) return match;

        // 2. Fallback to API lookup
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/lookup/${encodeURIComponent(clean)}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.error('QR lookup error:', e);
        }
        return null;
    };

    const [pcSessionId] = useState<string>(() => {
        let id = sessionStorage.getItem('pc_scan_session');
        if (!id) {
            id = 'pc_' + Math.random().toString(36).substring(2, 8);
            sessionStorage.setItem('pc_scan_session', id);
        }
        return id;
    });
    const lastRemoteScanTimeRef = useRef<number>(Date.now() / 1000);

    // Global Remote Scan Poller for PC Screen
    // Keeps polling continuously even when ItemDetailView is open so scanning item #2 refreshes PC screen instantly!
    useEffect(() => {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobileDevice) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/inventory/remote-scan/latest?session_id=${pcSessionId}&since=${lastRemoteScanTimeRef.current}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.qr_code && data.timestamp > lastRemoteScanTimeRef.current) {
                        lastRemoteScanTimeRef.current = data.timestamp;
                        const item = await handleLookupQrItem(data.qr_code);
                        if (item) {
                            setSelectedItem(item);
                            setActiveTab('scanner');
                        }
                    }
                }
            } catch (e) {
                // Silent poll fail
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pcSessionId]);

    const handleSelectItem = (item: InventoryItem, sourceTab?: TabType) => {
        setSelectedItem(item);
        if (sourceTab) {
            setActiveTab(sourceTab);
        }
    };

    const handleCloseItemDetail = () => {
        setSelectedItem(null);
    };

    const handleDeleteCategory = async (categoryName: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/categories/${encodeURIComponent(categoryName)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || `Kategorie '${categoryName}' byla smazána.`, 'success');
                await fetchAllData();
            } else {
                showToast(data.detail || 'Chyba při mazání kategorie.', 'error');
            }
        } catch (e: any) {
            showToast('Nepodařilo se připojit k backendu.', 'error');
        }
    };

    // Render Active View scoped to active tab
    const renderActiveTabContent = () => {
        if (!user) return null;

        switch (activeTab) {
            case 'dashboard':
                return (
                    <Dashboard
                        user={user}
                        chips={chips}
                        logs={logs}
                        inventoryItems={inventoryItems}
                        onRemoteOpening={handleRemoteOpening}
                        onToggleServiceMode={handleToggleServiceMode}
                        onRefresh={fetchAllData}
                        onNavigate={(tab) => handleTabChange(tab)}
                    />
                );
            case 'access':
                return (
                    <AccessControl
                        user={user}
                        chips={chips}
                        logs={logs}
                        onAddChip={handleAddChip}
                        onUpdateChip={handleUpdateChip}
                        onDeleteChip={handleDeleteChip}
                        onRemoteOpening={handleRemoteOpening}
                        onToggleServiceMode={handleToggleServiceMode}
                        onRefresh={fetchAllData}
                        showToast={showToast}
                    />
                );
            case 'inventory':
                if (selectedItem) {
                    return (
                        <ItemDetailView
                            item={selectedItem}
                            user={user}
                            allItems={inventoryItems}
                            onBack={handleCloseItemDetail}
                            onUpdateItem={handleUpdateInventoryItem}
                            onDelete={handleDeleteInventoryItem}
                            onDeleteCategory={handleDeleteCategory}
                            onAddToQueue={handleAddToPrintQueue}
                            isPrinterAvailable={isPrinterAvailable}
                        />
                    );
                }
                return (
                    <InventoryCatalog
                        items={inventoryItems}
                        user={user}
                        onAddItem={handleAddInventoryItem}
                        onUpdateItem={handleUpdateInventoryItem}
                        onDeleteItem={handleDeleteInventoryItem}
                        onDeleteCategory={handleDeleteCategory}
                        onSelectItem={(item) => handleSelectItem(item, 'inventory')}
                        showToast={showToast}
                        onAddToQueue={handleAddToPrintQueue}
                        queueCount={printQueue.length}
                        onOpenPrintQueue={() => setIsPrintQueueOpen(true)}
                        isPrinterAvailable={isPrinterAvailable}
                    />
                );
            case 'scanner':
                if (selectedItem) {
                    return (
                        <ItemDetailView
                            item={selectedItem}
                            user={user}
                            allItems={inventoryItems}
                            onBack={handleCloseItemDetail}
                            onUpdateItem={handleUpdateInventoryItem}
                            onDelete={handleDeleteInventoryItem}
                            onAddToQueue={handleAddToPrintQueue}
                        />
                    );
                }
                return (
                    <QrScanner
                        pcSessionId={pcSessionId}
                        onLookupItem={handleLookupQrItem}
                        onSelectItem={(item) => handleSelectItem(item, 'scanner')}
                    />
                );
            case 'users':
                return <UserManagement chips={chips} showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-light font-sans relative overflow-hidden">
            {/* Ambient Brand Teal Radial Mesh Gradient Background overlays */}
            <img 
                src="/assets/gradient.svg" 
                alt="" 
                className="fixed -top-40 -right-40 w-[750px] h-[750px] pointer-events-none opacity-35 mix-blend-screen select-none z-0" 
            />
            <img 
                src="/assets/gradient.svg" 
                alt="" 
                className="fixed -bottom-48 -left-48 w-[850px] h-[850px] pointer-events-none opacity-30 mix-blend-screen select-none z-0" 
            />

            {isAuthenticated && user ? (
                <div className="flex flex-col md:flex-row min-h-screen relative z-10">
                    <Header
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                        onLogout={handleLogout}
                        user={user}
                        showToast={showToast}
                        queueCount={printQueue.length}
                        onOpenPrintQueue={() => setIsPrintQueueOpen(true)}
                    />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                        <div key={`${activeTab}-${selectedItem ? selectedItem.id : 'list'}`} className="animate-page-transition">
                            {renderActiveTabContent()}
                        </div>
                    </main>

                    {/* Print Queue Batch Modal */}
                    {isPrintQueueOpen && (
                        <PrintQueueModal
                            isOpen={isPrintQueueOpen}
                            onClose={() => setIsPrintQueueOpen(false)}
                            queue={printQueue}
                            onRemoveFromQueue={handleRemoveFromPrintQueue}
                            onClearQueue={handleClearPrintQueue}
                            onUpdateQueueItemTape={handleUpdateQueueItemTape}
                            onPrintQueue={handlePrintQueueBatch}
                            showToast={showToast}
                        />
                    )}
                </div>
            ) : (
                <div className="relative z-10">
                    <Login onLoginSuccess={handleLoginSuccess} />
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;