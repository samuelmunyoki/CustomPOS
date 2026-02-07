import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import type { Discount } from '@/types';
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
  ShoppingCart,
  Package,
  RotateCcw,
  Percent,
  Calendar,
  UserCheck,
  UserX,
  Tag,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DiscountsPage() {
  const { settings } = useSettings();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    scope: 'sale' as 'item' | 'sale',
    minPurchase: '',
    maxDiscount: '',
    active: true,
    allowAttendantToggle: true,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    await db.init();
    const data = db.getAllDiscounts();
    setDiscounts(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newDiscount: Discount = {
        id: crypto.randomUUID(),
        name: formData.name,
        code: formData.code || undefined,
        type: formData.type,
        value: parseFloat(formData.value),
        scope: formData.scope,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        active: formData.active,
        allowAttendantToggle: formData.allowAttendantToggle,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.createDiscount(newDiscount);
      toast.success('Discount created successfully');
      setShowAddDialog(false);
      resetForm();
      loadDiscounts();
    } catch (error) {
      toast.error('Failed to create discount');
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscount) return;

    try {
      db.updateDiscount(editingDiscount.id, {
        name: formData.name,
        code: formData.code || undefined,
        type: formData.type,
        value: parseFloat(formData.value),
        scope: formData.scope,
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        active: formData.active,
        allowAttendantToggle: formData.allowAttendantToggle,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      });
      toast.success('Discount updated successfully');
      setShowEditDialog(false);
      setEditingDiscount(null);
      resetForm();
      loadDiscounts();
    } catch (error) {
      toast.error('Failed to update discount');
    }
  };

  const handleDelete = () => {
    if (!deletingDiscount) return;
    
    try {
      db.deleteDiscount(deletingDiscount.id);
      toast.success('Discount deleted');
      setShowDeleteDialog(false);
      setDeletingDiscount(null);
      loadDiscounts();
    } catch (error) {
      toast.error('Failed to delete discount');
    }
  };

  const openDeleteDialog = (discount: Discount) => {
    setDeletingDiscount(discount);
    setShowDeleteDialog(true);
  };

  const toggleActive = (discount: Discount) => {
    try {
      db.updateDiscount(discount.id, { active: !discount.active });
      toast.success(`Discount ${discount.active ? 'deactivated' : 'activated'}`);
      loadDiscounts();
    } catch (error) {
      toast.error('Failed to update discount');
    }
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      code: discount.code || '',
      type: discount.type,
      value: discount.value.toString(),
      scope: discount.scope,
      minPurchase: discount.minPurchase?.toString() || '',
      maxDiscount: discount.maxDiscount?.toString() || '',
      active: discount.active,
      allowAttendantToggle: discount.allowAttendantToggle ?? true,
      startDate: discount.startDate?.split('T')[0] || '',
      endDate: discount.endDate?.split('T')[0] || ''
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'percentage',
      value: '',
      scope: 'sale',
      minPurchase: '',
      maxDiscount: '',
      active: true,
      allowAttendantToggle: true,
      startDate: '',
      endDate: ''
    });
  };

  const isDiscountActive = (discount: Discount) => {
    if (!discount.active) return false;
    const now = new Date().toISOString();
    if (discount.startDate && now < discount.startDate) return false;
    if (discount.endDate && now > discount.endDate) return false;
    return true;
  };

  const activeDiscounts = discounts.filter(d => isDiscountActive(d));
  const inactiveDiscounts = discounts.filter(d => !isDiscountActive(d));

  const DiscountCard = ({ discount }: { discount: Discount }) => (
    <Card className={`
      rounded-none shadow-lg hover-lift transition-all duration-300 overflow-hidden
      ${isDiscountActive(discount) ? 'border-2 border-emerald-500/50' : 'border border-muted'}
    `}>
      <div className={`
        h-1.5 w-full
        ${isDiscountActive(discount) 
          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
          : 'bg-gradient-to-r from-gray-300 to-gray-400'}
      `} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-none flex items-center justify-center shadow-md
              ${discount.scope === 'sale' 
                ? 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30' 
                : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30'}
            `}>
              {discount.scope === 'sale' 
                ? <ShoppingCart className="w-6 h-6 text-primary-600" /> 
                : <Package className="w-6 h-6 text-blue-600" />
              }
            </div>
            <div>
              <h3 className="font-bold text-lg">{discount.name}</h3>
              {discount.code && (
                <Badge variant="outline" className="mt-1 font-mono rounded-none bg-muted/50">
                  <Tag className="w-3 h-3 mr-1" />
                  {discount.code}
                </Badge>
              )}
            </div>
          </div>
          <Switch 
            checked={discount.active}
            onCheckedChange={() => toggleActive(discount)}
          />
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Discount Value
            </span>
            <span className="font-bold text-xl text-primary">
              {discount.type === 'percentage' ? `${discount.value}%` : `${settings?.currencySymbol}${discount.value}`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Applies to</span>
            <Badge 
              variant="secondary" 
              className="capitalize rounded-full px-3"
            >
              {discount.scope === 'sale' ? 'Whole Sale' : 'Individual Items'}
            </Badge>
          </div>

          {discount.minPurchase && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Min. Purchase</span>
              <span className="font-medium">{settings?.currencySymbol}{discount.minPurchase}</span>
            </div>
          )}

          {discount.maxDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Discount</span>
              <span className="font-medium">{settings?.currencySymbol}{discount.maxDiscount}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Attendant Control
            </span>
            <Badge 
              variant={discount.allowAttendantToggle ? 'default' : 'secondary'}
              className="rounded-full text-xs"
            >
              {discount.allowAttendantToggle ? 'Can Toggle' : 'Fixed'}
            </Badge>
          </div>
          
          {(discount.startDate || discount.endDate) && (
            <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded-none">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">
                {discount.startDate && new Date(discount.startDate) > new Date() 
                  ? `Starts ${new Date(discount.startDate).toLocaleDateString()}`
                  : discount.endDate 
                    ? `Ends ${new Date(discount.endDate).toLocaleDateString()}`
                    : 'Ongoing'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-none hover-lift" 
            onClick={() => openEditDialog(discount)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive rounded-none hover-lift" 
            onClick={() => openDeleteDialog(discount)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-none shadow-lg hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Discounts</p>
                <p className="text-3xl font-bold text-emerald-600">{activeDiscounts.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-none flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 rounded-none shadow-lg hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Inactive</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveDiscounts.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-500/20 rounded-none flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-none shadow-lg hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Discounts</p>
                <p className="text-3xl font-bold text-primary">{discounts.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-none flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-none shadow-md">
        <div>
          <h2 className="text-2xl font-bold">Discounts</h2>
          <p className="text-muted-foreground">Manage sales discounts and promotions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadDiscounts} className="rounded-none hover-lift">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="rounded-none shadow-lg hover-lift">
            <Plus className="w-4 h-4 mr-2" />
            Add Discount
          </Button>
        </div>
      </div>

      {/* Discounts Grid */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="rounded-none p-1">
          <TabsTrigger value="active" className="rounded-none">Active ({activeDiscounts.length})</TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-none">Inactive ({inactiveDiscounts.length})</TabsTrigger>
          <TabsTrigger value="all" className="rounded-none">All ({discounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeDiscounts.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Active Discounts</h3>
                <p className="text-muted-foreground mb-4">Create a discount to start offering promotions</p>
                <Button onClick={() => setShowAddDialog(true)} className="rounded-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeDiscounts.map(discount => (
                <DiscountCard key={discount.id} discount={discount} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          {inactiveDiscounts.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Inactive Discounts</h3>
                <p className="text-muted-foreground">All your discounts are currently active</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveDiscounts.map(discount => (
                <DiscountCard key={discount.id} discount={discount} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {discounts.length === 0 ? (
            <Card className="rounded-none">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Discounts Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first discount to get started</p>
                <Button onClick={() => setShowAddDialog(true)} className="rounded-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discounts.map(discount => (
                <DiscountCard key={discount.id} discount={discount} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Discount Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              Add New Discount
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Summer Sale"
                  className="rounded-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Code (optional)</Label>
                <Input 
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  placeholder="SUMMER20"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Value</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  placeholder={formData.type === 'percentage' ? '20' : '50'}
                  className="rounded-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Applies To</Label>
              <Select value={formData.scope} onValueChange={v => setFormData({...formData, scope: v as any})}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="item">Individual Items</SelectItem>
                  <SelectItem value="sale">Whole Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min. Purchase (optional)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.minPurchase}
                  onChange={e => setFormData({...formData, minPurchase: e.target.value})}
                  placeholder="100"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Discount (optional)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={e => setFormData({...formData, maxDiscount: e.target.value})}
                  placeholder="500"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date (optional)</Label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date (optional)</Label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Enable this discount immediately</p>
                </div>
                <Switch 
                  checked={formData.active}
                  onCheckedChange={checked => setFormData({...formData, active: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Allow Attendant Toggle</p>
                  <p className="text-xs text-muted-foreground">Attendants can enable/disable this discount</p>
                </div>
                <Switch 
                  checked={formData.allowAttendantToggle}
                  onCheckedChange={checked => setFormData({...formData, allowAttendantToggle: checked})}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button type="submit" className="rounded-none shadow-lg hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                Add Discount
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Discount Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              Edit Discount
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="rounded-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Code (optional)</Label>
                <Input 
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Value</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  className="rounded-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Applies To</Label>
              <Select value={formData.scope} onValueChange={v => setFormData({...formData, scope: v as any})}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="item">Individual Items</SelectItem>
                  <SelectItem value="sale">Whole Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Enable this discount</p>
                </div>
                <Switch 
                  checked={formData.active}
                  onCheckedChange={checked => setFormData({...formData, active: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Allow Attendant Toggle</p>
                  <p className="text-xs text-muted-foreground">Attendants can enable/disable this discount</p>
                </div>
                <Switch 
                  checked={formData.allowAttendantToggle}
                  onCheckedChange={checked => setFormData({...formData, allowAttendantToggle: checked})}
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
              Delete Discount
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingDiscount?.name}</strong>? This action cannot be undone.
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
