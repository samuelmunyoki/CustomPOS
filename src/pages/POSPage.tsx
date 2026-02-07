import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { db } from '@/lib/database';
import type { Product, SaleItem, Sale, Discount, SplitPayment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Percent,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  Pause,
  X,
  Edit3,
  Keyboard,
  Tag,
  TrendingDown,
  Check,
  AlertTriangle,
  Split,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function POSPage() {
  const { user, hasPermission } = useAuth();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>(settings?.defaultSaleType || 'retail');
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<Discount | null>(null);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');

  // Split payment state
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [showSplitPayment, setShowSplitPayment] = useState(false);

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [saleDiscount, setSaleDiscount] = useState<{ type: 'percentage' | 'fixed'; value: number } | null>(null);

  // Price edit state
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  // Keyboard shortcuts dialog
  const [showShortcuts, setShowShortcuts] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadDiscounts();
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        toast.info('Search focused');
      }
      else if (e.key === 'F2') {
        e.preventDefault();
        holdSale();
      }
      else if (e.key === 'F3') {
        e.preventDefault();
        toggleSaleType();
      }
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setShowDiscount(true);
      }
      else if (e.key === 'F5') {
        e.preventDefault();
        clearCart();
      }
      else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentMethod('mpesa');
          setShowPayment(true);
        }
      }
      else if (e.key === 'F7') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentMethod('cash');
          setShowPayment(true);
        }
      }
      else if (e.key === 'F8') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      else if (e.key === 'Escape') {
        if (showPayment) setShowPayment(false);
        if (showDiscount) setShowDiscount(false);
        if (showSplitPayment) setShowSplitPayment(false);
        if (editingItem) setEditingItem(null);
      }
      else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (cart.length > 0) setShowPayment(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPayment, showDiscount, showSplitPayment, editingItem]);

  const loadProducts = async () => {
    await db.init();
    const data = db.getAllProducts();
    setProducts(data);
  };

  const loadCategories = async () => {
    await db.init();
    const data = db.getAllCategories();
    setCategories([{ id: 'all', name: 'All Products' }, ...data.map(c => ({ id: c.id, name: c.name }))]);
  };

  const loadDiscounts = async () => {
    await db.init();
    const data = db.getAllDiscounts();
    const activeDiscounts = data.filter(d => {
      if (!d.active) return false;
      const now = new Date().toISOString();
      if (d.startDate && now < d.startDate) return false;
      if (d.endDate && now > d.endDate) return false;
      return true;
    });
    setAvailableDiscounts(activeDiscounts);
  };

  const toggleSaleType = () => {
    const newType = saleType === 'retail' ? 'wholesale' : 'retail';
    setSaleType(newType);
    toast.info(`Switched to ${newType} pricing`);

    setCart(cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newPrice = newType === 'wholesale' && product.wholesalePrice
          ? product.wholesalePrice
          : product.price;
        const subtotal = newPrice * item.quantity;
        const taxAmount = settings?.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
        return {
          ...item,
          price: newPrice,
          taxAmount,
          total: subtotal + taxAmount
        };
      }
      return item;
    }));
  };

  const getProductPrice = (product: Product) => {
    if (saleType === 'wholesale' && product.wholesalePrice) {
      return product.wholesalePrice;
    }
    return product.price;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && p.quantity > 0;
  });

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    const price = getProductPrice(product);

    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error('Not enough stock available');
        return;
      }
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        originalPrice: product.price,
        price: price,
        discountAmount: 0,
        discountPercent: 0,
        taxAmount: settings?.taxEnabled ? price * (settings.taxRate / 100) : 0,
        total: price + (settings?.taxEnabled ? price * (settings.taxRate / 100) : 0),
        editedByAttendant: false
      };
      setCart([...cart, newItem]);
    }
    toast.success(`Added ${product.name} to cart`);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    const product = products.find(p => p.id === item.productId);
    if (product && newQuantity > product.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    setCart(cart.map(item => {
      if (item.id === itemId) {
        const subtotal = item.price * newQuantity;
        const taxAmount = settings?.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
        return {
          ...item,
          quantity: newQuantity,
          taxAmount,
          total: subtotal + taxAmount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSaleDiscount(null);
    setActiveDiscount(null);
    setCashReceived('');
    setMpesaPhone('');
    setSplitPayments([]);
    toast.info('Cart cleared');
  };

  const handlePriceEdit = (item: SaleItem) => {
    if (!hasPermission('edit_prices')) {
      toast.error('You do not have permission to edit prices');
      return;
    }
    setEditingItem(item);
    setNewPrice(item.price.toString());
  };

  const savePriceEdit = () => {
    if (!editingItem || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price');
      return;
    }

    setCart(cart.map(item => {
      if (item.id === editingItem.id) {
        const subtotal = price * item.quantity;
        const taxAmount = settings?.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
        return {
          ...item,
          price,
          editedByAttendant: true,
          originalPriceBeforeEdit: item.originalPriceBeforeEdit || item.originalPrice,
          taxAmount,
          total: subtotal + taxAmount
        };
      }
      return item;
    }));

    toast.success('Price updated');
    setEditingItem(null);
    setNewPrice('');
  };

  const applyItemDiscount = (itemId: string, percent: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = item.price * (percent / 100);
        const discountedPrice = item.price - discountAmount;
        const subtotal = discountedPrice * item.quantity;
        const taxAmount = settings?.taxEnabled ? subtotal * (settings.taxRate / 100) : 0;
        return {
          ...item,
          discountPercent: percent,
          discountAmount: discountAmount * item.quantity,
          taxAmount,
          total: subtotal + taxAmount
        };
      }
      return item;
    }));
    toast.success(`Discount applied`);
  };

  const applySaleDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Invalid discount value');
      return;
    }
    setSaleDiscount({ type: discountType, value });
    setShowDiscount(false);
    setDiscountValue('');
    toast.success('Sale discount applied');
  };

  const removeSaleDiscount = () => {
    setSaleDiscount(null);
    toast.success('Discount removed');
  };

  const applyPresetDiscount = (discount: Discount) => {
    setActiveDiscount(discount);
    setSaleDiscount({ type: discount.type, value: discount.value });
    toast.success(`Applied: ${discount.name}`);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    let saleDiscountAmount = 0;

    if (saleDiscount) {
      if (saleDiscount.type === 'percentage') {
        saleDiscountAmount = (subtotal - itemDiscounts) * (saleDiscount.value / 100);
      } else {
        saleDiscountAmount = saleDiscount.value;
      }
    }

    const totalDiscount = itemDiscounts + saleDiscountAmount;
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = settings?.taxEnabled ? taxableAmount * (settings.taxRate / 100) : 0;
    const total = taxableAmount + taxAmount;

    return { subtotal, totalDiscount, taxAmount, total };
  };

  const holdSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await db.init();
      const { subtotal, totalDiscount, taxAmount, total } = calculateTotals();

      const sale: Sale = {
        id: crypto.randomUUID(),
        receiptNumber: `HLD-${Date.now()}`,
        items: cart,
        subtotal,
        discountAmount: totalDiscount,
        discountPercent: saleDiscount?.value || 0,
        taxAmount,
        total,
        paymentMethod: 'cash',
        status: 'held',
        heldAt: new Date().toISOString(),
        saleType,
        createdBy: user!.id,
        createdByName: user!.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.createSale(sale);
      toast.success('Sale held successfully');
      clearCart();
    } catch (error) {
      toast.error('Failed to hold sale');
    }
  };

  // Split payment functions
  const addSplitPayment = () => {
    if (splitPayments.length >= 3) {
      toast.error('Maximum 3 payment methods allowed');
      return;
    }
    const { total } = calculateTotals();
    const remaining = total - splitPayments.reduce((sum, p) => sum + p.amount, 0);

    setSplitPayments([...splitPayments, {
      id: crypto.randomUUID(),
      method: 'cash',
      amount: Math.max(0, remaining)
    }]);
  };

  const removeSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter(p => p.id !== id));
  };

  const updateSplitPayment = (id: string, updates: Partial<SplitPayment>) => {
    setSplitPayments(splitPayments.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const getSplitRemaining = () => {
    const { total } = calculateTotals();
    const paid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    return total - paid;
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const { total } = calculateTotals();

    // Handle split payment
    if (showSplitPayment) {
      const remaining = getSplitRemaining();
      if (Math.abs(remaining) > 0.01) {
        toast.error(`Payment incomplete. Remaining: ${settings?.currencySymbol}${Math.abs(remaining).toFixed(2)}`);
        return;
      }

      try {
        await db.init();
        const { subtotal, totalDiscount, taxAmount } = calculateTotals();

        const sale: Sale = {
          id: crypto.randomUUID(),
          receiptNumber: `RCP-${Date.now()}`,
          items: cart,
          subtotal,
          discountAmount: totalDiscount,
          discountPercent: saleDiscount?.value || 0,
          taxAmount,
          total,
          paymentMethod: 'cash',
          splitPayments,
          status: 'completed',
          completedAt: new Date().toISOString(),
          saleType,
          createdBy: user!.id,
          createdByName: user!.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        for (const item of cart) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            db.updateProduct(product.id, { quantity: product.quantity - item.quantity });
          }
        }

        db.createSale(sale);
        toast.success('Split payment completed successfully');
        clearCart();
        setShowPayment(false);
        setShowSplitPayment(false);
        loadProducts();
      } catch (error) {
        toast.error('Failed to process sale');
      }
      return;
    }

    // Handle single payment
    const mpesaPhoneNumber = mpesaPhone || undefined;

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < total) {
        toast.error('Insufficient amount received');
        return;
      }
    } else if (paymentMethod === 'mpesa') {
      if (!mpesaPhone || mpesaPhone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      toast.info('MPesa integration requires configuration in Settings');
      return;
    }

    try {
      await db.init();
      const { subtotal, totalDiscount, taxAmount } = calculateTotals();

      const received = paymentMethod === 'cash' ? parseFloat(cashReceived) : total;
      const change = paymentMethod === 'cash' ? received - total : 0;

      const sale: Sale = {
        id: crypto.randomUUID(),
        receiptNumber: `RCP-${Date.now()}`,
        items: cart,
        subtotal,
        discountAmount: totalDiscount,
        discountPercent: saleDiscount?.value || 0,
        taxAmount,
        total,
        paymentMethod,
        cashReceived: received,
        change,
        mpesaPhoneNumber,
        status: 'completed',
        completedAt: new Date().toISOString(),
        saleType,
        createdBy: user!.id,
        createdByName: user!.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          db.updateProduct(product.id, { quantity: product.quantity - item.quantity });
        }
      }

      db.createSale(sale);

      const printer = db.getDefaultPrinter();
      if (printer) {
        toast.info('Printing receipt...');
      }

      toast.success(`Sale completed! Change: ${settings?.currencySymbol}${change.toFixed(2)}`);
      clearCart();
      setShowPayment(false);
      loadProducts();
    } catch (error) {
      toast.error('Failed to process sale');
    }
  };

  const { subtotal, totalDiscount, taxAmount, total } = calculateTotals();

  return (
    <div className="h-full flex gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header with Sale Type Toggle */}
        <div className="flex items-center justify-between bg-card p-4 rounded-none shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Sale Type:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaleType('retail')
                  toast.info('Switched to retail pricing')
                }}
                className={cn(
                  'rounded-none',
                  saleType === 'retail' &&
                  'bg-primary text-white hover:bg-primary border-primary shadow-lg'
                )}
              >
                <Tag className="w-4 h-4 mr-2" />
                Retail
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaleType('wholesale')
                  toast.info('Switched to wholesale pricing')
                }}
                className={cn(
                  'rounded-none',
                  saleType === 'wholesale' &&
                  'bg-primary text-white hover:bg-primary border-primary shadow-lg'
                )}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Wholesale
              </Button>

            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            className="rounded-none"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Shortcuts
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              placeholder="Search products by name, SKU, or scan barcode... (F1 to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-none!"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length === 1) {
                  addToCart(filteredProducts[0]);
                  setSearchQuery('');
                }
              }}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto px-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                onClick={() => addToCart(product)}
                className="cursor-pointer transition-all hover:border-primary-500 rounded-none overflow-hidden bg-primary-100/10"
              >
                <CardContent className="p-2 space-y-0.5">
                  <div className="h-20 bg-gradient-to-br from-muted to-muted/50 rounded-none flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <h4 className="font-medium text-sm truncate leading-tight">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-primary text-primary text-sm">
                      {settings?.currencySymbol}
                      {getProductPrice(product).toFixed(2)}
                    </span>
                  </div>

                  {product.wholesalePrice && (
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {product.quantity} left
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col rounded-none shadow-lg overflow-hidden">
          <CardHeader className="pb-3 bg-primary marker:from-card to-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Cart ({cart.length})
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="rounded-none text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 pt-0">
            <ScrollArea className="flex-1 -mx-4 px-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Click products to add</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-muted/50 p-3 rounded-none">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {settings?.currencySymbol}{item.price.toFixed(2)} each
                            {item.editedByAttendant && (
                              <span className="ml-1 text-amber-500">(edited)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePriceEdit(item)}
                            className="p-1 hover:bg-accent rounded-none"
                            title="Edit price"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-destructive/10 text-destructive rounded-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-background border rounded-none hover:bg-accent transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-background border rounded-none hover:bg-accent transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={item.discountPercent.toString()}
                            onValueChange={(v) => applyItemDiscount(item.id, parseInt(v))}
                          >
                            <SelectTrigger className="w-20 h-7 text-xs rounded-none">
                              <Percent className="w-3 h-3 mr-1" />
                              <SelectValue placeholder="0%" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="15">15%</SelectItem>
                              <SelectItem value="20">20%</SelectItem>
                              <SelectItem value="25">25%</SelectItem>
                              <SelectItem value="50">50%</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="font-bold text-primary">{settings?.currencySymbol}{item.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <>
                <Separator className="my-4" />

                {/* Available Discounts */}
                {availableDiscounts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Quick Discounts:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableDiscounts.slice(0, 3).map(discount => (
                        <button
                          key={discount.id}
                          onClick={() => applyPresetDiscount(discount)}
                          className={`
                            px-3 py-1.5 text-xs rounded-none transition-colors
                            ${activeDiscount?.id === discount.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'}
                          `}
                        >
                          {discount.name}
                          {discount.type === 'percentage' ? ` (${discount.value}%)` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{settings?.currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{settings?.currencySymbol}{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {settings?.taxEnabled && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{settings.taxName} ({settings.taxRate}%)</span>
                      <span>{settings?.currencySymbol}{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{settings?.currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-none hover-lift"
                    onClick={() => setShowDiscount(true)}
                  >
                    <Percent className="w-4 h-4 mr-1" />
                    Discount
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-none hover-lift"
                    onClick={holdSale}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Hold
                  </Button>
                </div>

                <Button
                  className="w-full mt-2 rounded-none shadow-lg hover-lift"
                  size="lg"
                  onClick={() => setShowPayment(true)}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pay {settings?.currencySymbol}{total.toFixed(2)}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="w-6 h-6 text-primary" />
              Process Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center py-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-none">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-3xl font-bold text-primary">{settings?.currencySymbol}{total.toFixed(2)}</p>
            </div>

            {/* Split Payment Toggle */}
            {settings?.allowSplitPayments && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Split Payment</span>
                </div>
                <Button
                  variant={showSplitPayment ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setShowSplitPayment(!showSplitPayment);
                    if (!showSplitPayment) {
                      setSplitPayments([{ id: crypto.randomUUID(), method: 'cash', amount: total }]);
                    } else {
                      setSplitPayments([]);
                    }
                  }}
                  className="rounded-none"
                >
                  {showSplitPayment ? 'Disable' : 'Enable'}
                </Button>
              </div>
            )}

            {showSplitPayment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Split Payments</span>
                  <Button size="sm" variant="outline" onClick={addSplitPayment} className="rounded-none">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {splitPayments.map((payment, index) => (
                  <div key={payment.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-none">
                    <Select
                      value={payment.method}
                      onValueChange={(v: any) => updateSplitPayment(payment.id, { method: v })}
                    >
                      <SelectTrigger className="w-28 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">MPesa</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updateSplitPayment(payment.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 rounded-none"
                      placeholder="Amount"
                    />
                    {splitPayments.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removeSplitPayment(payment.id)} className="rounded-none">
                        <MinusCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="p-3 bg-muted/30 rounded-none">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span className="font-medium">{settings?.currencySymbol}{splitPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className={`font-bold ${getSplitRemaining() > 0 ? 'text-amber-600' : getSplitRemaining() < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {settings?.currencySymbol}{Math.abs(getSplitRemaining()).toFixed(2)}
                      {getSplitRemaining() < 0 && ' (Overpaid)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <TabsList className="grid w-full grid-cols-3 rounded-none">
                  <TabsTrigger value="cash" className="rounded-none">
                    <Banknote className="w-4 h-4 mr-1" />
                    Cash
                  </TabsTrigger>
                  <TabsTrigger value="mpesa" className="rounded-none">
                    <Smartphone className="w-4 h-4 mr-1" />
                    MPesa
                  </TabsTrigger>
                  <TabsTrigger value="card" className="rounded-none">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Card
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cash" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cash Received</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      autoFocus
                      className="rounded-none text-lg"
                    />
                  </div>
                  {cashReceived && parseFloat(cashReceived) >= total && (
                    <div className="p-4 bg-emerald-500/10 rounded-none">
                      <p className="text-lg font-bold text-emerald-600 text-center">
                        Change: {settings?.currencySymbol}{(parseFloat(cashReceived) - total).toFixed(2)}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="mpesa" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="2547XX XXX XXX"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer will receive an STK push notification
                  </p>
                </TabsContent>

                <TabsContent value="card" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Card payment requires terminal integration
                  </p>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayment(false)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={processPayment} className="rounded-none shadow-lg hover-lift">
              <Check className="w-4 h-4 mr-2" />
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              Apply Discount
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {saleDiscount && (
              <div className="p-3 bg-emerald-500/10 rounded-none flex items-center justify-between">
                <span className="text-sm text-emerald-600">
                  Current: {saleDiscount.type === 'percentage' ? `${saleDiscount.value}%` : `${settings?.currencySymbol}${saleDiscount.value}`}
                </span>
                <Button variant="ghost" size="sm" onClick={removeSaleDiscount} className="text-destructive">
                  Remove
                </Button>
              </div>
            )}

            <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="percentage" className="rounded-none">Percentage</TabsTrigger>
                <TabsTrigger value="fixed" className="rounded-none">Fixed Amount</TabsTrigger>
              </TabsList>

              <TabsContent value="percentage" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Discount Percentage</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="rounded-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="fixed" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Discount Amount ({settings?.currencySymbol})</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="rounded-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDiscount(false)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={applySaleDiscount} className="rounded-none shadow-lg hover-lift">
              <Percent className="w-4 h-4 mr-2" />
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Price
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Editing price for: <strong>{editingItem?.productName}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Original price: {settings?.currencySymbol}{editingItem?.originalPrice.toFixed(2)}
            </p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Price ({settings?.currencySymbol})</Label>
              <Input
                type="number"
                placeholder="Enter new price"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                autoFocus
                className="rounded-none"
              />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-none flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This edit will be logged and visible to administrators
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={savePriceEdit} className="rounded-none shadow-lg hover-lift">
              <Check className="w-4 h-4 mr-2" />
              Save Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { key: 'F1', action: 'Focus Search' },
              { key: 'F2', action: 'Hold Sale' },
              { key: 'F3', action: 'Toggle Retail/Wholesale' },
              { key: 'F4', action: 'Apply Discount' },
              { key: 'F5', action: 'Clear Cart' },
              { key: 'F6', action: 'MPesa Payment' },
              { key: 'F7', action: 'Cash Payment' },
              { key: 'F8', action: 'Show Shortcuts' },
              { key: 'Ctrl+P', action: 'Process Payment' },
              { key: 'Esc', action: 'Close/Cancel' },
              { key: 'Enter', action: 'Confirm' },
            ].map((shortcut, index) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-none animate-fade-in"
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
    </div>
  );
}
