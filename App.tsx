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

interface ErrorBoundaryProps {
    children: React.ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Caught UI ErrorBoundary Exception:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center bg-brand-dark border border-rose-500/30 rounded-2xl max-w-xl mx-auto my-12 font-sans space-y-4 shadow-2xl">
                    <div className="text-rose-400 font-extrabold text-lg">⚠️ Chybový stav aplikace</div>
                    <p className="text-xs text-gray-300">
                        {this.state.error?.message || "Došlo k neočekávané chybě při vykreslování."}
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            if (this.props.onReset) this.props.onReset();
                        }}
                        className="px-5 py-2.5 bg-brand-teal text-black font-extrabold text-xs rounded-xl shadow transition hover:bg-brand-teal-hover"
                    >
                        Obnovit zobrazení
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

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

        // 1. Try direct browser call to local print_agent.py on port 5001 (fast PC execution)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const directRes = await fetch('http://127.0.0.1:5001/print-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: payloadItems }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (directRes.ok) {
                const directData = await directRes.json();
                if (directData.success) {
                    showToast(directData.message || `Úspěšně vytisknuto ${printQueue.length} štítků z fronty!`, 'success');
                    setPrintQueue([]);
                    setIsPrintQueueOpen(false);
                    return;
                }
            }
        } catch (directErr) {
            // Direct call failed, fall back to server API route below
        }

        // 2. Fallback via server API route
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

            // Probe print agent directly from browser first (fast 1.2s check on PC)
            let directPrinterStatus = false;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200);
                const directRes = await fetch('http://127.0.0.1:5001/status', { signal: controller.signal });
                clearTimeout(timeoutId);
                if (directRes.ok) {
                    const directData = await directRes.json();
                    if (directData.bpac_available || directData.status === 'online') {
                        directPrinterStatus = true;
                    }
                }
            } catch (directErr) {
                // Browser is on another host or print_agent not running on local loopback
            }

            const [chipsRes, logsRes, invRes, printerRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/chips`),
                canViewLogs ? fetch(`${API_BASE_URL}/api/logs`) : Promise.resolve(null),
                fetch(`${API_BASE_URL}/api/inventory`),
                directPrinterStatus ? Promise.resolve(null) : fetch(`${API_BASE_URL}/api/inventory/printer-status`).catch(() => null),
                fetch(`${API_BASE_URL}/api/users`).catch(() => null)
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

            if (directPrinterStatus) {
                setIsPrinterAvailable(true);
            } else if (printerRes && printerRes.ok) {
                const pData = await printerRes.json();
                setIsPrinterAvailable(!!pData.available);
            } else {
                setIsPrinterAvailable(false);
            }

            // Sync currently logged in user profile & permissions in real-time
            if (usersRes && usersRes.ok) {
                const usersData: User[] = await usersRes.json();
                const updatedMe = usersData.find((u) => u.id === user.id);
                if (updatedMe) {
                    if (JSON.stringify(updatedMe) !== JSON.stringify(user)) {
                        setUser(updatedMe);
                        localStorage.setItem('savedUser', JSON.stringify(updatedMe));
                    }
                }
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
            showToast(`RFID Čip pro ${newChip.name} byl úspěšně přidán.`, 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při přidávání čipu.', 'error');
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
            showToast(`Čip pro ${updatedChip.name} byl upraven.`, 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při úpravě čipu.', 'error');
        }
    };

    const handleDeleteChip = async (chipId: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chips/${chipId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to delete chip');
                throw new Error(err);
            }
            showToast('RFID Čip byl smazán.', 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při mazání čipu.', 'error');
        }
    };

    const handleBatchDeleteChips = async (chipIds: number[]) => {
        if (!chipIds.length) return;
        try {
            await Promise.all(chipIds.map(id => fetch(`${API_BASE_URL}/api/chips/${id}`, { method: 'DELETE' })));
            showToast(`${chipIds.length} RFID čipů bylo úspěšně smazáno.`, 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast('Chyba při hromadném mazání čipů.', 'error');
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
            showToast('Dveře byly na dálku odemknuty!', 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při otvírání dveří.', 'error');
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
            showToast(`Servisní režim dveří nastaven na ${enabled ? 'ZAPNUTO' : 'VYPNUTO'}.`, 'success');
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při nastavení servisního režimu.', 'error');
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
            showToast(`Přidána položka '${itemData.title}'.`, 'success');
            await fetchAllData();
            setSelectedItem(created);
        } catch (e: any) {
            showToast(e.message || 'Chyba při přidávání položky.', 'error');
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
            showToast(`Položka '${updatedItem.title}' byla úspěšně upravena.`, 'success');
            await fetchAllData();

            // Only keep selectedItem open if user was already viewing ItemDetailView
            if (selectedItem && selectedItem.id === updatedItem.id) {
                setSelectedItem(saved);
            }
        } catch (e: any) {
            showToast(e.message || 'Chyba při úpravě položky.', 'error');
        }
    };

    const handleDeleteInventoryItem = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await parseResponseError(res, 'Failed to delete item');
                throw new Error(err);
            }
            showToast('Položka byla smazána ze zásob.', 'success');
            setSelectedItem(null);
            await fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Chyba při mazání položky.', 'error');
        }
    };

    const handleBatchDeleteInventoryItems = async (itemIds: number[]) => {
        if (!itemIds.length) return;
        try {
            await Promise.all(itemIds.map(id => fetch(`${API_BASE_URL}/api/inventory/${id}`, { method: 'DELETE' })));
            showToast(`${itemIds.length} položek bylo smazáno ze zásob.`, 'success');
            if (selectedItem && itemIds.includes(selectedItem.id)) {
                setSelectedItem(null);
            }
            await fetchAllData();
        } catch (e: any) {
            showToast('Chyba při hromadném mazání položek.', 'error');
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
    const lastProcessedQrRef = useRef<string>('');

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
                    if (data.qr_code && data.qr_code !== lastProcessedQrRef.current && data.timestamp > lastRemoteScanTimeRef.current) {
                        lastRemoteScanTimeRef.current = Math.max(lastRemoteScanTimeRef.current, data.timestamp, Date.now() / 1000 + 0.5);
                        lastProcessedQrRef.current = data.qr_code;
                        const item = await handleLookupQrItem(data.qr_code);
                        if (item) {
                            setSelectedItem(item);
                            setActiveTab('inventory');
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
        // Advance time ref by 10s so past remote scans NEVER re-trigger when closing on PC
        lastRemoteScanTimeRef.current = Date.now() / 1000 + 10;
        lastProcessedQrRef.current = '';
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

        // Access guard: if non-admin tries accessing user management tab, redirect to dashboard
        if (activeTab === 'users' && !user.is_admin) {
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
        }

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
                        onBatchDeleteChips={handleBatchDeleteChips}
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
                        onBatchDeleteItems={handleBatchDeleteInventoryItems}
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
                return <UserManagement chips={chips} showToast={showToast} currentUser={user} onUpdateCurrentUser={setUser} onRefresh={fetchAllData} />;
            default:
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
                    <div className="flex-1 md:pl-64 w-full flex flex-col items-center">
                        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                            <ErrorBoundary onReset={() => { setSelectedItem(null); setActiveTab('dashboard'); }}>
                                <div key={`${activeTab}-${selectedItem ? selectedItem.id : 'list'}`} className="animate-page-transition">
                                    {renderActiveTabContent()}
                                </div>
                            </ErrorBoundary>
                        </main>
                    </div>

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