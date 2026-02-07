// User Types
export type UserRole = 'admin' | 'attendant';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  wholesalePrice?: number;
  costPrice?: number;
  quantity: number;
  minStockLevel: number;
  categoryId?: string;
  categoryName?: string;
  taxable: boolean;
  taxRate?: number;
  vatRate?: number;
  createdAt: string;
  updatedAt: string;
}

// Sale Types
export type SaleStatus = 'completed' | 'held' | 'cancelled';
export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'mixed';
export type SaleType = 'retail' | 'wholesale';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  originalPrice: number;
  price: number;
  discountAmount: number;
  discountPercent: number;
  discountId?: string;
  discountName?: string;
  taxAmount: number;
  total: number;
  editedByAttendant?: boolean;
  originalPriceBeforeEdit?: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  splitPayments?: SplitPayment[];
  saleType: SaleType;
  mpesaTransactionId?: string;
  mpesaPhoneNumber?: string;
  cashReceived?: number;
  change?: number;
  status: SaleStatus;
  heldAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdBy: string;
  createdByName: string;
  notes?: string;
  etimsInvoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Discount Types
export type DiscountType = 'percentage' | 'fixed';
export type DiscountScope = 'item' | 'sale';

export interface Discount {
  id: string;
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  minPurchase?: number;
  maxDiscount?: number;
  active: boolean;
  allowAttendantToggle: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// MPesa Types
export interface MPesaConfig {
  id: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MPesaTransaction {
  id: string;
  saleId?: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  resultCode?: string;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  createdAt: string;
  updatedAt: string;
}

// e-TIMS Types (Kenya Revenue Authority)
export interface ETimsConfig {
  id: string;
  enabled: boolean;
  pin: string;
  deviceSerialNumber: string;
  communicationKey: string;
  serverUrl: string;
  environment: 'sandbox' | 'production';
  autoSubmit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ETimsInvoice {
  id: string;
  saleId: string;
  invoiceNumber: string;
  cuInvoiceNumber?: string;
  status: 'pending' | 'submitted' | 'failed';
  submittedAt?: string;
  responseCode?: string;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Printer Types
export interface PrinterConfig {
  id: string;
  name: string;
  type: 'usb' | 'bluetooth' | 'network' | 'web';
  address?: string;
  port?: number;
  paperWidth: 58 | 80;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Currency Types
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimalPlaces: 2, flag: '🇰🇪' },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, flag: '🇬🇧' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', decimalPlaces: 0, flag: '🇺🇬' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', decimalPlaces: 2, flag: '🇹🇿' },
  { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', decimalPlaces: 0, flag: '🇷🇼' },
];

// Theme Config Types
export interface ThemeConfig {
  primaryColor: string;
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  borderRadius: number;
  fontScale: number;
}

// Split Payment Types
export interface SplitPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  mpesaPhoneNumber?: string;
  cardReference?: string;
}

// Settings Types
export interface AppSettings {
  id: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  storeKraPin?: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;
  vatEnabled: boolean;
  vatRate: number;
  receiptFooter?: string;
  receiptHeader?: string;
  allowAttendantPriceEdit: boolean;
  requirePasswordForDiscount: boolean;
  lowStockThreshold: number;
  theme: 'light' | 'dark' | 'system';
  themeConfig: any;
  emailProvider?: 'gmail' | 'sendgrid' | 'mailgun' | 'smtp';
  emailApiKey?: string;
  emailFrom?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  defaultSaleType: SaleType;
  allowSplitPayments: boolean;
  createdAt: string;
  updatedAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

// Sync Queue Types
export interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: string;
  retryCount: number;
  createdAt: string;
}

// Theme Types
export type ThemeColor = 'indigo' | 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink' | 'cyan';

// Excel Template Types
export interface ProductExcelTemplate {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  wholesalePrice?: number;
  costPrice?: number;
  quantity: number;
  minStockLevel: number;
  categoryName?: string;
  taxable: 'yes' | 'no';
  taxRate: number;
  vatRate?: number;
}

// Keyboard Shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export interface MPesaConfig {
  id: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MPesaTransaction {
  id: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number;
  accountReference: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  resultCode?: string;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  createdAt: string;
  updatedAt: string;
}