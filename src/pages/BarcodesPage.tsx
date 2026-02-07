import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Barcode from 'react-barcode';
import {
  Search,
  Printer,
  Package,
  RotateCcw,
  Download,
  Plus,
  Minus,
  Barcode as BarcodeIcon,
  CheckSquare,
  Square,
  Trash2,
  ShoppingCart,
  Tag,
  FileText,
  QrCode
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface SelectedProduct {
  product: Product;
  quantity: number;
}

export default function BarcodesPage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [singleProduct, setSingleProduct] = useState<Product | null>(null);
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const barcodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    await db.init();
    const data = db.getAllProducts();
    setProducts(data);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const generateBarcode = () => {
    const prefix = '200';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const code = prefix + random;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return code + checkDigit;
  };

  const assignBarcode = (product: Product) => {
    const newBarcode = generateBarcode();
    db.updateProduct(product.id, { barcode: newBarcode });
    toast.success(`Barcode assigned: ${newBarcode}`);
    loadProducts();
    if (singleProduct?.id === product.id) {
      setSingleProduct({ ...product, barcode: newBarcode });
    }
  };

  const toggleProductSelection = (product: Product) => {
    const existing = selectedProducts.find(sp => sp.product.id === product.id);
    if (existing) {
      setSelectedProducts(prev => prev.filter(sp => sp.product.id !== product.id));
    } else {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(prev => 
      prev.map(sp => 
        sp.product.id === productId ? { ...sp, quantity } : sp
      )
    );
  };

  const removeSelectedProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(sp => sp.product.id !== productId));
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => ({ product: p, quantity: 1 })));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const getLabelDimensions = () => {
    switch (labelSize) {
      case 'small': return { width: 150, height: 80, fontSize: 8 };
      case 'large': return { width: 300, height: 180, fontSize: 14 };
      default: return { width: 200, height: 120, fontSize: 10 };
    }
  };

  const printBarcodes = (productsToPrint: SelectedProduct[]) => {
    if (productsToPrint.length === 0) {
      toast.error('No products selected for printing');
      return;
    }

    const hasMissingBarcodes = productsToPrint.some(sp => !sp.product.barcode);
    if (hasMissingBarcodes) {
      toast.error('Some selected products do not have barcodes assigned');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    const dims = getLabelDimensions();

    const barcodeHtml = productsToPrint.flatMap(sp => 
      Array(sp.quantity).fill(0).map(() => `
        <div style="
          display: inline-block;
          width: ${dims.width}px;
          height: ${dims.height}px;
          padding: 8px;
          margin: 4px;
          border: 1px solid #ccc;
          text-align: center;
          page-break-inside: avoid;
          background: white;
          box-sizing: border-box;
          overflow: hidden;
        ">
          <div style="font-size: ${dims.fontSize}px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${sp.product.name}
          </div>
          <div style="font-size: ${dims.fontSize - 2}px; color: #666; margin-bottom: 4px;">
            ${sp.product.sku}
          </div>
          <svg style="max-width: 100%; height: ${dims.height * 0.4}px; margin: 4px 0;">
            ${document.querySelector(`#barcode-${sp.product.id} svg`)?.innerHTML || ''}
          </svg>
          <div style="font-size: ${dims.fontSize + 2}px; font-weight: bold; margin-top: 4px;">
            ${sp.product.barcode}
          </div>
          <div style="font-size: ${dims.fontSize + 4}px; font-weight: bold; color: #000; margin-top: 4px;">
            ${settings?.currencySymbol}${sp.product.price.toFixed(2)}
          </div>
        </div>
      `)
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 20px; text-align: center; background: white; border-bottom: 1px solid #ddd;">
            <h2>Barcode Print Preview</h2>
            <p>${productsToPrint.reduce((sum, sp) => sum + sp.quantity, 0)} labels to print</p>
            <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              Print
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Close
            </button>
          </div>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; padding: 20px;">
            ${barcodeHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadBarcode = (product: Product) => {
    if (!product.barcode) return;
    
    const svg = document.querySelector(`#barcode-${product.id} svg`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = `barcode-${product.barcode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const totalLabels = selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-card p-6 rounded-none shadow-lg">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Barcode Generator</h2>
          <p className="text-muted-foreground mt-1">Generate and print product barcodes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadProducts} className="rounded-none hover-lift">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="rounded-none! p-1">
          <TabsTrigger value="single" className="rounded-none">Single Product</TabsTrigger>
          <TabsTrigger value="batch" className="rounded-none">Batch Print</TabsTrigger>
          <TabsTrigger value="custom" className="rounded-none">Custom Barcode</TabsTrigger>
        </TabsList>

        {/* Single Product Tab */}
        <TabsContent value="single" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Product Selection */}
            <Card className="rounded-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Select Product
                </CardTitle>
                <CardDescription>Choose a product to generate or print barcodes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 rounded-none"
                  />
                </div>

                <div className="border rounded-none max-h-80 overflow-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSingleProduct(product);
                        setSingleQuantity(1);
                      }}
                      className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors ${
                        singleProduct?.id === product.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-none flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{settings?.currencySymbol}{product.price.toFixed(2)}</p>
                        {product.barcode ? (
                          <Badge variant="default" className="rounded-full text-xs mt-1">
                            <BarcodeIcon className="w-3 h-3 mr-1" />
                            Has barcode
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full text-xs mt-1">
                            No barcode
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Barcode Preview */}
            <Card className="rounded-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarcodeIcon className="w-5 h-5 text-primary" />
                  Barcode Preview
                </CardTitle>
                <CardDescription>Preview and print barcodes for the selected product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {singleProduct ? (
                  <>
                    <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-none">
                      <h3 className="font-bold text-xl">{singleProduct.name}</h3>
                      <p className="text-muted-foreground">{singleProduct.sku}</p>
                      <p className="text-2xl font-bold text-primary mt-2">{settings?.currencySymbol}{singleProduct.price.toFixed(2)}</p>
                    </div>

                    {singleProduct.barcode ? (
                      <div className="flex flex-col items-center gap-4">
                        <div id={`barcode-${singleProduct.id}`} className="p-6 bg-white rounded-none shadow-inner border">
                          <Barcode 
                            value={singleProduct.barcode}
                            format="EAN13"
                            width={2}
                            height={80}
                            displayValue={true}
                            fontSize={16}
                          />
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-none">
                          <Label className="text-sm font-medium">Quantity to Print:</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSingleQuantity(Math.max(1, singleQuantity - 1))}
                              className="rounded-none h-8 w-8"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-bold text-lg">{singleQuantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSingleQuantity(singleQuantity + 1)}
                              className="rounded-none h-8 w-8"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            onClick={() => printBarcodes([{ product: singleProduct, quantity: singleQuantity }])}
                            className="rounded-none shadow-lg hover-lift"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print {singleQuantity} Label{singleQuantity > 1 ? 's' : ''}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => downloadBarcode(singleProduct)}
                            className="rounded-none hover-lift"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarcodeIcon className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">This product does not have a barcode assigned.</p>
                        <Button onClick={() => assignBarcode(singleProduct)} className="rounded-none shadow-lg hover-lift">
                          <Plus className="w-4 h-4 mr-2" />
                          Generate Barcode
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select a product to view or generate barcode</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Print Tab */}
        <TabsContent value="batch" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Product Selection */}
            <Card className="lg:col-span-2 rounded-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Select Products
                </CardTitle>
                <CardDescription>Select multiple products and set print quantities for each</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 rounded-none"
                    />
                  </div>
                  <Button variant="outline" onClick={selectAllProducts} className="rounded-none hover-lift">
                    {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="border rounded-none max-h-96 overflow-auto">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.some(sp => sp.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-4 border-b last:border-b-0 transition-colors ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProductSelection(product)}
                          />
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-none flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {product.barcode ? (
                            <Badge variant="default" className="rounded-full">
                              <BarcodeIcon className="w-3 h-3 mr-1" />
                              {product.barcode}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="rounded-full">No barcode</Badge>
                          )}
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const sp = selectedProducts.find(s => s.product.id === product.id);
                                  if (sp) updateProductQuantity(product.id, sp.quantity - 1);
                                }}
                                className="rounded-none h-7 w-7"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-bold">
                                {selectedProducts.find(sp => sp.product.id === product.id)?.quantity || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const sp = selectedProducts.find(s => s.product.id === product.id);
                                  if (sp) updateProductQuantity(product.id, sp.quantity + 1);
                                }}
                                className="rounded-none h-7 w-7"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Products Summary */}
            <Card className="rounded-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Print Summary
                </CardTitle>
                <CardDescription>Review selected products before printing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No products selected</p>
                    <p className="text-sm">Select products from the list to print barcodes</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-none">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{selectedProducts.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Labels</p>
                        <p className="text-2xl font-bold text-primary">{totalLabels}</p>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-auto">
                      {selectedProducts.map(sp => (
                        <div key={sp.product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{sp.product.name}</p>
                            <p className="text-xs text-muted-foreground">{sp.product.barcode || 'No barcode'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="rounded-full">{sp.quantity}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSelectedProduct(sp.product.id)}
                              className="h-7 w-7 text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Label Size</Label>
                      <div className="flex gap-2">
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <Button
                            key={size}
                            variant={labelSize === size ? 'default' : 'outline'}
                            onClick={() => setLabelSize(size)}
                            className="flex-1 rounded-none capitalize"
                            size="sm"
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => printBarcodes(selectedProducts)}
                        className="flex-1 rounded-none shadow-lg hover-lift"
                        disabled={selectedProducts.some(sp => !sp.product.barcode)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print All ({totalLabels})
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={clearSelection}
                        className="rounded-none"
                      >
                        Clear
                      </Button>
                    </div>

                    {selectedProducts.some(sp => !sp.product.barcode) && (
                      <p className="text-xs text-amber-600 text-center">
                        Some selected products don't have barcodes assigned
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Barcode Tab */}
        <TabsContent value="custom" className="space-y-6 mt-6">
          <Card className="rounded-none shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Custom Barcode Generator
              </CardTitle>
              <CardDescription>Generate barcodes with custom values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter value to encode"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  className="rounded-none"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setBarcodeValue(generateBarcode())}
                  className="rounded-none hover-lift"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Random
                </Button>
              </div>
              
              {barcodeValue && (
                <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-none shadow-inner border">
                  <div id="custom-barcode">
                    <Barcode 
                      value={barcodeValue}
                      format={barcodeValue.length === 13 ? "EAN13" : "CODE128"}
                      width={2}
                      height={100}
                      displayValue={true}
                      fontSize={16}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const svg = document.querySelector('#custom-barcode svg');
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width * 2;
                            canvas.height = img.height * 2;
                            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                            const link = document.createElement('a');
                            link.download = `barcode-${barcodeValue}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          };
                          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                        }
                      }}
                      className="rounded-none hover-lift"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const svg = document.querySelector('#custom-barcode svg');
                          printWindow.document.write(`
                            <html>
                              <head><title>Print Barcode</title></head>
                              <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
                                <svg>${svg?.innerHTML}</svg>
                                <script>window.print();</script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="rounded-none shadow-lg hover-lift"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden barcode elements for print */}
      <div className="hidden">
        {products.map(product => product.barcode && (
          <div key={product.id} id={`barcode-${product.id}`}>
            <Barcode 
              value={product.barcode}
              format="EAN13"
              width={2}
              height={80}
              displayValue={true}
              fontSize={14}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
