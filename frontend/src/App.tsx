import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AccessControl } from './pages/AccessControl';
import { InventoryCatalog } from './pages/InventoryCatalog';
import { OnboardingPrint } from './pages/OnboardingPrint';
import { QrScanner } from './pages/QrScanner';
import { UserManagement } from './pages/UserManagement';
import { WebConnect } from './pages/WebConnect';
import { authService } from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-brand-dark text-brand-paper overflow-hidden">
      {/* Top Bar Header */}
      <Header onLogout={() => setIsAuthenticated(false)} />

      {/* Main Container with Sidebar + Page View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Permanent 240px Sidebar Menu */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Page Content */}
        <main className="flex-1 bg-brand-dark overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'access' && <AccessControl />}
          {activeTab === 'inventory' && <InventoryCatalog />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'onboard' && <OnboardingPrint />}
          {activeTab === 'scanner' && <QrScanner />}
          {activeTab === 'webconnect' && <WebConnect />}
        </main>
      </div>
    </div>
  );
}

export default App;
