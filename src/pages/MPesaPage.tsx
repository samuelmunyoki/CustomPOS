import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import type { MPesaConfig, MPesaTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Save,
  Smartphone,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import MPesaService from '@/lib/mpesa';

export default function MPesaPage() {
  const [config, setConfig] = useState<MPesaConfig | null>(null);
  const [formData, setFormData] = useState({
    consumerKey: '',
    consumerSecret: '',
    passkey: '',
    shortcode: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    enabled: false
  });
  const [testPhone, setTestPhone] = useState('');
  const [testAmount, setTestAmount] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    await db.init();
    const data = db.getMPesaConfig();
    if (data) {
      setConfig(data);
      setFormData({
        consumerKey: data.consumerKey,
        consumerSecret: data.consumerSecret,
        passkey: data.passkey,
        shortcode: data.shortcode,
        environment: data.environment,
        enabled: data.enabled
      });
    }
  };

  const saveConfig = () => {
    try {
      const newConfig: MPesaConfig = {
        id: config?.id || crypto.randomUUID(),
        consumerKey: formData.consumerKey,
        consumerSecret: formData.consumerSecret,
        passkey: formData.passkey,
        shortcode: formData.shortcode,
        environment: formData.environment,
        enabled: formData.enabled,
        createdAt: config?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.saveMPesaConfig(newConfig);
      toast.success('MPesa configuration saved');
      loadConfig();
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  // const sendSTKPush = async () => {
  //   if (!formData.enabled) {
  //     toast.error('MPesa is not enabled');
  //     return;
  //   }
  //   if (!testPhone || !testAmount) {
  //     toast.error('Please enter phone number and amount');
  //     return;
  //   }

  //   setIsTesting(true);
    
  //   setTimeout(() => {
  //     toast.info('STK Push sent! In production, this would initiate a real MPesa transaction.');
  //     setIsTesting(false);
  //   }, 2000);
  // };

  const sendSTKPush = async () => {
    if (!formData.enabled) {
      toast.error('M-Pesa is not enabled');
      return;
    }

    if (!formData.consumerKey || !formData.consumerSecret || !formData.passkey || !formData.shortcode) {
      toast.error('Please configure M-Pesa settings first');
      return;
    }

    if (!testPhone || !testAmount) {
      toast.error('Please enter phone number and amount');
      return;
    }

    const amount = parseFloat(testAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      toast.error('Minimum amount is KES 1');
      return;
    }

    setIsTesting(true);

    try {
      const mpesaService = new MPesaService({
        consumerKey: formData.consumerKey,
        consumerSecret: formData.consumerSecret,
        passkey: formData.passkey,
        shortcode: formData.shortcode,
        environment: formData.environment
      });

      const response = await mpesaService.initiateSTKPush({
        phoneNumber: testPhone,
        amount: amount,
        accountReference: 'POS Test',
        transactionDesc: 'Test payment from POS'
      });

      console.log('STK Push Response:', response);

      // Save transaction to database
      const transaction: MPesaTransaction = {
        id: crypto.randomUUID(),
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
        phoneNumber: testPhone,
        amount: amount,
        accountReference: 'POS Test',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // db.saveMPesaTransaction(transaction);
      // loadTransactions();

      toast.success('STK Push sent successfully! Check your phone to complete payment.', {
        description: `Checkout Request ID: ${response.CheckoutRequestID}`,
        duration: 5000
      });

      // Poll for transaction status after 15 seconds
      // setTimeout(() => checkTransactionStatus(response.CheckoutRequestID), 15000);

    } catch (error: any) {
      console.error('STK Push failed:', error);
      toast.error(error.message || 'Failed to send STK Push');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MPesa Configuration</h2>
          <p className="text-muted-foreground">Configure MPesa payments for your store</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test STK Push</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                MPesa API Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-none">
                <div>
                  <p className="font-medium">Enable MPesa</p>
                  <p className="text-sm text-muted-foreground">Allow MPesa payments in POS</p>
                </div>
                <Switch 
                  checked={formData.enabled}
                  onCheckedChange={checked => setFormData({...formData, enabled: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select 
                  value={formData.environment} 
                  onValueChange={v => setFormData({...formData, environment: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="production">Production (Live)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Consumer Key</Label>
                <Input 
                  value={formData.consumerKey}
                  onChange={e => setFormData({...formData, consumerKey: e.target.value})}
                  placeholder="Your MPesa consumer key"
                />
              </div>

              <div className="space-y-2">
                <Label>Consumer Secret</Label>
                <Input 
                  type="password"
                  value={formData.consumerSecret}
                  onChange={e => setFormData({...formData, consumerSecret: e.target.value})}
                  placeholder="Your MPesa consumer secret"
                />
              </div>

              <div className="space-y-2">
                <Label>Passkey</Label>
                <Input 
                  type="password"
                  value={formData.passkey}
                  onChange={e => setFormData({...formData, passkey: e.target.value})}
                  placeholder="Your MPesa passkey"
                />
              </div>

              <div className="space-y-2">
                <Label>Shortcode</Label>
                <Input 
                  value={formData.shortcode}
                  onChange={e => setFormData({...formData, shortcode: e.target.value})}
                  placeholder="Your MPesa shortcode"
                />
              </div>

              <Button onClick={saveConfig} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>

              {formData.environment === 'production' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-none">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700">Production Mode</p>
                      <p className="text-sm text-green-600">Transactions will be processed with real money.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Test STK Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.enabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-none">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700">MPesa Not Enabled</p>
                      <p className="text-sm text-amber-600">Please enable MPesa in the Configuration tab first.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="2547XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input 
                    type="number"
                    value={testAmount}
                    onChange={e => setTestAmount(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>

              <Button 
                onClick={sendSTKPush} 
                disabled={isTesting || !formData.enabled}
                className="w-full"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                {isTesting ? 'Sending...' : 'Send STK Push'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Customer will receive an M-Pesa prompt on their phone
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
