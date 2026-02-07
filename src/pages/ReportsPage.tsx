import React, { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import { Sale, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  ShoppingCart,
  RotateCcw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export default function ReportsPage() {
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await db.init();
    const allSales = db.getAllSales().filter(s => s.status === 'completed');
    const allProducts = db.getAllProducts();
    setSales(allSales);
    setProducts(allProducts);
  };

  const getFilteredSales = () => {
    const today = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(today);
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
      case 'year':
        startDate = subDays(today, 365);
        break;
      default:
        startDate = subDays(today, 7);
    }

    return sales.filter(s => 
      s.completedAt && new Date(s.completedAt) >= startDate
    );
  };

  const generateSalesReport = () => {
    const filteredSales = getFilteredSales();
    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = filteredSales.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalDiscounts = filteredSales.reduce((sum, s) => sum + s.discountAmount, 0);
    const totalTax = filteredSales.reduce((sum, s) => sum + s.taxAmount, 0);

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    filteredSales.forEach(s => {
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + s.total;
    });

    // Top products
    const productSales: Record<string, { name: string; quantity: number; total: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, total: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].total += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      totalDiscounts,
      totalTax,
      paymentMethods,
      topProducts,
      filteredSales
    };
  };

  const downloadSalesExcel = () => {
    const report = generateSalesReport();
    
    const summaryData = [
      { Metric: 'Total Sales', Value: `${settings?.currencySymbol}${report.totalSales.toFixed(2)}` },
      { Metric: 'Total Transactions', Value: report.totalTransactions },
      { Metric: 'Average Transaction', Value: `${settings?.currencySymbol}${report.averageTransaction.toFixed(2)}` },
      { Metric: 'Total Discounts', Value: `${settings?.currencySymbol}${report.totalDiscounts.toFixed(2)}` },
      { Metric: 'Total Tax', Value: `${settings?.currencySymbol}${report.totalTax.toFixed(2)}` }
    ];

    const paymentData = Object.entries(report.paymentMethods).map(([method, amount]) => ({
      'Payment Method': method,
      'Amount': `${settings?.currencySymbol}${amount.toFixed(2)}`
    }));

    const topProductsData = report.topProducts.map((p, i) => ({
      'Rank': i + 1,
      'Product': p.name,
      'Quantity Sold': p.quantity,
      'Total Sales': `${settings?.currencySymbol}${p.total.toFixed(2)}`
    }));

    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    
    const ws2 = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Payment Methods');
    
    const ws3 = XLSX.utils.json_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Top Products');

    XLSX.writeFile(wb, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Sales report downloaded');
  };

  const downloadSalesPDF = () => {
    const report = generateSalesReport();
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Sales Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(`Period: ${dateRange}`, 14, 38);
    
    doc.setFontSize(14);
    doc.text('Summary', 14, 50);
    
    const summaryData = [
      ['Total Sales', `${settings?.currencySymbol}${report.totalSales.toFixed(2)}`],
      ['Total Transactions', report.totalTransactions.toString()],
      ['Average Transaction', `${settings?.currencySymbol}${report.averageTransaction.toFixed(2)}`],
      ['Total Discounts', `${settings?.currencySymbol}${report.totalDiscounts.toFixed(2)}`],
      ['Total Tax', `${settings?.currencySymbol}${report.totalTax.toFixed(2)}`]
    ];
    
    (doc as any).autoTable({
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData
    });
    
    doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Sales report downloaded');
  };

  const downloadInventoryExcel = () => {
    const lowStock = products.filter(p => p.quantity <= p.minStockLevel);
    const available = products.filter(p => p.quantity > 0);
    const outOfStock = products.filter(p => p.quantity === 0);

    const allProductsData = products.map(p => ({
      'Name': p.name,
      'SKU': p.sku,
      'Barcode': p.barcode || '',
      'Category': p.categoryName || 'Uncategorized',
      'Price': p.price,
      'Quantity': p.quantity,
      'Min Stock Level': p.minStockLevel,
      'Status': p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock',
      'Value': p.price * p.quantity
    }));

    const lowStockData = lowStock.map(p => ({
      'Name': p.name,
      'SKU': p.sku,
      'Current Stock': p.quantity,
      'Min Required': p.minStockLevel,
      'Reorder': p.minStockLevel - p.quantity + 10
    }));

    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(allProductsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'All Products');
    
    const ws2 = XLSX.utils.json_to_sheet(lowStockData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Low Stock');

    XLSX.writeFile(wb, `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Inventory report downloaded');
  };

  const downloadLowStockExcel = () => {
    const lowStock = products.filter(p => p.quantity <= p.minStockLevel);
    
    const data = lowStock.map(p => ({
      'Name': p.name,
      'SKU': p.sku,
      'Barcode': p.barcode || '',
      'Category': p.categoryName || 'Uncategorized',
      'Current Stock': p.quantity,
      'Min Stock Level': p.minStockLevel,
      'Reorder Quantity': Math.max(p.minStockLevel - p.quantity + 10, 10),
      'Price': p.price,
      'Supplier Cost': p.costPrice || 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Low Stock Items');

    XLSX.writeFile(wb, `low_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Low stock report downloaded');
  };

  const downloadAvailableProductsExcel = () => {
    const available = products.filter(p => p.quantity > 0);
    
    const data = available.map(p => ({
      'Name': p.name,
      'SKU': p.sku,
      'Barcode': p.barcode || '',
      'Category': p.categoryName || 'Uncategorized',
      'Price': p.price,
      'Quantity': p.quantity,
      'Value': p.price * p.quantity
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Available Products');

    XLSX.writeFile(wb, `available_products_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Available products report downloaded');
  };

  const report = generateSalesReport();
  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">Generate and download business reports</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" onClick={loadData}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <h3 className="text-2xl font-bold">{settings?.currencySymbol}{report.totalSales.toFixed(2)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <h3 className="text-2xl font-bold">{report.totalTransactions}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Sale</p>
                    <h3 className="text-2xl font-bold">{settings?.currencySymbol}{report.averageTransaction.toFixed(2)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Methods</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(report.paymentMethods).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="capitalize font-medium">{method}</span>
                    <span className="font-bold">{settings?.currencySymbol}{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Products</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span>{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{settings?.currencySymbol}{product.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={downloadSalesExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
            <Button variant="outline" onClick={downloadSalesPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <h3 className="text-2xl font-bold">{products.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <h3 className="text-2xl font-bold">
                      {settings?.currencySymbol}{products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <h3 className="text-2xl font-bold">{new Set(products.map(p => p.categoryId)).size}</h3>
                  </div>
                  <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={downloadInventoryExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Full Inventory Report
          </Button>
        </TabsContent>

        <TabsContent value="lowstock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Low Stock Items ({lowStockProducts.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All products are well stocked!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{product.quantity} left</Badge>
                        <p className="text-sm text-muted-foreground">Min: {product.minStockLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={downloadLowStockExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Low Stock Report
          </Button>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Available Products ({products.filter(p => p.quantity > 0).length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {products.filter(p => p.quantity > 0).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{settings?.currencySymbol}{product.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={downloadAvailableProductsExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Available Products
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
