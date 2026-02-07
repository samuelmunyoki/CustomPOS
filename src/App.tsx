import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { useSettings } from '@/hooks/useSettings';
import { initDatabase } from '@/lib/database';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';

import LoginPage from '@/pages/LoginPage';
import POSPage from '@/pages/POSPage';
import AdminDashboard from '@/pages/AdminDashboard';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import SalesPage from '@/pages/SalesPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';
import DiscountsPage from '@/pages/DiscountsPage';
import MPesaPage from '@/pages/MPesaPage';
import PrintersPage from '@/pages/PrintersPage';
import BarcodesPage from '@/pages/BarcodesPage';
import HeldSalesPage from '@/pages/HeldSalesPage';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { ThemeConfig } from './types';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { isDark } = useTheme();
  const { settings, loading: settingsLoading } = useSettings();
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('pos');
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
      primaryHue: 222,
      primarySaturation: 47,
      primaryLightness: 11,
      borderRadius: 0.75,
      fontScale: 1,
      primaryColor: '#720931'
    });

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setInitError('Failed to initialize database. Please refresh the page.');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (dbInitialized && !settingsLoading && settings) {
      console.log('Applying all saved settings on app launch:', settings);
      
      if (settings.currency) {
        document.documentElement.setAttribute('data-currency', settings.currency);
        document.documentElement.setAttribute('data-currency-symbol', settings.currencySymbol || 'KSh');
      }
      
      if (settings.taxEnabled !== undefined) {
        document.documentElement.setAttribute('data-tax-enabled', String(settings.taxEnabled));
      }
      
      if (settings.vatEnabled !== undefined) {
        document.documentElement.setAttribute('data-vat-enabled', String(settings.vatEnabled));
      }
      
      if (settings.storeName) {
        document.documentElement.setAttribute('data-store-name', settings.storeName);
      }
    }

    
    const {
      primaryHue = 222,
      primarySaturation = 47,
      primaryLightness = 11,
      borderRadius = 0.75,
    } = themeConfig;

     const root = document.documentElement;

    const isDark = primaryLightness < 50;
    const foregroundHue = primaryHue;
    const foregroundSaturation = primarySaturation;
    const foregroundLightness = isDark ? 98 : 2; 

    root.style.setProperty('--theme-hue', String(primaryHue));
    root.style.setProperty('--theme-saturation', `${primarySaturation}%`);
    root.style.setProperty('--theme-lightness', `${primaryLightness}%`);
    
    root.style.setProperty('--primary', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
    
    root.style.setProperty('--primary-foreground', `${foregroundHue} ${foregroundSaturation}% ${foregroundLightness}%`);
    
    root.style.setProperty('--ring', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
    root.style.setProperty('--radius', `${borderRadius}rem`);
    
    const borderLightness = isDark ? Math.min(primaryLightness + 15, 95) : Math.max(primaryLightness - 15, 5);
  
    root.style.setProperty('--input', `${primaryHue} ${primarySaturation}% 95%`);
    root.style.setProperty('--background', `${primaryHue} ${primarySaturation}% 100%`);
   
  }, [dbInitialized, settingsLoading, settings]);

  if (isLoading || !dbInitialized || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            {!dbInitialized ? 'Initializing database...' : settingsLoading ? 'Loading settings...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h2 className="text-xl font-semibold">Initialization Error</h2>
          <p className="text-muted-foreground">{initError}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'attendant' && currentPage !== 'pos' && currentPage !== 'held-sales') {
    setCurrentPage('pos');
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pos':
        return <POSPage />;
      case 'held-sales':
        return <HeldSalesPage />;
      case 'dashboard':
        return user.role === 'admin' ? <AdminDashboard /> : <POSPage />;
      case 'products':
        return user.role === 'admin' ? <ProductsPage /> : <POSPage />;
      case 'categories':
        return user.role === 'admin' ? <CategoriesPage /> : <POSPage />;
      case 'sales':
        return user.role === 'admin' ? <SalesPage /> : <POSPage />;
      case 'reports':
        return user.role === 'admin' ? <ReportsPage /> : <POSPage />;
      case 'settings':
        return user.role === 'admin' ? <SettingsPage /> : <POSPage />;
      case 'users':
        return user.role === 'admin' ? <UsersPage /> : <POSPage />;
      case 'discounts':
        return user.role === 'admin' ? <DiscountsPage /> : <POSPage />;
      case 'mpesa':
        return user.role === 'admin' ? <MPesaPage /> : <POSPage />;
      case 'printers':
        return user.role === 'admin' ? <PrintersPage /> : <POSPage />;
      case 'barcodes':
        return user.role === 'admin' ? <BarcodesPage /> : <POSPage />;
      default:
        return <POSPage />;
    }
  };

  return (
    <div className={`min-h-screen bg-background ${isDark ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header currentPage={currentPage} />
          <main className="flex-1 overflow-auto p-4">
            {renderPage()}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
