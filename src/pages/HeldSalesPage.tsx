import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import type { Sale } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Play,
  Trash2,
  ShoppingCart,
  Clock,
  User,
  X,
  Search,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

export default function HeldSalesPage() {
  const { settings } = useSettings();
  const [heldSales, setHeldSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHeldSales();
  }, []);

  const loadHeldSales = async () => {
    await db.init();
    const sales = db.getSalesByStatus('held');
    setHeldSales(sales);
  };

  const filteredSales = heldSales.filter(sale => 
    sale.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.createdByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resumeSale = (sale: Sale) => {
    localStorage.setItem('pos_resume_sale', JSON.stringify(sale));
    window.location.href = '/?page=pos';
  };

  const deleteHeldSale = (saleId: string) => {
    if (!confirm('Are you sure you want to delete this held sale?')) return;
    
    try {
      db.deleteSale(saleId);
      toast.success('Held sale deleted');
      loadHeldSales();
    } catch (error) {
      toast.error('Failed to delete held sale');
    }
  };

  const viewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search held sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
        <Button variant="outline" onClick={loadHeldSales}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Held Sales</h3>
            <p className="text-muted-foreground">
              There are no held sales. You can hold sales from the POS screen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSales.map(sale => (
            <Card key={sale.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{sale.receiptNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {sale.heldAt && format(new Date(sale.heldAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                    Held
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{sale.createdByName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-y">
                    <span className="text-sm text-muted-foreground">Items</span>
                    <span className="font-medium">{sale.items.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-xl font-bold">
                      {settings?.currencySymbol}{sale.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => resumeSale(sale)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => viewDetails(sale)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteHeldSale(sale.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sale Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sale Details - {selectedSale?.receiptNumber}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created By</span>
                  <p className="font-medium">{selectedSale?.createdByName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Held At</span>
                  <p className="font-medium">
                    {selectedSale?.heldAt && format(new Date(selectedSale.heldAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Item</th>
                      <th className="text-center p-2">Qty</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale?.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{item.productName}</td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">{settings?.currencySymbol}{item.price.toFixed(2)}</td>
                        <td className="text-right p-2">{settings?.currencySymbol}{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-sm">
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
                    <span className="text-muted-foreground">Tax</span>
                    <span>{settings?.currencySymbol}{selectedSale.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{settings?.currencySymbol}{selectedSale?.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <Button onClick={() => selectedSale && resumeSale(selectedSale)}>
              <Play className="w-4 h-4 mr-1" />
              Resume Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
