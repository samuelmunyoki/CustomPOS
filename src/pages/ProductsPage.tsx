import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import type { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Filter,
  Package,
  TrendingUp,
  Barcode,
  Tag,
  Boxes,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductsPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: '',
    wholesalePrice: '',
    costPrice: '',
    quantity: '',
    minStockLevel: '10',
    categoryId: '',
    taxable: true,
    vatRate: '16'
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    await db.init();
    const data = db.getAllProducts();
    setProducts(data);
  };

  const loadCategories = async () => {
    await db.init();
    const data = db.getAllCategories();
    setCategories(data);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: Product = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      price: parseFloat(formData.price),
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      quantity: parseInt(formData.quantity) || 0,
      minStockLevel: parseInt(formData.minStockLevel) || 10,
      categoryId: formData.categoryId || undefined,
      taxable: formData.taxable,
      taxRate: parseFloat(formData.vatRate) || 16,
      vatRate: parseFloat(formData.vatRate) || 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      db.createProduct(productData);
      toast.success('Product created successfully');
      setShowAddDialog(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updates = {
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      price: parseFloat(formData.price),
      wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      quantity: parseInt(formData.quantity) || 0,
      minStockLevel: parseInt(formData.minStockLevel) || 10,
      categoryId: formData.categoryId || undefined,
      taxable: formData.taxable,
      vatRate: parseFloat(formData.vatRate) || 16
    };

    try {
      db.updateProduct(editingProduct.id, updates);
      toast.success('Product updated successfully');
      setShowEditDialog(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    
    try {
      db.deleteProduct(deletingProduct.id);
      toast.success('Product deleted');
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price.toString(),
      wholesalePrice: product.wholesalePrice?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      quantity: product.quantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      categoryId: product.categoryId || '',
      taxable: product.taxable,
      vatRate: product.vatRate?.toString() || '16'
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      price: '',
      wholesalePrice: '',
      costPrice: '',
      quantity: '',
      minStockLevel: '10',
      categoryId: '',
      taxable: true,
      vatRate: '16'
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Example Product',
        description: 'Product description',
        sku: 'SKU-001',
        barcode: '123456789',
        price: 299.99,
        wholesalePrice: 250.00,
        costPrice: 150.00,
        quantity: 100,
        minStockLevel: 10,
        categoryName: 'Electronics',
        taxable: 'yes',
        vatRate: 16
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
    XLSX.writeFile(wb, 'products_template.xlsx');
    toast.success('Template downloaded');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        setShowImportDialog(true);
        toast.success(`Found ${jsonData.length} products to import`);
      } catch (error) {
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importProducts = async () => {
    let successCount = 0;
    let errorCount = 0;

    for (const row of importData) {
      try {
        let categoryId = undefined;
        if ((row as any).categoryName) {
          const existingCat = categories.find(c => c.name.toLowerCase() === ((row as any).categoryName as string).toLowerCase());
          if (existingCat) {
            categoryId = existingCat.id;
          } else {
            const newCat = db.createCategory({
              id: crypto.randomUUID(),
              name: (row as any).categoryName,
              description: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            categoryId = newCat.id;
            categories.push(newCat);
          }
        }

        const productData: Product = {
          id: crypto.randomUUID(),
          name: (row as any).name,
          description: (row as any).description || '',
          sku: (row as any).sku,
          barcode: (row as any).barcode,
          price: parseFloat((row as any).price) || 0,
          wholesalePrice: (row as any).wholesalePrice ? parseFloat((row as any).wholesalePrice) : undefined,
          costPrice: (row as any).costPrice ? parseFloat((row as any).costPrice) : undefined,
          quantity: parseInt((row as any).quantity) || 0,
          minStockLevel: parseInt((row as any).minStockLevel) || 10,
          categoryId,
          taxable: ((row as any).taxable === 'yes' || (row as any).taxable === true),
          taxRate: parseFloat((row as any).vatRate) || 16,
          vatRate: parseFloat((row as any).vatRate) || 16,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.createProduct(productData);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    toast.success(`Imported ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
    setShowImportDialog(false);
    setImportData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadProducts();
    loadCategories();
  };

  const exportProducts = () => {
    const exportData = products.map(p => ({
      name: p.name,
      description: p.description,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      wholesalePrice: p.wholesalePrice,
      costPrice: p.costPrice,
      quantity: p.quantity,
      minStockLevel: p.minStockLevel,
      categoryName: p.categoryName,
      taxable: p.taxable ? 'yes' : 'no',
      vatRate: p.vatRate
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Products exported');
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProducts(prev => [...prev, productId]);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (product.quantity <= product.minStockLevel) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-none shadow-lg hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Products</p>
              <p className="text-3xl font-bold mt-1">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-none flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 rounded-none shadow-lg hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">In Stock</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">
                {products.filter(p => p.quantity > p.minStockLevel).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-none flex items-center justify-center">
              <Boxes className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 rounded-none shadow-lg hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Low Stock</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">
                {products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-none flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-5 rounded-none shadow-lg hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Out of Stock</p>
              <p className="text-3xl font-bold mt-1 text-red-600">
                {products.filter(p => p.quantity === 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-none flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-none shadow-md">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-none"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 rounded-none">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-none hover-lift">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportProducts} className="rounded-none hover-lift">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="rounded-none hover-lift shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-none shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox 
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-semibold text-sm">Product</th>
                <th className="p-4 text-left font-semibold text-sm">SKU / Barcode</th>
                <th className="p-4 text-left font-semibold text-sm">Category</th>
                <th className="p-4 text-right font-semibold text-sm">Retail Price</th>
                <th className="p-4 text-right font-semibold text-sm">Wholesale</th>
                <th className="p-4 text-center font-semibold text-sm">Stock</th>
                <th className="p-4 text-center font-semibold text-sm">Status</th>
                <th className="p-4 text-center font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr 
                    key={product.id} 
                    className="border-t hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-none flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          <span>{product.sku}</span>
                        </div>
                        {product.barcode && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Barcode className="w-3 h-3" />
                            <span>{product.barcode}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {product.categoryName ? (
                        <Badge variant="secondary" className="rounded-full">{product.categoryName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-lg">{settings?.currencySymbol}{product.price.toFixed(2)}</p>
                      {product.taxable && (
                        <p className="text-xs text-muted-foreground">+ VAT {product.vatRate || 16}%</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {product.wholesalePrice ? (
                        <p className="font-semibold text-primary">{settings?.currencySymbol}{product.wholesalePrice.toFixed(2)}</p>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-bold ${product.quantity <= product.minStockLevel ? 'text-red-600' : 'text-emerald-600'}`}>
                          {product.quantity}
                        </span>
                        <span className="text-xs text-muted-foreground">/ {product.minStockLevel}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none">
                          <DropdownMenuItem onClick={() => openEditDialog(product)} className="cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(product)} className="cursor-pointer text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              Add New Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name"
                    className="rounded-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Input 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter product description"
                    className="rounded-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SKU *</Label>
                    <Input 
                      value={formData.sku} 
                      onChange={e => setFormData({...formData, sku: e.target.value})}
                      placeholder="e.g., SKU-001"
                      className="rounded-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Barcode</Label>
                    <Input 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      placeholder="Enter barcode"
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Retail Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Wholesale Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.wholesalePrice} 
                        onChange={e => setFormData({...formData, wholesalePrice: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cost Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.costPrice} 
                        onChange={e => setFormData({...formData, costPrice: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">VAT Rate (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.vatRate} 
                      onChange={e => setFormData({...formData, vatRate: e.target.value})}
                      placeholder="16"
                      className="rounded-none"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Initial Quantity</Label>
                    <Input 
                      type="number"
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Stock Level</Label>
                    <Input 
                      type="number"
                      value={formData.minStockLevel} 
                      onChange={e => setFormData({...formData, minStockLevel: e.target.value})}
                      placeholder="10"
                      className="rounded-none"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-none">
                Cancel
              </Button>
              <Button type="submit" className="rounded-none shadow-lg hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-none flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              Edit Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name"
                    className="rounded-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Input 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter product description"
                    className="rounded-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SKU *</Label>
                    <Input 
                      value={formData.sku} 
                      onChange={e => setFormData({...formData, sku: e.target.value})}
                      placeholder="e.g., SKU-001"
                      className="rounded-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Barcode</Label>
                    <Input 
                      value={formData.barcode} 
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      placeholder="Enter barcode"
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Retail Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Wholesale Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.wholesalePrice} 
                        onChange={e => setFormData({...formData, wholesalePrice: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cost Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{settings?.currencySymbol}</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.costPrice} 
                        onChange={e => setFormData({...formData, costPrice: e.target.value})}
                        placeholder="0.00"
                        className="pl-8 rounded-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">VAT Rate (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.vatRate} 
                      onChange={e => setFormData({...formData, vatRate: e.target.value})}
                      placeholder="16"
                      className="rounded-none"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input 
                      type="number"
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0"
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Stock Level</Label>
                    <Input 
                      type="number"
                      value={formData.minStockLevel} 
                      onChange={e => setFormData({...formData, minStockLevel: e.target.value})}
                      placeholder="10"
                      className="rounded-none"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
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
              <AlertTriangle className="w-6 h-6" />
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingProduct?.name}</strong>? This action cannot be undone.
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

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Import Products
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found <strong>{importData.length}</strong> products to import. Review the data before confirming.
            </p>
            <div className="border rounded-none max-h-60 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">SKU</th>
                    <th className="text-right p-3 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">{(row as any).name}</td>
                      <td className="p-3">{(row as any).sku}</td>
                      <td className="text-right p-3">{settings?.currencySymbol}{(row as any).price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false);
              setImportData([]);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={downloadTemplate} variant="outline" className="rounded-none">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button onClick={importProducts} className="rounded-none shadow-lg">
              <Upload className="w-4 h-4 mr-2" />
              Import {importData.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
