import React, { useState, useEffect } from 'react';
import { sqliteService } from './db/sqlite-service';
import { authService } from './services/auth-service';
import { businessService } from './services/business-service';
import { BusinessProfile, User } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { SettingsView } from './components/settings/SettingsView';
import { Building2, Loader2 } from 'lucide-react';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState('');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Cross-view triggers (e.g. from recent sales in dashboard to POS receipt or return modal)
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);
  const [returnSaleId, setReturnSaleId] = useState<string | null>(null);

  const initApp = async () => {
    setIsInitializing(true);
    setInitError('');
    try {
      await sqliteService.init();
      const profile = businessService.getProfile();
      setBusiness(profile);
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      // Low stock query
      const lowStockRow = sqliteService.queryOne<{ c: number }>(
        'SELECT count(*) as c FROM products WHERE current_stock <= min_stock_threshold AND is_archived = 0'
      );
      setLowStockCount(lowStockRow?.c ?? 0);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setInitError(err.message || 'Failed to initialize local SQLite database.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Global Keyboard shortcuts (F1, F2, F3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshLowStock = () => {
    try {
      const row = sqliteService.queryOne<{ c: number }>(
        'SELECT count(*) as c FROM products WHERE current_stock <= min_stock_threshold AND is_archived = 0'
      );
      setLowStockCount(row?.c ?? 0);
    } catch {
      // ignore
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">BusinessOS Pro</h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center">
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-400" />
          Mounting local SQLite 3 engine & verifying schema migrations...
        </p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 p-6 rounded-2xl text-center space-y-4">
          <div className="text-rose-400 font-bold text-lg">Database Startup Error</div>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-x-auto">
            {initError}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold"
            >
              Retry Startup
            </button>
            <button
              onClick={async () => {
                try {
                  await sqliteService.resetDatabase();
                  window.location.reload();
                } catch (e: any) {
                  alert('Reset failed: ' + e.message);
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300 border border-rose-500/30"
            >
              Reset to Factory Fresh DB
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar
        business={business}
        currentUser={currentUser}
        onUserChanged={() => {
          setCurrentUser(authService.getCurrentUser());
        }}
        onNavigateToSettings={() => setActiveTab('settings')}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            refreshLowStock();
          }}
          userRole={currentUser?.role}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                business={business}
                onNavigateToPos={() => setActiveTab('pos')}
                onNavigateToInventory={() => setActiveTab('inventory')}
                onNavigateToExpenses={() => setActiveTab('expenses')}
                onSelectSaleReceipt={(saleId) => {
                  setReceiptSaleId(saleId);
                  setActiveTab('pos');
                }}
                onSelectSaleReturn={(saleId) => {
                  setReturnSaleId(saleId);
                  setActiveTab('pos');
                }}
              />
            )}

            {activeTab === 'pos' && (
              <PosView
                business={business}
                currentUser={currentUser}
                externalSelectedReceiptSaleId={receiptSaleId}
                onCloseExternalReceipt={() => setReceiptSaleId(null)}
                externalSelectedReturnSaleId={returnSaleId}
                onCloseExternalReturn={() => setReturnSaleId(null)}
                onSaleCompleted={() => {
                  refreshLowStock();
                }}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                business={business}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchasesView
                business={business}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                business={business}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                business={business}
                currentUser={currentUser}
                defaultTab="expenses"
              />
            )}

            {activeTab === 'cash-register' && (
              <ExpensesView
                business={business}
                currentUser={currentUser}
                defaultTab="reconciliation"
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                business={business}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                currentUser={currentUser}
                onUsersUpdated={() => {
                  setCurrentUser(authService.getCurrentUser());
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onProfileUpdated={(updated) => {
                  setBusiness(updated);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
