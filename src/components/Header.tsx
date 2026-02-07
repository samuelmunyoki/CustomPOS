import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  Store,
  Clock,
  Keyboard
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HeaderProps {
  currentPage: string;
}

const pageTitles: Record<string, string> = {
  pos: 'Point of Sale',
  'held-sales': 'Held Sales',
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  sales: 'Sales History',
  reports: 'Reports',
  discounts: 'Discounts',
  mpesa: 'MPesa Configuration',
  printers: 'Printer Settings',
  barcodes: 'Barcode Generator',
  users: 'User Management',
  settings: 'Settings'
};

const keyboardShortcuts = [
  { key: 'F1', action: 'Open POS' },
  { key: 'F2', action: 'Hold Sale' },
  { key: 'F3', action: 'Retrieve Held Sale' },
  { key: 'F4', action: 'Apply Discount' },
  { key: 'F5', action: 'Toggle Wholesale/Retail' },
  { key: 'F6', action: 'Process MPesa Payment' },
  { key: 'F7', action: 'Process Cash Payment' },
  { key: 'F8', action: 'Clear Cart' },
  { key: 'F9', action: 'Search Products' },
  { key: 'Ctrl + B', action: 'Open Barcode Scanner' },
  { key: 'Ctrl + P', action: 'Print Receipt' },
  { key: 'Ctrl + S', action: 'Save Sale' },
  { key: 'Esc', action: 'Cancel/Close' },
  { key: 'Enter', action: 'Confirm/Submit' },
];

export function Header({ currentPage }: HeaderProps) {
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-18 border-b bg-gradient-to-r from-card via-card to-muted/30 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4 animate-fade-in py-3">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {pageTitles[currentPage] || 'POS Pro'}
        </h2>
        {settings && (
          <Badge 
            variant="outline" 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-none bg-primary/5 border-primary/20 shadow-sm"
          >
            <Store className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{settings.storeName}</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Keyboard Shortcuts Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex items-center gap-2 rounded-none hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-xs font-medium">Shortcuts</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                Keyboard Shortcuts
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {keyboardShortcuts.map((shortcut, index) => (
                <div 
                  key={shortcut.key}
                  className="flex items-center justify-between p-3 rounded-none bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-card rounded-none border shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-none">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{format(currentTime, 'MMM dd, yyyy HH:mm:ss')}</span>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge 
              variant="outline" 
              className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-none shadow-sm animate-pulse-soft"
            >
              <Wifi className="w-3.5 h-3.5 mr-1.5" />
              <span className="font-medium">Online</span>
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-none shadow-sm"
            >
              <WifiOff className="w-3.5 h-3.5 mr-1.5" />
              <span className="font-medium">Offline</span>
            </Badge>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-none hover:bg-primary/10 hover:text-primary transition-all duration-300 hover-lift"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-none animate-pulse border-2 border-card" />
        </Button>
      </div>
    </header>
  );
}
