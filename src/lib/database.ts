import type { User, Category, Product, Sale, Discount, MPesaConfig, MPesaTransaction, ETimsConfig, ETimsInvoice, PrinterConfig, AppSettings, AuditLog, SyncQueue } from '@/types';

// Database singleton
class Database {
  private db: any = null;
  private initPromise: Promise<void> | null = null;
  private SQL: any = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.db) return Promise.resolve();

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      const initSqlJs = (await import('sql.js')).default;
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      const savedDb = localStorage.getItem('pos_database');
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new this.SQL.Database(uint8Array);
      } else {
        this.db = new this.SQL.Database();
        this.createTables();
        this.seedData();
      }

      setInterval(() => this.saveToStorage(), 5000);
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private createTables(): void {
    
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        resetToken TEXT,
        resetTokenExpiry TEXT
      )
    `);

    // Categories table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Products table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT,
        price REAL NOT NULL,
        wholesalePrice REAL,
        costPrice REAL,
        quantity INTEGER NOT NULL DEFAULT 0,
        minStockLevel INTEGER NOT NULL DEFAULT 10,
        categoryId TEXT,
        taxable INTEGER NOT NULL DEFAULT 1,
        taxRate REAL NOT NULL DEFAULT 0,
        vatRate REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id)
      )
    `);

    // Sales table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        receiptNumber TEXT UNIQUE NOT NULL,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discountAmount REAL NOT NULL DEFAULT 0,
        discountPercent REAL NOT NULL DEFAULT 0,
        taxAmount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        splitPayments TEXT,
        saleType TEXT NOT NULL DEFAULT 'retail',
        mpesaTransactionId TEXT,
        mpesaPhoneNumber TEXT,
        cashReceived REAL,
        changeAmount REAL,
        status TEXT NOT NULL,
        heldAt TEXT,
        completedAt TEXT,
        cancelledAt TEXT,
        createdBy TEXT NOT NULL,
        createdByName TEXT NOT NULL,
        notes TEXT,
        etimsInvoiceNumber TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Discounts table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        scope TEXT NOT NULL,
        minPurchase REAL,
        maxDiscount REAL,
        active INTEGER NOT NULL DEFAULT 1,
        allowAttendantToggle INTEGER NOT NULL DEFAULT 0,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // MPesa Config table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mpesa_config (
        id TEXT PRIMARY KEY,
        consumerKey TEXT NOT NULL,
        consumerSecret TEXT NOT NULL,
        passkey TEXT NOT NULL,
        shortcode TEXT NOT NULL,
        environment TEXT NOT NULL DEFAULT 'sandbox',
        enabled INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // MPesa Transactions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mpesa_transactions (
        id TEXT PRIMARY KEY,
        saleId TEXT,
        merchantRequestId TEXT NOT NULL,
        checkoutRequestId TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        resultCode TEXT,
        resultDesc TEXT,
        mpesaReceiptNumber TEXT,
        transactionDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // e-TIMS Config table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS etims_config (
        id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 0,
        pin TEXT,
        deviceSerialNumber TEXT,
        communicationKey TEXT,
        serverUrl TEXT,
        environment TEXT NOT NULL DEFAULT 'sandbox',
        autoSubmit INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // e-TIMS Invoices table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS etims_invoices (
        id TEXT PRIMARY KEY,
        saleId TEXT NOT NULL,
        invoiceNumber TEXT NOT NULL,
        cuInvoiceNumber TEXT,
        status TEXT NOT NULL,
        submittedAt TEXT,
        responseCode TEXT,
        responseMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Printer Config table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS printer_config (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT,
        port INTEGER,
        paperWidth INTEGER NOT NULL DEFAULT 80,
        enabled INTEGER NOT NULL DEFAULT 0,
        isDefault INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // App Settings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        storeName TEXT NOT NULL DEFAULT 'My Store',
        storeAddress TEXT,
        storePhone TEXT,
        storeEmail TEXT,
        storeKraPin TEXT,
        currency TEXT NOT NULL DEFAULT 'KES',
        currencySymbol TEXT NOT NULL DEFAULT 'KSh',
        taxEnabled INTEGER NOT NULL DEFAULT 1,
        taxRate REAL NOT NULL DEFAULT 0,
        taxName TEXT NOT NULL DEFAULT 'VAT',
        vatEnabled INTEGER NOT NULL DEFAULT 1,
        vatRate REAL NOT NULL DEFAULT 16,
        receiptFooter TEXT,
        receiptHeader TEXT,
        allowAttendantPriceEdit INTEGER NOT NULL DEFAULT 0,
        requirePasswordForDiscount INTEGER NOT NULL DEFAULT 1,
        lowStockThreshold INTEGER NOT NULL DEFAULT 10,
        theme TEXT NOT NULL DEFAULT 'light',
        themeConfig TEXT,
        emailProvider TEXT,
        emailApiKey TEXT,
        emailFrom TEXT,
        smtpHost TEXT,
        smtpPort INTEGER,
        smtpUser TEXT,
        smtpPassword TEXT,
        defaultSaleType TEXT NOT NULL DEFAULT 'retail',
        allowSplitPayments INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Audit Logs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        oldValue TEXT,
        newValue TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Sync Queue table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        retryCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )
    `);
  }

  private seedData(): void {
    const adminId = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [adminId, 'admin@pos.com', 'admin123', 'Administrator', 'admin', now, now]);

    const attendantId = crypto.randomUUID();
    this.db.run(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [attendantId, 'attendant@pos.com', 'attendant123', 'Default Attendant', 'attendant', now, now]);

    this.db.run(`
      INSERT INTO app_settings (
        id, storeName, storeAddress, storePhone, storeEmail, storeKraPin, currency, currencySymbol,
        taxEnabled, taxRate, taxName, vatEnabled, vatRate, receiptFooter, receiptHeader,
        allowAttendantPriceEdit, requirePasswordForDiscount, lowStockThreshold,
        theme, themeConfig, defaultSaleType, allowSplitPayments, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      'My Store',
      '',
      '',
      '',
      '',
      'KES',
      'KSh',
      1,
      16,
      'VAT',
      1,
      16,
      'Thank you for shopping with us!\nGoods once sold cannot be returned.',
      '',
      0,
      1,
      10,
      'light',
      JSON.stringify({ primaryColor: '#0f172a', primaryHue: 222, primarySaturation: 47, primaryLightness: 11, borderRadius: 0.75, fontScale: 1 }),
      'retail',
      1,
      now,
      now
    ]);

    const categories = [
      { id: crypto.randomUUID(), name: 'Electronics', description: 'Electronic devices and accessories' },
      { id: crypto.randomUUID(), name: 'Groceries', description: 'Food items and household essentials' },
      { id: crypto.randomUUID(), name: 'Clothing', description: 'Apparel and fashion items' },
      { id: crypto.randomUUID(), name: 'Hardware', description: 'Tools and building materials' }
    ];

    categories.forEach(cat => {
      this.db.run(`
        INSERT INTO categories (id, name, description, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `, [cat.id, cat.name, cat.description, now, now]);
    });

    const products = [
      { name: 'Rice 5kg', sku: 'RIC-001', price: 450, wholesalePrice: 400, quantity: 100, categoryId: categories[1].id, minStockLevel: 20 },
      { name: 'Sugar 2kg', sku: 'SUG-001', price: 280, wholesalePrice: 250, quantity: 80, categoryId: categories[1].id, minStockLevel: 15 },
      { name: 'Cooking Oil 1L', sku: 'OIL-001', price: 350, wholesalePrice: 320, quantity: 60, categoryId: categories[1].id, minStockLevel: 12 },
      { name: 'Phone Charger', sku: 'CHG-001', price: 299, wholesalePrice: 250, quantity: 50, categoryId: categories[0].id, minStockLevel: 10 },
      { name: 'T-Shirt', sku: 'TSH-001', price: 499, wholesalePrice: 400, quantity: 40, categoryId: categories[2].id, minStockLevel: 8 }
    ];

    products.forEach(prod => {
      this.db.run(`
        INSERT INTO products (id, name, sku, price, wholesalePrice, quantity, categoryId, minStockLevel, taxable, taxRate, vatRate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        prod.name,
        prod.sku,
        prod.price,
        prod.wholesalePrice,
        prod.quantity,
        prod.categoryId,
        prod.minStockLevel,
        1,
        16,
        16,
        now,
        now
      ]);
    });
  }

  saveToStorage(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const array = Array.from(data);
      localStorage.setItem('pos_database', JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  exec(sql: string, params?: any[]): any {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.exec(sql, params);
  }

  run(sql: string, params?: any[]): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
  }

  // User methods
  getUserByEmail(email: string): User | null {
    const result = this.db.exec(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as User;
  }

  getUserById(id: string): User | null {
    const result = this.db.exec(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as User;
  }

  getAllUsers(): User[] {
    const result = this.db.exec(`SELECT * FROM users ORDER BY createdAt DESC`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as User[];
  }

  createUser(user: User): User {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt, resetToken, resetTokenExpiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id, user.email, user.password, user.name, user.role, now, now, user.resetToken || null, user.resetTokenExpiry || null]);
    return { ...user, createdAt: now, updatedAt: now };
  }

  updateUser(id: string, updates: Partial<User>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deleteUser(id: string): void {
    this.db.run(`DELETE FROM users WHERE id = ?`, [id]);
  }

  // Category methods
  getAllCategories(): Category[] {
    const result = this.db.exec(`SELECT * FROM categories ORDER BY name`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as Category[];
  }

  getCategoryById(id: string): Category | null {
    const result = this.db.exec(`SELECT * FROM categories WHERE id = ?`, [id]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as Category;
  }

  createCategory(category: Category): Category {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO categories (id, name, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `, [category.id, category.name, category.description || null, now, now]);
    return { ...category, createdAt: now, updatedAt: now };
  }

  updateCategory(id: string, updates: Partial<Category>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deleteCategory(id: string): void {
    this.db.run(`DELETE FROM categories WHERE id = ?`, [id]);
  }

  // Product methods
  getAllProducts(): Product[] {
    const result = this.db.exec(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.categoryId = c.id 
      ORDER BY p.name
    `);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as Product[];
  }

  getProductById(id: string): Product | null {
    const result = this.db.exec(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.categoryId = c.id 
      WHERE p.id = ?
    `, [id]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as Product;
  }

  getProductByBarcode(barcode: string): Product | null {
    const result = this.db.exec(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.categoryId = c.id 
      WHERE p.barcode = ?
    `, [barcode]);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as Product;
  }

  getLowStockProducts(): Product[] {
    const result = this.db.exec(`
      SELECT p.*, c.name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.categoryId = c.id 
      WHERE p.quantity <= p.minStockLevel
      ORDER BY p.quantity ASC
    `);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as Product[];
  }

  createProduct(product: Product): Product {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO products (id, name, description, sku, barcode, price, wholesalePrice, costPrice, quantity, minStockLevel, categoryId, taxable, taxRate, vatRate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product.id, product.name, product.description || null, product.sku, product.barcode || null,
      product.price, product.wholesalePrice || null, product.costPrice || null, product.quantity, product.minStockLevel,
      product.categoryId || null, product.taxable ? 1 : 0, product.taxRate, product.vatRate || 16, now, now
    ]);
    return { ...product, createdAt: now, updatedAt: now };
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'categoryName') {
        if (key === 'taxable') {
          sets.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deleteProduct(id: string): void {
    this.db.run(`DELETE FROM products WHERE id = ?`, [id]);
  }

  // Sale methods
  getAllSales(): Sale[] {
    const result = this.db.exec(`SELECT * FROM sales ORDER BY createdAt DESC`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => {
      const sale = this.rowToObject(result[0].columns, row) as Sale;
      sale.items = JSON.parse(sale.items as unknown as string);
      return sale;
    }) as Sale[];
  }

  getSalesByStatus(status: string): Sale[] {
    const result = this.db.exec(`SELECT * FROM sales WHERE status = ? ORDER BY createdAt DESC`, [status]);
    if (!result.length) return [];
    return result[0].values.map((row: any) => {
      const sale = this.rowToObject(result[0].columns, row) as Sale;
      sale.items = JSON.parse(sale.items as unknown as string);
      return sale;
    }) as Sale[];
  }

  getSaleById(id: string): Sale | null {
    const result = this.db.exec(`SELECT * FROM sales WHERE id = ?`, [id]);
    if (!result.length || !result[0].values.length) return null;
    const sale = this.rowToObject(result[0].columns, result[0].values[0]) as Sale;
    sale.items = JSON.parse(sale.items as unknown as string);
    return sale;
  }

  createSale(sale: Sale): Sale {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO sales (id, receiptNumber, items, subtotal, discountAmount, discountPercent, taxAmount, total, paymentMethod, saleType, mpesaTransactionId, mpesaPhoneNumber, cashReceived, changeAmount, status, heldAt, completedAt, cancelledAt, createdBy, createdByName, notes, etimsInvoiceNumber, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sale.id, sale.receiptNumber, JSON.stringify(sale.items), sale.subtotal, sale.discountAmount,
      sale.discountPercent, sale.taxAmount, sale.total, sale.paymentMethod, sale.saleType, sale.mpesaTransactionId || null,
      sale.mpesaPhoneNumber || null, sale.cashReceived || null, sale.change || null, sale.status,
      sale.heldAt || null, sale.completedAt || null, sale.cancelledAt || null, sale.createdBy,
      sale.createdByName, sale.notes || null, sale.etimsInvoiceNumber || null, now, now
    ]);
    return { ...sale, createdAt: now, updatedAt: now };
  }

  updateSale(id: string, updates: Partial<Sale>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'items') {
          sets.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else if (key === 'change') {
          sets.push('changeAmount = ?');
          values.push(value);
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE sales SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deleteSale(id: string): void {
    this.db.run(`DELETE FROM sales WHERE id = ?`, [id]);
  }

  // Discount methods
  getAllDiscounts(): Discount[] {
    const result = this.db.exec(`SELECT * FROM discounts ORDER BY createdAt DESC`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as Discount[];
  }

  getActiveDiscounts(): Discount[] {
    const now = new Date().toISOString();
    const result = this.db.exec(`
      SELECT * FROM discounts 
      WHERE active = 1 
      AND (startDate IS NULL OR startDate <= ?)
      AND (endDate IS NULL OR endDate >= ?)
      ORDER BY createdAt DESC
    `, [now, now]);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as Discount[];
  }

  createDiscount(discount: Discount): Discount {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO discounts (id, name, code, type, value, scope, minPurchase, maxDiscount, active, allowAttendantToggle, startDate, endDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      discount.id, discount.name, discount.code || null, discount.type, discount.value, discount.scope,
      discount.minPurchase || null, discount.maxDiscount || null, discount.active ? 1 : 0,
      discount.allowAttendantToggle ? 1 : 0, discount.startDate || null, discount.endDate || null, now, now
    ]);
    return { ...discount, createdAt: now, updatedAt: now };
  }

  updateDiscount(id: string, updates: Partial<Discount>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'active' || key === 'allowAttendantToggle') {
          sets.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE discounts SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deleteDiscount(id: string): void {
    this.db.run(`DELETE FROM discounts WHERE id = ?`, [id]);
  }

  // MPesa methods
  getMPesaConfig(): MPesaConfig | null {
    const result = this.db.exec(`SELECT * FROM mpesa_config LIMIT 1`);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as MPesaConfig;
  }

  saveMPesaConfig(config: MPesaConfig): void {
    const existing = this.getMPesaConfig();
    const now = new Date().toISOString();

    if (existing) {
      this.db.run(`
        UPDATE mpesa_config SET 
          consumerKey = ?, consumerSecret = ?, passkey = ?, shortcode = ?, 
          environment = ?, enabled = ?, updatedAt = ?
        WHERE id = ?
      `, [config.consumerKey, config.consumerSecret, config.passkey, config.shortcode,
      config.environment, config.enabled ? 1 : 0, now, existing.id]);
    } else {
      this.db.run(`
        INSERT INTO mpesa_config (id, consumerKey, consumerSecret, passkey, shortcode, environment, enabled, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [config.id, config.consumerKey, config.consumerSecret, config.passkey, config.shortcode,
      config.environment, config.enabled ? 1 : 0, now, now]);
    }
  }

  // e-TIMS methods
  getETimsConfig(): ETimsConfig | null {
    const result = this.db.exec(`SELECT * FROM etims_config LIMIT 1`);
    if (!result.length || !result[0].values.length) return null;
    const config = this.rowToObject(result[0].columns, result[0].values[0]) as ETimsConfig;
    config.enabled = !!config.enabled;
    config.autoSubmit = !!config.autoSubmit;
    return config;
  }

  saveETimsConfig(config: Partial<ETimsConfig>): void {
    const existing = this.getETimsConfig();
    const now = new Date().toISOString();

    if (existing) {
      this.db.run(`
        UPDATE etims_config SET 
          enabled = ?, pin = ?, deviceSerialNumber = ?, communicationKey = ?, serverUrl = ?, environment = ?, autoSubmit = ?, updatedAt = ?
        WHERE id = ?
      `, [config.enabled ? 1 : 0, config.pin, config.deviceSerialNumber, config.communicationKey,
      config.serverUrl, config.environment, config.autoSubmit ? 1 : 0, now, existing.id]);
    } else {
      const id = crypto.randomUUID();
      this.db.run(`
        INSERT INTO etims_config (id, enabled, pin, deviceSerialNumber, communicationKey, serverUrl, environment, autoSubmit, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, config.enabled ? 1 : 0, config.pin, config.deviceSerialNumber, config.communicationKey,
        config.serverUrl, config.environment, config.autoSubmit ? 1 : 0, now, now]);
    }
  }

  createETimsInvoice(invoice: ETimsInvoice): void {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO etims_invoices (id, saleId, invoiceNumber, cuInvoiceNumber, status, submittedAt, responseCode, responseMessage, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice.id, invoice.saleId, invoice.invoiceNumber, invoice.cuInvoiceNumber || null,
      invoice.status, invoice.submittedAt || null, invoice.responseCode || null,
      invoice.responseMessage || null, now, now
    ]);
  }

  updateETimsInvoice(id: string, updates: Partial<ETimsInvoice>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE etims_invoices SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  // Printer methods
  getAllPrinters(): PrinterConfig[] {
    const result = this.db.exec(`SELECT * FROM printer_config ORDER BY createdAt DESC`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as PrinterConfig[];
  }

  getDefaultPrinter(): PrinterConfig | null {
    const result = this.db.exec(`SELECT * FROM printer_config WHERE isDefault = 1 LIMIT 1`);
    if (!result.length || !result[0].values.length) return null;
    return this.rowToObject(result[0].columns, result[0].values[0]) as PrinterConfig;
  }

  createPrinter(printer: PrinterConfig): void {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO printer_config (id, name, type, address, port, paperWidth, enabled, isDefault, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      printer.id, printer.name, printer.type, printer.address || null, printer.port || null,
      printer.paperWidth, printer.enabled ? 1 : 0, printer.isDefault ? 1 : 0, now, now
    ]);
  }

  updatePrinter(id: string, updates: Partial<PrinterConfig>): void {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        if (key === 'enabled' || key === 'isDefault') {
          sets.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    this.db.run(`UPDATE printer_config SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  deletePrinter(id: string): void {
    this.db.run(`DELETE FROM printer_config WHERE id = ?`, [id]);
  }

  // // Settings methods
  // getSettings(): AppSettings {
  //   const result = this.db.exec(`SELECT * FROM app_settings LIMIT 1`);
  //   if (!result.length || !result[0].values.length) {
  //     return {
  //       id: crypto.randomUUID(),
  //       storeName: 'My Store',
  //       storeAddress: '',
  //       storePhone: '',
  //       storeEmail: '',
  //       storeKraPin: '',
  //       currency: 'KES',
  //       currencySymbol: 'KSh',
  //       taxEnabled: true,
  //       taxRate: 16,
  //       taxName: 'VAT',
  //       vatEnabled: true,
  //       vatRate: 16,
  //       receiptFooter: 'Thank you for your business!',
  //       receiptHeader: '',
  //       allowAttendantPriceEdit: false,
  //       requirePasswordForDiscount: true,
  //       lowStockThreshold: 10,
  //       theme: 'light',
  //       themeConfig: { primaryColor: '#0f172a', primaryHue: 222, primarySaturation: 47, primaryLightness: 11, borderRadius: 0.75, fontScale: 1 },
  //       defaultSaleType: 'retail',
  //       allowSplitPayments: true,
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString()
  //     };
  //   }
  //   const settings = this.rowToObject(result[0].columns, result[0].values[0]) as AppSettings;
  //   settings.taxEnabled = !!settings.taxEnabled;
  //   settings.vatEnabled = !!settings.vatEnabled;
  //   settings.allowAttendantPriceEdit = !!settings.allowAttendantPriceEdit;
  //   settings.requirePasswordForDiscount = !!settings.requirePasswordForDiscount;
  //   return settings;
  // }
  // In Database class
  getSettings(): AppSettings {
    const result = this.db.exec(`SELECT * FROM app_settings LIMIT 1`);
    if (!result.length || !result[0].values.length) {
      return {
        id: crypto.randomUUID(),
        storeName: 'My Store',
        storeAddress: '',
        storePhone: '',
        storeEmail: '',
        storeKraPin: '',
        currency: 'KES',
        currencySymbol: 'KSh',
        taxEnabled: true,
        taxRate: 16,
        taxName: 'VAT',
        vatEnabled: true,
        vatRate: 16,
        receiptFooter: 'Thank you for your business!',
        receiptHeader: '',
        allowAttendantPriceEdit: false,
        requirePasswordForDiscount: true,
        lowStockThreshold: 10,
        theme: 'light',
        themeConfig: { primaryColor: '#0f172a', primaryHue: 222, primarySaturation: 47, primaryLightness: 11, borderRadius: 0.75, fontScale: 1 },
        defaultSaleType: 'retail',
        allowSplitPayments: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    const settings = this.rowToObject(result[0].columns, result[0].values[0]) as AppSettings;

    // Parse themeConfig from JSON string
    if (settings.themeConfig && typeof settings.themeConfig === 'string') {
      try {
        settings.themeConfig = JSON.parse(settings.themeConfig);
      } catch (error) {
        console.error('Failed to parse themeConfig:', error);
        settings.themeConfig = { primaryColor: '#0f172a', primaryHue: 222, primarySaturation: 47, primaryLightness: 11, borderRadius: 0.75, fontScale: 1 };
      }
    }

    settings.taxEnabled = !!settings.taxEnabled;
    settings.vatEnabled = !!settings.vatEnabled;
    settings.allowAttendantPriceEdit = !!settings.allowAttendantPriceEdit;
    settings.requirePasswordForDiscount = !!settings.requirePasswordForDiscount;
    settings.allowSplitPayments = !!settings.allowSplitPayments;

    return settings;
  }

  updateSettings(updates: Partial<AppSettings>): void {
    const existing = this.getSettings();
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        if (['taxEnabled', 'vatEnabled', 'allowAttendantPriceEdit', 'requirePasswordForDiscount', 'allowSplitPayments'].includes(key)) {
          sets.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key === 'themeConfig') {
          sets.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          sets.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (sets.length === 0) return;

    sets.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(existing.id);

    this.db.run(`UPDATE app_settings SET ${sets.join(', ')} WHERE id = ?`, values);
  }

  // Audit log methods
  createAuditLog(log: AuditLog): void {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO audit_logs (id, action, entityType, entityId, userId, userName, oldValue, newValue, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      log.id, log.action, log.entityType, log.entityId, log.userId, log.userName,
      log.oldValue || null, log.newValue || null, now
    ]);
  }

  getAuditLogs(limit: number = 100): AuditLog[] {
    const result = this.db.exec(`SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ?`, [limit]);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as AuditLog[];
  }

  // Sync queue methods
  addToSyncQueue(queue: SyncQueue): void {
    const now = new Date().toISOString();
    this.db.run(`
      INSERT INTO sync_queue (id, action, entityType, entityId, data, retryCount, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [queue.id, queue.action, queue.entityType, queue.entityId, queue.data, queue.retryCount, now]);
  }

  getSyncQueue(): SyncQueue[] {
    const result = this.db.exec(`SELECT * FROM sync_queue ORDER BY createdAt ASC`);
    if (!result.length) return [];
    return result[0].values.map((row: any) => this.rowToObject(result[0].columns, row)) as SyncQueue[];
  }

  removeFromSyncQueue(id: string): void {
    this.db.run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }

  incrementRetryCount(id: string): void {
    this.db.run(`UPDATE sync_queue SET retryCount = retryCount + 1 WHERE id = ?`, [id]);
  }

  // Helper method
  private rowToObject(columns: string[], row: any[]): any {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  }

  // Export database
  exportDatabase(): Uint8Array {
    return this.db.export();
  }

  // Import database
  importDatabase(data: Uint8Array): void {
    this.db = new this.SQL.Database(data);
    this.saveToStorage();
  }

  // Reset database
  resetDatabase(): void {
    localStorage.removeItem('pos_database');
    this.db = new this.SQL.Database();
    this.createTables();
    this.seedData();
    this.saveToStorage();
  }
}

export const db = new Database();
export const initDatabase = () => db.init();
