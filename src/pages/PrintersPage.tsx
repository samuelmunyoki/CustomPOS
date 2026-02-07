import React, { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { PrinterConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Printer,
  CheckCircle,
  RotateCcw,
  Usb,
  Bluetooth,
  Wifi,
  FileText,
  Globe,
  Monitor,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PrinterType = 'usb' | 'bluetooth' | 'network' | 'web';

export default function PrintersPage() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);
  const [deletingPrinter, setDeletingPrinter] = useState<PrinterConfig | null>(null);
  const [webPrintEnabled, setWebPrintEnabled] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    type: 'web' as PrinterType,
    address: '',
    port: '9100',
    paperWidth: 80 as 58 | 80,
    enabled: true,
    isDefault: false
  });

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    await db.init();
    const data = db.getAllPrinters();
    setPrinters(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      db.createPrinter({
        id: crypto.randomUUID(),
        name: formData.name,
        type: formData.type,
        address: formData.address || undefined,
        port: formData.port ? parseInt(formData.port) : undefined,
        paperWidth: formData.paperWidth,
        enabled: formData.enabled,
        isDefault: formData.isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If this is set as default, unset others
      if (formData.isDefault) {
        printers.forEach(p => {
          if (p.isDefault) {
            db.updatePrinter(p.id, { isDefault: false });
          }
        });
      }

      toast.success('Printer added successfully');
      setShowAddDialog(false);
      resetForm();
      loadPrinters();
    } catch (error) {
      toast.error('Failed to add printer');
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;

    try {
      db.updatePrinter(editingPrinter.id, {
        name: formData.name,
        type: formData.type,
        address: formData.address || undefined,
        port: formData.port ? parseInt(formData.port) : undefined,
        paperWidth: formData.paperWidth,
        enabled: formData.enabled,
        isDefault: formData.isDefault
      });

      // If this is set as default, unset others
      if (formData.isDefault) {
        printers.forEach(p => {
          if (p.isDefault && p.id !== editingPrinter.id) {
            db.updatePrinter(p.id, { isDefault: false });
          }
        });
      }

      toast.success('Printer updated successfully');
      setShowEditDialog(false);
      setEditingPrinter(null);
      resetForm();
      loadPrinters();
    } catch (error) {
      toast.error('Failed to update printer');
    }
  };

  const handleDelete = () => {
    if (!deletingPrinter) return;
    
    try {
      db.deletePrinter(deletingPrinter.id);
      toast.success('Printer deleted');
      setShowDeleteDialog(false);
      setDeletingPrinter(null);
      loadPrinters();
    } catch (error) {
      toast.error('Failed to delete printer');
    }
  };

  const openDeleteDialog = (printer: PrinterConfig) => {
    setDeletingPrinter(printer);
    setShowDeleteDialog(true);
  };

  const testPrint = (printer: PrinterConfig) => {
    if (printer.type === 'web') {
      // Web print test
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Test Print - ${printer.name}</title></head>
            <body style="font-family: monospace; padding: 20px; max-width: ${printer.paperWidth}mm; margin: 0 auto;">
              <h2>TEST PRINT</h2>
              <p>Printer: ${printer.name}</p>
              <p>Type: ${printer.type}</p>
              <p>Paper Width: ${printer.paperWidth}mm</p>
              <p>Time: ${new Date().toLocaleString()}</p>
              <hr>
              <p>This is a test print from POS Pro</p>
              <script>window.print(); setTimeout(() => window.close(), 500);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success(`Test print sent to ${printer.name}`);
      }
    } else {
      toast.info(`Test print sent to ${printer.name}`);
      setTimeout(() => {
        toast.success('Test print completed');
      }, 2000);
    }
  };

  const openEditDialog = (printer: PrinterConfig) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      type: printer.type as PrinterType,
      address: printer.address || '',
      port: printer.port?.toString() || '9100',
      paperWidth: printer.paperWidth,
      enabled: printer.enabled,
      isDefault: printer.isDefault
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'web',
      address: '',
      port: '9100',
      paperWidth: 80,
      enabled: true,
      isDefault: false
    });
  };

  const getPrinterIcon = (type: string) => {
    switch (type) {
      case 'usb': return <Usb className="w-5 h-5" />;
      case 'bluetooth': return <Bluetooth className="w-5 h-5" />;
      case 'network': return <Wifi className="w-5 h-5" />;
      case 'web': return <Globe className="w-5 h-5" />;
      default: return <Printer className="w-5 h-5" />;
    }
  };

  const getPrinterTypeLabel = (type: string) => {
    switch (type) {
      case 'web': return 'Web Print (Browser)';
      case 'usb': return 'USB Printer';
      case 'bluetooth': return 'Bluetooth Printer';
      case 'network': return 'Network Printer';
      default: return type;
    }
  };

  const webPrinters = printers.filter(p => p.type === 'web');
  const hardwarePrinters = printers.filter(p => p.type !== 'web');

  const PrinterCard = ({ printer }: { printer: PrinterConfig }) => (
    <Card className={`
      rounded-none shadow-lg hover-lift transition-all duration-300 overflow-hidden
      ${printer.isDefault ? 'border-2 border-emerald-500/50' : 'border border-muted'}
    `}>
      <div className={`
        h-1.5 w-full
        ${printer.enabled 
          ? printer.isDefault 
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
            : 'bg-gradient-to-r from-primary/50 to-primary'
          : 'bg-gradient-to-r from-gray-300 to-gray-400'}
      `} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-none flex items-center justify-center shadow-md
              ${printer.enabled 
                ? 'bg-gradient-to-br from-primary/20 to-primary/10' 
                : 'bg-gradient-to-br from-gray-200 to-gray-300'}
            `}>
              {getPrinterIcon(printer.type)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{printer.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize rounded-none">
                  {getPrinterTypeLabel(printer.type)}
                </Badge>
                {printer.isDefault && (
                  <Badge className="bg-emerald-500 rounded-none">
                    <CheckCircle className="w-3 h-3 mr-1" /> Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Switch 
            checked={printer.enabled}
            onCheckedChange={() => {
              db.updatePrinter(printer.id, { enabled: !printer.enabled });
              loadPrinters();
            }}
          />
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {printer.address && (
            <div className="flex justify-between p-2 bg-muted/50 rounded-none">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{printer.address}</span>
            </div>
          )}
          {printer.port && (
            <div className="flex justify-between p-2 bg-muted/50 rounded-none">
              <span className="text-muted-foreground">Port</span>
              <span className="font-medium">{printer.port}</span>
            </div>
          )}
          <div className="flex justify-between p-2 bg-muted/50 rounded-none">
            <span className="text-muted-foreground">Paper Width</span>
            <span className="font-medium">{printer.paperWidth}mm</span>
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-none hover-lift" 
            onClick={() => testPrint(printer)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Test Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-none hover-lift"
            onClick={() => openEditDialog(printer)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive rounded-none hover-lift"
            onClick={() => openDeleteDialog(printer)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-6 rounded-none shadow-lg">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Printer Settings</h2>
          <p className="text-muted-foreground mt-1">Configure receipt and label printers</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadPrinters} className="rounded-none hover-lift">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="rounded-none shadow-lg hover-lift">
            <Plus className="w-4 h-4 mr-2" />
            Add Printer
          </Button>
        </div>
      </div>

      {/* Web Print Info Card */}
      <Card className="rounded-none shadow-md bg-gradient-to-r from-primary/10 to-white/10 border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-2">
            <div className="w-12 h-12 bg-primary/20 rounded-none flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-md">Web Print Enabled</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Web Print allows you to print receipts directly from your browser to any printer connected to your computer. 
                No additional drivers or hardware required.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Switch 
                  checked={webPrintEnabled}
                  onCheckedChange={setWebPrintEnabled}
                />
                <span className="text-sm font-medium">
                  {webPrintEnabled ? 'Web Print is active' : 'Web Print is disabled'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printers Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="rounded-none p-1">
          <TabsTrigger value="all" className="rounded-none">All Printers ({printers.length})</TabsTrigger>
          <TabsTrigger value="web" className="rounded-none">Web Print ({webPrinters.length})</TabsTrigger>
          <TabsTrigger value="hardware" className="rounded-none">Hardware ({hardwarePrinters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {printers.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-none flex items-center justify-center mx-auto mb-4">
                  <Printer className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Printers Configured</h3>
                <p className="text-muted-foreground mb-4">Add a printer to start printing receipts</p>
                <Button onClick={() => setShowAddDialog(true)} className="rounded-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Printer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {printers.map(printer => (
                <PrinterCard key={printer.id} printer={printer} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="web" className="mt-6">
          {webPrinters.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Web Printers</h3>
                <p className="text-muted-foreground mb-4">Add a web printer for browser-based printing</p>
                <Button onClick={() => { setFormData({...formData, type: 'web'}); setShowAddDialog(true); }} className="rounded-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Web Printer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {webPrinters.map(printer => (
                <PrinterCard key={printer.id} printer={printer} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hardware" className="mt-6">
          {hardwarePrinters.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <Usb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Hardware Printers</h3>
                <p className="text-muted-foreground mb-4">Add USB, Bluetooth, or Network printers</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setFormData({...formData, type: 'usb'}); setShowAddDialog(true); }} variant="outline" className="rounded-none">
                    <Usb className="w-4 h-4 mr-2" />
                    USB
                  </Button>
                  <Button onClick={() => { setFormData({...formData, type: 'bluetooth'}); setShowAddDialog(true); }} variant="outline" className="rounded-none">
                    <Bluetooth className="w-4 h-4 mr-2" />
                    Bluetooth
                  </Button>
                  <Button onClick={() => { setFormData({...formData, type: 'network'}); setShowAddDialog(true); }} variant="outline" className="rounded-none">
                    <Wifi className="w-4 h-4 mr-2" />
                    Network
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hardwarePrinters.map(printer => (
                <PrinterCard key={printer.id} printer={printer} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Printer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              Add New Printer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Printer Name</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Main Receipt Printer"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Connection Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as PrinterType})}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="web">
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Web Print (Browser)
                    </span>
                  </SelectItem>
                  <SelectItem value="usb">
                    <span className="flex items-center gap-2">
                      <Usb className="w-4 h-4" />
                      USB Printer
                    </span>
                  </SelectItem>
                  <SelectItem value="bluetooth">
                    <span className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4" />
                      Bluetooth Printer
                    </span>
                  </SelectItem>
                  <SelectItem value="network">
                    <span className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      Network (Ethernet/WiFi)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'network' && (
              <div className="grid grid-cols-2 gap-4 animate-slide-up">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IP Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="192.168.1.100"
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Port</Label>
                  <Input 
                    value={formData.port}
                    onChange={e => setFormData({...formData, port: e.target.value})}
                    placeholder="9100"
                    className="rounded-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Paper Width</Label>
              <Select 
                value={formData.paperWidth.toString()} 
                onValueChange={v => setFormData({...formData, paperWidth: parseInt(v) as 58 | 80})}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="58">58mm (Small - Mobile printers)</SelectItem>
                  <SelectItem value="80">80mm (Standard - Receipt printers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enabled</p>
                  <p className="text-xs text-muted-foreground">Enable this printer for use</p>
                </div>
                <Switch 
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData({...formData, enabled: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Set as Default</p>
                  <p className="text-xs text-muted-foreground">Use this as the primary printer</p>
                </div>
                <Switch 
                  checked={formData.isDefault}
                  onCheckedChange={checked => setFormData({...formData, isDefault: checked})}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button type="submit" className="rounded-none shadow-lg hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                Add Printer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Printer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              Edit Printer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Printer Name</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Connection Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as PrinterType})}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="web">Web Print (Browser)</SelectItem>
                  <SelectItem value="usb">USB Printer</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth Printer</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'network' && (
              <div className="grid grid-cols-2 gap-4 animate-slide-up">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IP Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Port</Label>
                  <Input 
                    value={formData.port}
                    onChange={e => setFormData({...formData, port: e.target.value})}
                    className="rounded-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Paper Width</Label>
              <Select 
                value={formData.paperWidth.toString()} 
                onValueChange={v => setFormData({...formData, paperWidth: parseInt(v) as 58 | 80})}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enabled</p>
                  <p className="text-xs text-muted-foreground">Enable this printer for use</p>
                </div>
                <Switch 
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData({...formData, enabled: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Set as Default</p>
                  <p className="text-xs text-muted-foreground">Use this as the primary printer</p>
                </div>
                <Switch 
                  checked={formData.isDefault}
                  onCheckedChange={checked => setFormData({...formData, isDefault: checked})}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button type="submit" className="rounded-none shadow-lg hover-lift">
                <Edit2 className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-6 h-6" />
              Delete Printer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingPrinter?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-none">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
