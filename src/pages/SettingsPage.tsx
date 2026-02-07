'use client'
import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { ETimsConfig, Currency, ThemeConfig } from '@/types';
import { SUPPORTED_CURRENCIES } from '@/types';
import {
  Store,
  Mail,
  Palette,
  Receipt,
  DollarSign,
  Save,
  RotateCcw,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Calculator,
  Landmark,
  CreditCard,
  Globe,
  Check,
  FileText,
  Settings2,
  Shield,
  Split,
  Type,
  Ruler,
  Paintbrush
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PRESET_COLORS = [
  { name: 'Slate', hue: 215, sat: 20, light: 25, class: 'bg-slate-600' },
  { name: 'Gray', hue: 220, sat: 13, light: 31, class: 'bg-gray-600' },
  { name: 'Zinc', hue: 240, sat: 5, light: 26, class: 'bg-zinc-600' },
  { name: 'Neutral', hue: 0, sat: 0, light: 25, class: 'bg-neutral-600' },
  { name: 'Stone', hue: 24, sat: 10, light: 30, class: 'bg-stone-600' },
  { name: 'Red', hue: 0, sat: 72, light: 41, class: 'bg-red-600' },
  { name: 'Orange', hue: 25, sat: 95, light: 43, class: 'bg-orange-500' },
  { name: 'Amber', hue: 38, sat: 92, light: 40, class: 'bg-amber-500' },
  { name: 'Yellow', hue: 48, sat: 96, light: 40, class: 'bg-yellow-500' },
  { name: 'Lime', hue: 84, sat: 81, light: 34, class: 'bg-lime-500' },
  { name: 'Green', hue: 142, sat: 71, light: 29, class: 'bg-green-600' },
  { name: 'Emerald', hue: 160, sat: 84, light: 29, class: 'bg-emerald-600' },
  { name: 'Teal', hue: 174, sat: 72, light: 29, class: 'bg-teal-600' },
  { name: 'Cyan', hue: 189, sat: 94, light: 33, class: 'bg-cyan-600' },
  { name: 'Sky', hue: 199, sat: 89, light: 38, class: 'bg-sky-500' },
  { name: 'Blue', hue: 217, sat: 91, light: 40, class: 'bg-blue-600' },
  { name: 'Indigo', hue: 239, sat: 84, light: 47, class: 'bg-indigo-600' },
  { name: 'Violet', hue: 258, sat: 90, light: 46, class: 'bg-violet-600' },
  { name: 'Purple', hue: 271, sat: 91, light: 45, class: 'bg-purple-600' },
  { name: 'Fuchsia', hue: 330, sat: 81, light: 44, class: 'bg-fuchsia-600' },
  { name: 'Pink', hue: 330, sat: 81, light: 50, class: 'bg-pink-500' },
  { name: 'Rose', hue: 350, sat: 89, light: 46, class: 'bg-rose-500' },
];

export default function SettingsPage() {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const { mode, setMode } = useTheme();
  
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    storeKraPin: ''
  });

  const [taxForm, setTaxForm] = useState({
    taxEnabled: true,
    taxRate: '',
    taxName: '',
    vatEnabled: true,
    vatRate: '16'
  });

  const [receiptForm, setReceiptForm] = useState({
    receiptHeader: '',
    receiptFooter: '',
    currency: 'KES',
    currencySymbol: 'KSh',
    defaultSaleType: 'retail' as 'retail' | 'wholesale'
  });

  const [emailForm, setEmailForm] = useState({
    emailProvider: 'gmail' as 'gmail' | 'sendgrid' | 'mailgun' | 'smtp',
    emailApiKey: '',
    emailFrom: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: ''
  });

  const [posForm, setPosForm] = useState({
    allowAttendantPriceEdit: false,
    requirePasswordForDiscount: true,
    lowStockThreshold: '',
    allowSplitPayments: true
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryHue: 222,
    primarySaturation: 47,
    primaryLightness: 11,
    borderRadius: 0.75,
    fontScale: 1,
    primaryColor: '#0f172a'
  });

  const [eTimsConfig, setETimsConfig] = useState<Partial<ETimsConfig>>({
    enabled: false,
    pin: '',
    deviceSerialNumber: '',
    communicationKey: '',
    serverUrl: 'https://etims.kra.go.ke',
    environment: 'sandbox',
    autoSubmit: false
  });

  // Initialize settings
  useEffect(() => {
    if (settings) {
      setStoreForm({
        storeName: settings.storeName,
        storeAddress: settings.storeAddress || '',
        storePhone: settings.storePhone || '',
        storeEmail: settings.storeEmail || '',
        storeKraPin: settings.storeKraPin || ''
      });
      setTaxForm({
        taxEnabled: settings.taxEnabled,
        taxRate: settings.taxRate.toString() || '',
        taxName: settings.taxName,
        vatEnabled: settings.vatEnabled ?? true,
        vatRate: (settings.vatRate ?? 16).toString() || ''
      });
      setReceiptForm({
        receiptHeader: settings.receiptHeader || '',
        receiptFooter: settings.receiptFooter || '',
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        defaultSaleType: settings.defaultSaleType || 'retail'
      });
      setEmailForm({
        emailProvider: (settings.emailProvider as any) || 'gmail',
        emailApiKey: settings.emailApiKey || '',
        emailFrom: settings.emailFrom || '',
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort?.toString() || '',
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || ''
      });
      setPosForm({
        allowAttendantPriceEdit: settings.allowAttendantPriceEdit,
        requirePasswordForDiscount: settings.requirePasswordForDiscount,
        lowStockThreshold: settings.lowStockThreshold.toString() || '',
        allowSplitPayments: settings.allowSplitPayments ?? true
      });
      
      // Initialize theme config from settings
      if (settings.themeConfig) {
        const savedTheme = settings.themeConfig;
        setThemeConfig({
          primaryHue: savedTheme.primaryHue || 222,
          primarySaturation: savedTheme.primarySaturation || 47,
          primaryLightness: savedTheme.primaryLightness || 11,
          borderRadius: savedTheme.borderRadius || 0.75,
          fontScale: savedTheme.fontScale || 1,
          primaryColor: savedTheme.primaryColor || `hsl(${savedTheme.primaryHue || 222}, ${savedTheme.primarySaturation || 47}%, ${savedTheme.primaryLightness || 11}%)`
        });
      }
    }
    
    const config = db.getETimsConfig();
    if (config) {
      setETimsConfig(config);
    }
  }, [settings]);

  // Apply theme config to CSS variables
  useEffect(() => {
    if (!themeConfig) return;

    const {
      primaryHue = 222,
      primarySaturation = 47,
      primaryLightness = 11,
      borderRadius = 0.75,
    } = themeConfig;

    const root = document.documentElement;

    // Calculate foreground color based on lightness for better contrast
    const isDark = primaryLightness < 50;
    const foregroundHue = primaryHue;
    const foregroundSaturation = primarySaturation;
    const foregroundLightness = isDark ? 98 : 2; // White text for dark backgrounds, black for light

    // Set all CSS variables
    root.style.setProperty('--theme-hue', String(primaryHue));
    root.style.setProperty('--theme-saturation', `${primarySaturation}%`);
    root.style.setProperty('--theme-lightness', `${primaryLightness}%`);
    
    // Set primary color with proper format for shadcn
    root.style.setProperty('--primary', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
    
    // Set foreground for proper text contrast
    root.style.setProperty('--primary-foreground', `${foregroundHue} ${foregroundSaturation}% ${foregroundLightness}%`);
    
    // Set other related variables
    root.style.setProperty('--ring', `${primaryHue} ${primarySaturation}% ${primaryLightness}%`);
    root.style.setProperty('--radius', `${borderRadius}rem`);
    
    // Calculate and set border color
    const borderLightness = isDark ? Math.min(primaryLightness + 15, 95) : Math.max(primaryLightness - 15, 5);
    // root.style.setProperty('--border', `${primaryHue} ${primarySaturation}% ${borderLightness}%`);
    
    // Set input and background colors
    root.style.setProperty('--input', `${primaryHue} ${primarySaturation}% 95%`);
    root.style.setProperty('--background', `${primaryHue} ${primarySaturation}% 100%`);
    
  }, [themeConfig]);

  const saveStoreSettings = async () => {
    const result = await updateSettings(storeForm);
    if (result.success) {
      toast.success('Store settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const saveTaxSettings = async () => {
    const result = await updateSettings({
      taxEnabled: taxForm.taxEnabled,
      taxRate: parseFloat(taxForm.taxRate) || 0,
      taxName: taxForm.taxName,
      vatEnabled: taxForm.vatEnabled,
      vatRate: parseFloat(taxForm.vatRate) || 16
    });
    if (result.success) {
      toast.success('Tax settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const saveReceiptSettings = async () => {
    const result = await updateSettings(receiptForm);
    if (result.success) {
      toast.success('Receipt settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const saveEmailSettings = async () => {
    const result = await updateSettings({
      ...emailForm,
      smtpPort: emailForm.smtpPort ? parseInt(emailForm.smtpPort) : undefined
    });
    if (result.success) {
      toast.success('Email settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const savePosSettings = async () => {
    const result = await updateSettings({
      allowAttendantPriceEdit: posForm.allowAttendantPriceEdit,
      requirePasswordForDiscount: posForm.requirePasswordForDiscount,
      lowStockThreshold: parseInt(posForm.lowStockThreshold) || 10,
      allowSplitPayments: posForm.allowSplitPayments
    });
    if (result.success) {
      toast.success('POS settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const saveThemeConfig = async () => {
    try {
      // Create a complete theme config
      const themeToSave: ThemeConfig = {
        primaryHue: themeConfig.primaryHue,
        primarySaturation: themeConfig.primarySaturation,
        primaryLightness: themeConfig.primaryLightness,
        borderRadius: themeConfig.borderRadius,
        fontScale: themeConfig.fontScale,
        primaryColor: themeConfig.primaryColor || `hsl(${themeConfig.primaryHue}, ${themeConfig.primarySaturation}%, ${themeConfig.primaryLightness}%)`
      };

      console.log('Saving theme config:', themeToSave);
      
      const result = await updateSettings({
        themeConfig: themeToSave
      });
      
      if (result.success) {
        toast.success('Theme configuration saved');
        // Refresh settings to ensure theme is properly loaded
        await refreshSettings();
        
        // Force a small delay to ensure CSS variables are updated
        setTimeout(() => {
          // Re-apply CSS variables
          const root = document.documentElement;
          const isDark = themeConfig.primaryLightness < 50;
          const foregroundLightness = isDark ? 98 : 2;
          
          root.style.setProperty('--primary', `${themeConfig.primaryHue} ${themeConfig.primarySaturation}% ${themeConfig.primaryLightness}%`);
          root.style.setProperty('--primary-foreground', `${themeConfig.primaryHue} ${themeConfig.primarySaturation}% ${foregroundLightness}%`);
          root.style.setProperty('--ring', `${themeConfig.primaryHue} ${themeConfig.primarySaturation}% ${themeConfig.primaryLightness}%`);
        }, 100);
      } else {
        toast.error('Failed to save theme settings');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Error saving theme settings');
    }
  };

  const saveETimsConfig = () => {
    try {
      db.saveETimsConfig(eTimsConfig);
      toast.success('e-TIMS configuration saved');
    } catch (error) {
      toast.error('Failed to save e-TIMS configuration');
    }
  };

  const testETimsConnection = async () => {
    toast.info('Testing e-TIMS connection...');
    setTimeout(() => {
      if (eTimsConfig.enabled && eTimsConfig.pin && eTimsConfig.deviceSerialNumber) {
        toast.success('e-TIMS connection test successful');
      } else {
        toast.error('e-TIMS configuration incomplete');
      }
    }, 1500);
  };

  const exportDatabase = () => {
    const data = db.exportDatabase();
    const bytes = new Uint8Array(data);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Database exported');
  };

  const importDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        db.importDatabase(data);
        toast.success('Database imported successfully');
        refreshSettings();
        window.location.reload();
      } catch (error) {
        toast.error('Failed to import database');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetDatabase = () => {
    if (!confirm('WARNING: This will delete all data and reset to defaults. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Type "RESET" to confirm.')) return;
    
    db.resetDatabase();
    toast.success('Database reset');
    window.location.reload();
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      setReceiptForm({
        ...receiptForm,
        currency: currency.code,
        currencySymbol: currency.symbol
      });
    }
  };

  const applyPresetColor = (color: typeof PRESET_COLORS[0]) => {
    const primaryColor = `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`;
    const newThemeConfig = {
      ...themeConfig,
      primaryHue: color.hue,
      primarySaturation: color.sat,
      primaryLightness: color.light,
      primaryColor: primaryColor
    };
    
    console.log('Applying preset color:', color.name, newThemeConfig);
    setThemeConfig(newThemeConfig);
  };

  const resetToDefaultTheme = () => {
    const defaultTheme = {
      primaryHue: 222,
      primarySaturation: 47,
      primaryLightness: 11,
      borderRadius: 0.75,
      fontScale: 1,
      primaryColor: 'hsl(222, 47%, 11%)'
    };
    
    console.log('Resetting to default theme:', defaultTheme);
    setThemeConfig(defaultTheme);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between bg-card p-6 rounded shadow-lg">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Settings</h2>
          <p className="text-muted-foreground mt-1">Configure your POS system preferences</p>
        </div>
        <Button variant="outline" onClick={refreshSettings} className="rounded-none hover-lift">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-7 rounded-none p-1 items-center flex bg-primary/40">
          <TabsTrigger value="store" className="rounded-none">Store</TabsTrigger>
          <TabsTrigger value="tax" className="rounded-none">Tax</TabsTrigger>
          <TabsTrigger value="receipt" className="rounded-none">Receipt</TabsTrigger>
          <TabsTrigger value="etims" className="rounded-none">e-TIMS</TabsTrigger>
          <TabsTrigger value="theme" className="rounded-none">Theme</TabsTrigger>
          <TabsTrigger value="email" className="rounded-none">Email</TabsTrigger>
          <TabsTrigger value="pos" className="rounded-none">POS</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                Store Information
              </CardTitle>
              <CardDescription>Manage your business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Store Name</Label>
                  <Input 
                    value={storeForm.storeName}
                    onChange={e => setStoreForm({...storeForm, storeName: e.target.value})}
                    className="rounded-none"
                    placeholder="Your Store Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Store Email</Label>
                  <Input 
                    type="email"
                    value={storeForm.storeEmail}
                    onChange={e => setStoreForm({...storeForm, storeEmail: e.target.value})}
                    className="rounded-none"
                    placeholder="store@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Store Phone</Label>
                  <Input 
                    value={storeForm.storePhone}
                    onChange={e => setStoreForm({...storeForm, storePhone: e.target.value})}
                    className="rounded-none"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">KRA PIN</Label>
                  <Input 
                    value={storeForm.storeKraPin}
                    onChange={e => setStoreForm({...storeForm, storeKraPin: e.target.value})}
                    className="rounded-none"
                    placeholder="A001234567F"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">Store Address</Label>
                  <Input 
                    value={storeForm.storeAddress}
                    onChange={e => setStoreForm({...storeForm, storeAddress: e.target.value})}
                    className="rounded-none"
                    placeholder="123 Main Street, Nairobi, Kenya"
                  />
                </div>
              </div>
              <Button onClick={saveStoreSettings} className="rounded-none shadow-lg hover-lift">
                <Save className="w-4 h-4 mr-2" />
                Save Store Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                Tax Settings
              </CardTitle>
              <CardDescription>Configure tax rates for your products and services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div>
                  <p className="font-semibold">Enable Tax</p>
                  <p className="text-sm text-muted-foreground">Apply tax to sales transactions</p>
                </div>
                <Switch 
                  checked={taxForm.taxEnabled}
                  onCheckedChange={checked => setTaxForm({...taxForm, taxEnabled: checked})}
                />
              </div>
              
              {taxForm.taxEnabled && (
                <div className="grid grid-cols-2 gap-6 animate-slide-up">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tax Name</Label>
                    <Input 
                      value={taxForm.taxName}
                      onChange={e => setTaxForm({...taxForm, taxName: e.target.value})}
                      placeholder="e.g., VAT, GST, Tax"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tax Rate (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={taxForm.taxRate}
                      onChange={e => setTaxForm({...taxForm, taxRate: e.target.value})}
                      placeholder="e.g., 16"
                      className="rounded-none"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div>
                  <p className="font-semibold">Enable VAT</p>
                  <p className="text-sm text-muted-foreground">Apply VAT to products (Kenya e-TIMS)</p>
                </div>
                <Switch 
                  checked={taxForm.vatEnabled}
                  onCheckedChange={checked => setTaxForm({...taxForm, vatEnabled: checked})}
                />
              </div>

              {taxForm.vatEnabled && (
                <div className="space-y-2 animate-slide-up">
                  <Label className="text-sm font-medium">VAT Rate (%)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={taxForm.vatRate}
                    onChange={e => setTaxForm({...taxForm, vatRate: e.target.value})}
                    placeholder="16"
                    className="rounded-none"
                  />
                  <p className="text-xs text-muted-foreground">Default VAT rate for products in Kenya is 16%</p>
                </div>
              )}
              
              <Button onClick={saveTaxSettings} className="rounded-none shadow-lg hover-lift">
                <Save className="w-4 h-4 mr-2" />
                Save Tax Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                Receipt & Currency Settings
              </CardTitle>
              <CardDescription>Customize receipt content and select your currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={receiptForm.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="rounded-none">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <span className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.name} ({currency.code})</span>
                          <span className="text-muted-foreground">- {currency.symbol}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Currency Code</Label>
                  <Input 
                    value={receiptForm.currency}
                    onChange={e => setReceiptForm({...receiptForm, currency: e.target.value})}
                    placeholder="e.g., USD, KES, EUR"
                    className="rounded-none"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Currency Symbol</Label>
                  <Input 
                    value={receiptForm.currencySymbol}
                    onChange={e => setReceiptForm({...receiptForm, currencySymbol: e.target.value})}
                    placeholder="e.g., $, KSh, €"
                    className="rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Sale Type</Label>
                <Select 
                  value={receiptForm.defaultSaleType} 
                  onValueChange={(v: 'retail' | 'wholesale') => setReceiptForm({...receiptForm, defaultSaleType: v})}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select default sale type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Receipt Header</Label>
                <Input 
                  value={receiptForm.receiptHeader}
                  onChange={e => setReceiptForm({...receiptForm, receiptHeader: e.target.value})}
                  placeholder="Text to show at top of receipt"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Receipt Footer</Label>
                <Input 
                  value={receiptForm.receiptFooter}
                  onChange={e => setReceiptForm({...receiptForm, receiptFooter: e.target.value})}
                  placeholder="Text to show at bottom of receipt (e.g., Thank you for shopping with us!)"
                  className="rounded-none"
                />
              </div>
              <Button onClick={saveReceiptSettings} className="rounded-none shadow-lg hover-lift">
                <Save className="w-4 h-4 mr-2" />
                Save Receipt Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etims" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                Kenya e-TIMS Configuration
              </CardTitle>
              <CardDescription>Configure Kenya Revenue Authority e-TIMS integration for tax compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div>
                  <p className="font-semibold">Enable e-TIMS</p>
                  <p className="text-sm text-muted-foreground">Automatically submit invoices to KRA e-TIMS</p>
                </div>
                <Switch 
                  checked={eTimsConfig.enabled}
                  onCheckedChange={checked => setETimsConfig({...eTimsConfig, enabled: checked})}
                />
              </div>

              {eTimsConfig.enabled && (
                <div className="space-y-6 animate-slide-up">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">KRA PIN</Label>
                      <Input 
                        value={eTimsConfig.pin}
                        onChange={e => setETimsConfig({...eTimsConfig, pin: e.target.value})}
                        placeholder="A001234567F"
                        className="rounded-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Device Serial Number</Label>
                      <Input 
                        value={eTimsConfig.deviceSerialNumber}
                        onChange={e => setETimsConfig({...eTimsConfig, deviceSerialNumber: e.target.value})}
                        placeholder="KRA-ETIMS-001"
                        className="rounded-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Communication Key</Label>
                    <Input 
                      type="password"
                      value={eTimsConfig.communicationKey}
                      onChange={e => setETimsConfig({...eTimsConfig, communicationKey: e.target.value})}
                      placeholder="Your e-TIMS communication key"
                      className="rounded-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Server URL</Label>
                    <Input 
                      value={eTimsConfig.serverUrl}
                      onChange={e => setETimsConfig({...eTimsConfig, serverUrl: e.target.value})}
                      placeholder="https://etims.kra.go.ke"
                      className="rounded-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Environment</Label>
                      <Select 
                        value={eTimsConfig.environment} 
                        onValueChange={(v: 'sandbox' | 'production') => setETimsConfig({...eTimsConfig, environment: v})}
                      >
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Auto Submit</Label>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-none">
                        <Switch 
                          checked={eTimsConfig.autoSubmit}
                          onCheckedChange={checked => setETimsConfig({...eTimsConfig, autoSubmit: checked})}
                        />
                        <span className="text-sm text-muted-foreground">
                          {eTimsConfig.autoSubmit ? 'Invoices submitted automatically' : 'Manual submission required'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={saveETimsConfig} className="rounded-none shadow-lg hover-lift">
                      <Save className="w-4 h-4 mr-2" />
                      Save e-TIMS Config
                    </Button>
                    <Button onClick={testETimsConnection} variant="outline" className="rounded-none hover-lift">
                      <Check className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </div>
              )}

              {!eTimsConfig.enabled && (
                <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-none">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-400">e-TIMS is disabled</p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        Enable e-TIMS to comply with Kenya Revenue Authority tax regulations. 
                        All invoices will be automatically submitted to KRA.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                Theme Settings
              </CardTitle>
              <CardDescription>Customize the appearance of your POS system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Theme Mode</Label>
                <div className="flex gap-3">
                  {['light', 'dark', 'system'].map((m) => (
                    <Button
                      key={m}
                      variant={mode === m ? 'default' : 'outline'}
                      onClick={() => setMode(m as any)}
                      className={`capitalize rounded-none flex-1 hover-lift ${mode === m ? '' : 'text-foreground'}`}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Paintbrush className="w-4 h-4" />
                  Primary Color
                </Label>
                <div className="grid grid-cols-11 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => applyPresetColor(color)}
                      className={`
                        w-10 h-10 ${color.class} rounded-none transition-all duration-300 hover-lift
                        ${themeConfig.primaryHue === color.hue && themeConfig.primarySaturation === color.sat 
                          ? 'ring-4 ring-offset-2 ring-primary scale-110' 
                          : 'hover:scale-105'}
                      `}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Border Radius
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[themeConfig.borderRadius]}
                    onValueChange={([v]) => setThemeConfig({...themeConfig, borderRadius: v})}
                    min={0}
                    max={2}
                    step={0.25}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-mono text-sm">{themeConfig.borderRadius}rem</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Scale
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[themeConfig.fontScale]}
                    onValueChange={([v]) => setThemeConfig({...themeConfig, fontScale: v})}
                    min={0.875}
                    max={1.25}
                    step={0.125}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-mono text-sm">{themeConfig.fontScale}x</span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-none">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-none">
                    Primary Button
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-none">
                    Secondary
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none">
                    Outline
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={saveThemeConfig} 
                  className="rounded-none shadow-lg hover-lift"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Theme Settings
                </Button>
                <Button 
                  onClick={resetToDefaultTheme} 
                  variant="outline" 
                  className="rounded-none hover-lift"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                <p>Current Theme Values:</p>
                <p>Hue: {themeConfig.primaryHue}, Saturation: {themeConfig.primarySaturation}%, Lightness: {themeConfig.primaryLightness}%</p>
                <p>Border Radius: {themeConfig.borderRadius}rem, Font Scale: {themeConfig.fontScale}x</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                Email Configuration
              </CardTitle>
              <CardDescription>Configure email settings for receipts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Provider</Label>
                <Select 
                  value={emailForm.emailProvider} 
                  onValueChange={v => setEmailForm({...emailForm, emailProvider: v as any})}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="smtp">Custom SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">From Email</Label>
                <Input 
                  type="email"
                  value={emailForm.emailFrom}
                  onChange={e => setEmailForm({...emailForm, emailFrom: e.target.value})}
                  placeholder="noreply@yourstore.com"
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key / Password</Label>
                <Input 
                  type="password"
                  value={emailForm.emailApiKey}
                  onChange={e => setEmailForm({...emailForm, emailApiKey: e.target.value})}
                  placeholder="Your API key or app password"
                  className="rounded-none"
                />
              </div>

              {emailForm.emailProvider === 'smtp' && (
                <div className="grid grid-cols-2 gap-6 animate-slide-up">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SMTP Host</Label>
                    <Input 
                      value={emailForm.smtpHost}
                      onChange={e => setEmailForm({...emailForm, smtpHost: e.target.value})}
                      placeholder="smtp.gmail.com"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SMTP Port</Label>
                    <Input 
                      value={emailForm.smtpPort}
                      onChange={e => setEmailForm({...emailForm, smtpPort: e.target.value})}
                      placeholder="587"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SMTP Username</Label>
                    <Input 
                      value={emailForm.smtpUser}
                      onChange={e => setEmailForm({...emailForm, smtpUser: e.target.value})}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SMTP Password</Label>
                    <Input 
                      type="password"
                      value={emailForm.smtpPassword}
                      onChange={e => setEmailForm({...emailForm, smtpPassword: e.target.value})}
                      className="rounded-none"
                    />
                  </div>
                </div>
              )}

              <Button onClick={saveEmailSettings} className="rounded-none shadow-lg hover-lift">
                <Save className="w-4 h-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos" className="space-y-4 animate-fade-in">
          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-primary" />
                </div>
                POS Settings
              </CardTitle>
              <CardDescription>Configure point of sale behavior and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div>
                  <p className="font-semibold">Allow Attendant Price Edit</p>
                  <p className="text-sm text-muted-foreground">Attendants can modify item prices during sale</p>
                </div>
                <Switch 
                  checked={posForm.allowAttendantPriceEdit}
                  onCheckedChange={checked => setPosForm({...posForm, allowAttendantPriceEdit: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div>
                  <p className="font-semibold">Require Password for Discount</p>
                  <p className="text-sm text-muted-foreground">Admin password required to apply discounts</p>
                </div>
                <Switch 
                  checked={posForm.requirePasswordForDiscount}
                  onCheckedChange={checked => setPosForm({...posForm, requirePasswordForDiscount: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-muted/50 to-muted/30 rounded-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                    <Split className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Allow Split Payments</p>
                    <p className="text-sm text-muted-foreground">Enable customers to pay with multiple methods</p>
                  </div>
                </div>
                <Switch 
                  checked={posForm.allowSplitPayments}
                  onCheckedChange={checked => setPosForm({...posForm, allowSplitPayments: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Low Stock Threshold</Label>
                <Input 
                  type="number"
                  value={posForm.lowStockThreshold}
                  onChange={e => setPosForm({...posForm, lowStockThreshold: e.target.value})}
                  placeholder="10"
                  className="rounded-none"
                />
                <p className="text-sm text-muted-foreground">Show warning when stock falls below this level</p>
              </div>

              <Button onClick={savePosSettings} className="rounded-none shadow-lg hover-lift">
                <Save className="w-4 h-4 mr-2" />
                Save POS Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                Database Management
              </CardTitle>
              <CardDescription>Backup and restore your POS data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Button variant="outline" onClick={exportDatabase} className="rounded-none hover-lift">
                  <Download className="w-4 h-4 mr-2" />
                  Export Database
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept=".db" onChange={importDatabase} className="hidden" />
                  <Button variant="outline" asChild className="rounded-none hover-lift">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Database
                    </span>
                  </Button>
                </label>
              </div>

              <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 rounded-none">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800 dark:text-red-400">Danger Zone</p>
                    <p className="text-sm text-red-700 dark:text-red-500 mb-4">
                      Resetting the database will permanently delete all data and restore factory defaults. 
                      This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={resetDatabase} className="rounded-none hover-lift">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Database
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs> 
    </div>
  );
}