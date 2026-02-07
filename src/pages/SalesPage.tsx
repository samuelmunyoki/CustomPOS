import React, { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import { Sale, SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search,
  Receipt,
  Calendar,
  User,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Eye,
  RotateCcw,
  X
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function SalesPage() {
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchQuery, dateFilter]);

  const loadSales = async () => {
    await db.init();
    const data = db.getAllSales().filter(s => s.status !== 'held');
    setSales(data);
  };

  const filterSales = () => {
    let filtered = sales;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.createdByName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    const today = new Date();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(s => 
          s.completedAt && isWithinInterval(new Date(s.completedAt), {
            start: startOfDay(today),
            end: endOfDay(today)
          })
        );
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => 
          s.completedAt && new Date(s.completedAt) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => 
          s.completedAt && new Date(s.completedAt) >= monthAgo
        );
        break;
    }

    setFilteredSales(filtered);
  };

  const viewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  const printReceipt = (sale: Sale) => {
    const printer = db.getDefaultPrinter();
    if (!printer) {
      toast.error('No default printer configured');
      return;
    }
    toast.info('Printing receipt...');
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'mpesa': return <Smartphone className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by receipt number or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={loadSales}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Receipt #</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-center p-4">Items</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-center p-4">Payment</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No sales found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr key={sale.id} className="border-t hover:bg-muted/50">
                      <td className="p-4 font-medium">{sale.receiptNumber}</td>
                      <td className="p-4 text-sm">
                        {sale.completedAt && format(new Date(sale.completedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-4 text-sm">{sale.createdByName}</td>
                      <td className="p-4 text-center">{sale.items.length}</td>
                      <td className="p-4 text-right font-semibold">
                        {settings?.currencySymbol}{sale.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getPaymentIcon(sale.paymentMethod)}
                          <span className="text-sm capitalize">{sale.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(sale.status)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewDetails(sale)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => printReceipt(sale)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Sale Details - {selectedSale?.receiptNumber}</span>
              {selectedSale && getStatusBadge(selectedSale.status)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">
                  {selectedSale?.completedAt && format(new Date(selectedSale.completedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Cashier</span>
                <p className="font-medium">{selectedSale?.createdByName}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Payment Method</span>
                <div className="flex items-center gap-1 font-medium capitalize">
                  {selectedSale && getPaymentIcon(selectedSale.paymentMethod)}
                  {selectedSale?.paymentMethod}
                </div>
              </div>
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Items</span>
                <p className="font-medium">{selectedSale?.items.length}</p>
              </div>
            </div>

            <div className="border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale?.items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3">
                        {item.productName}
                        {item.editedByAttendant && (
                          <span className="ml-2 text-xs text-amber-500">(price edited)</span>
                        )}
                      </td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">{settings?.currencySymbol}{item.price.toFixed(2)}</td>
                      <td className="text-right p-3">{settings?.currencySymbol}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{settings?.currencySymbol}{selectedSale?.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale?.discountAmount && selectedSale.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{settings?.currencySymbol}{selectedSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {selectedSale?.taxAmount && selectedSale.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{settings?.taxName}</span>
                  <span>{settings?.currencySymbol}{selectedSale.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{settings?.currencySymbol}{selectedSale?.total.toFixed(2)}</span>
              </div>
              {selectedSale?.cashReceived && selectedSale.cashReceived > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cash Received</span>
                    <span>{settings?.currencySymbol}{selectedSale.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Change</span>
                    <span>{settings?.currencySymbol}{selectedSale.change?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <Button onClick={() => selectedSale && printReceipt(selectedSale)}>
              <Printer className="w-4 h-4 mr-1" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
