import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AccessControl } from './components/AccessControl';
import { InventoryCatalog } from './components/InventoryCatalog';
import { QrScanner } from './components/QrScanner';
import { WebConnect } from './components/WebConnect';
import { UserManagement } from './components/UserManagement';
import { Header, TabType } from './components/Header';
import { Toast } from './components/Toast';
import { User, Chip, AccessLog, InventoryItem } from './types';

const API_BASE_URL = '';

// Helper for safe error parsing from HTTP responses
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

    const [chips, setChips] = useState<Chip[]>([]);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    // Fetch all platform data
    const fetchAllData = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        setIsLoading(true);
        try {
            const canViewLogs = user.is_admin || user.permissions?.view_logs;

            const [chipsRes, logsRes, invRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/chips`),
                canViewLogs ? fetch(`${API_BASE_URL}/api/logs`) : Promise.resolve(null),
                fetch(`${API_BASE_URL}/api/inventory`)
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
        } catch (error) {
            console.error('Data sync error:', error);
            showToast('Error syncing with backend server.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, showToast]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData();
        }
    }, [isAuthenticated, fetchAllData]);

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
            showToast(`Added item '${itemData.title}'.`, 'success');
            fetchAllData();
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
            showToast(`Updated '${updatedItem.title}'.`, 'success');
            fetchAllData();
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
            fetchAllData();
        } catch (e: any) {
            showToast(e.message || 'Error deleting item.', 'error');
        }
    };

    const handleLookupQrItem = async (qrCode: string): Promise<InventoryItem | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/inventory/lookup/${encodeURIComponent(qrCode)}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.error('QR lookup error:', e);
        }
        return null;
    };

    // Render Active View
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
                        onNavigate={(tab) => setActiveTab(tab)}
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
                return (
                    <InventoryCatalog
                        items={inventoryItems}
                        user={user}
                        onAddItem={handleAddInventoryItem}
                        onUpdateItem={handleUpdateInventoryItem}
                        onDeleteItem={handleDeleteInventoryItem}
                        showToast={showToast}
                    />
                );
            case 'scanner':
                return (
                    <QrScanner
                        onLookupItem={handleLookupQrItem}
                    />
                );
            case 'webconnect':
                return <WebConnect />;
            case 'users':
                return <UserManagement chips={chips} showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-light font-sans">
            {isAuthenticated && user ? (
                <div className="flex flex-col md:flex-row min-h-screen">
                    <Header
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onLogout={handleLogout}
                        user={user}
                        showToast={showToast}
                    />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-brand-bg overflow-y-auto max-w-7xl mx-auto w-full">
                        {renderActiveTabContent()}
                    </main>
                </div>
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;