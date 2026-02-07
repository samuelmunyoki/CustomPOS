import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    lowStockCount: 0,
    weekSales: [] as { date: string; sales: number }[],
    topProducts: [] as { name: string; sales: number }[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await db.init();
      
      const allSales = db.getAllSales().filter(s => s.status === 'completed');
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const todaySales = allSales.filter(s => 
        s.completedAt && isWithinInterval(new Date(s.completedAt), { start: todayStart, end: todayEnd })
      );
      
      const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);

      const products = db.getAllProducts();
      const lowStock = products.filter(p => p.quantity <= p.minStockLevel);

      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const daySales = allSales.filter(s => 
          s.completedAt && isWithinInterval(new Date(s.completedAt), { 
            start: startOfDay(date), 
            end: endOfDay(date) 
          })
        );
        weekData.push({
          date: format(date, 'EEE'),
          sales: daySales.reduce((sum, s) => sum + s.total, 0)
        });
      }

      const productSales: Record<string, { name: string; sales: number }> = {};
      allSales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.productName, sales: 0 };
          }
          productSales[item.productId].sales += item.total;
        });
      });
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setStats({
        todaySales: todayTotal,
        todayTransactions: todaySales.length,
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        weekSales: weekData,
        topProducts
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    alert 
  }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    icon: any;
    alert?: boolean;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded flex items-center justify-center ${alert ? 'bg-red-100' : 'bg-primary/10'}`}>
            <Icon className={`w-6 h-6 ${alert ? 'text-red-600' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
          <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={`${settings?.currencySymbol}${stats.todaySales.toFixed(2)}`}
          subtitle={`${stats.todayTransactions} transactions`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          subtitle="Active inventory"
          icon={Package}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          subtitle="Need attention"
          icon={AlertTriangle}
          alert={stats.lowStockCount > 0}
        />
        <StatCard
          title="Active Users"
          value="2"
          subtitle="Admin + Attendant"
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weekSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `${settings?.currencySymbol}${value.toFixed(2)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    formatter={(value: number) => `${settings?.currencySymbol}${value.toFixed(2)}`}
                  />
                  <Bar dataKey="sales" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/?page=products'}>
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/?page=pos'}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Open POS
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/?page=reports'}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/?page=settings'}>
              <Calendar className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
