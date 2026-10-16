import { describe, it, expect, beforeAll } from 'vitest';
import { sqliteService } from '../src/db/sqlite-service';
import { inventoryService } from '../src/services/inventory-service';
import { posService } from '../src/services/pos-service';
import { supplierService } from '../src/services/supplier-service';
import { customerService } from '../src/services/customer-service';
import { reportingService } from '../src/services/reporting-service';
import { authService } from '../src/services/auth-service';
import { verifyPassword } from '../src/utils/crypto';

describe('BusinessOS Pro - Core Engine & Business Logic Tests', () => {
  beforeAll(async () => {
    await sqliteService.init();
  });

  it('verifies SQLite database integrity passes', () => {
    const integrity = sqliteService.checkIntegrity();
    expect(integrity.ok).toBe(true);
    expect(integrity.rows).toContain('ok');
  });

  it('verifies product creation, SKU uniqueness, and stock movement recording', () => {
    const uniqueSku = `TEST-SKU-${Date.now()}`;
    const uniqueBarcode = `999${Date.now()}`;
    const categories = inventoryService.getCategories();
    expect(categories.length).toBeGreaterThan(0);

    const product = inventoryService.createProduct(
      {
        name: 'Unit Test Espresso Beans',
        sku: uniqueSku,
        barcode: uniqueBarcode,
        categoryId: categories[0].id,
        purchaseCost: 10.0,
        sellingPrice: 20.0,
        initialStock: 50,
        minStockThreshold: 10,
      },
      'Test Suite'
    );

    expect(product.id).toBeDefined();
    expect(product.currentStock).toBe(50);

    // Duplicate SKU should throw
    expect(() => {
      inventoryService.createProduct(
        {
          name: 'Duplicate SKU Item',
          sku: uniqueSku,
          barcode: `BAR-${Date.now()}`,
          categoryId: categories[0].id,
          purchaseCost: 5,
          sellingPrice: 10,
        },
        'Test Suite'
      );
    }).toThrow();

    // Verify stock movement was recorded
    const movements = inventoryService.getStockMovements(product.id);
    expect(movements.length).toBe(1);
    expect(movements[0].movementType).toBe('opening_stock');
    expect(movements[0].quantityChange).toBe(50);
  });

  it('executes atomic sale checkout, deducting stock and calculating exact accrual profit', () => {
    const uniqueSku = `POS-SALE-${Date.now()}`;
    const cat = inventoryService.getCategories()[0];

    const prod = inventoryService.createProduct(
      {
        name: 'Sale Checkout Test Item',
        sku: uniqueSku,
        barcode: `BC-${Date.now()}`,
        categoryId: cat.id,
        purchaseCost: 15.0,
        sellingPrice: 30.0,
        initialStock: 20,
      },
      'Test Suite'
    );

    const sale = posService.checkout({
      items: [{ productId: prod.id, quantity: 2, unitPrice: 30.0, discountPercent: 0 }],
      paymentMethod: 'cash',
      amountPaid: 70.0,
      cashierId: 'usr_admin',
      cashierName: 'Admin',
    });

    expect(sale.receiptNumber).toMatch(/^REC-/);
    expect(sale.grandTotal).toBeGreaterThanOrEqual(60.0);
    // Cost: 2 * 15 = 30. Subtotal: 60. Gross Profit: 60 - 30 = 30
    expect(sale.costTotal).toBe(30.0);
    expect(sale.estimatedProfit).toBe(30.0);

    // Verify stock decreased from 20 to 18
    const updatedProd = inventoryService.getProductById(prod.id);
    expect(updatedProd?.currentStock).toBe(18);

    // Verify sale movement in audit trail
    const movements = inventoryService.getStockMovements(prod.id);
    const saleMove = movements.find((m) => m.movementType === 'sale');
    expect(saleMove).toBeDefined();
    expect(saleMove?.quantityChange).toBe(-2);
    expect(saleMove?.stockAfter).toBe(18);
  });

  it('rejects sale and rolls back transaction if stock is insufficient when negative stock is prohibited', () => {
    const uniqueSku = `OUT-OF-STOCK-${Date.now()}`;
    const cat = inventoryService.getCategories()[0];

    const prod = inventoryService.createProduct(
      {
        name: 'Zero Stock Item',
        sku: uniqueSku,
        barcode: `ZERO-${Date.now()}`,
        categoryId: cat.id,
        purchaseCost: 5,
        sellingPrice: 10,
        initialStock: 1,
      },
      'Test Suite'
    );

    // Requesting 5 when only 1 is available
    expect(() => {
      posService.checkout({
        items: [{ productId: prod.id, quantity: 5, unitPrice: 10 }],
        paymentMethod: 'cash',
        amountPaid: 50,
        cashierId: 'usr_admin',
        cashierName: 'Admin',
      });
    }).toThrow(/Insufficient stock/);

    // Stock must remain intact at 1
    const pAfter = inventoryService.getProductById(prod.id);
    expect(pAfter?.currentStock).toBe(1);
  });

  it('processes sale returns and restocks items correctly', () => {
    const cat = inventoryService.getCategories()[0];
    const prod = inventoryService.createProduct(
      {
        name: 'Returnable Item',
        sku: `RET-${Date.now()}`,
        barcode: `BAR-RET-${Date.now()}`,
        categoryId: cat.id,
        purchaseCost: 20,
        sellingPrice: 50,
        initialStock: 10,
      },
      'Test Suite'
    );

    // Sell 3 items (stock becomes 7)
    const sale = posService.checkout({
      items: [{ productId: prod.id, quantity: 3, unitPrice: 50 }],
      paymentMethod: 'cash',
      amountPaid: 200,
      cashierId: 'usr_admin',
      cashierName: 'Admin',
    });

    expect(inventoryService.getProductById(prod.id)?.currentStock).toBe(7);

    // Return 1 item with restocking
    const ret = posService.processReturn({
      saleId: sale.id,
      items: [{ productId: prod.id, quantity: 1 }],
      reason: 'Wrong size',
      restockItems: true,
      processedBy: 'Admin',
    });

    expect(ret.refundTotal).toBeGreaterThan(0);
    // Stock should be restored to 8 (7 + 1)
    expect(inventoryService.getProductById(prod.id)?.currentStock).toBe(8);

    // Audit log should include 'sale_return'
    const movements = inventoryService.getStockMovements(prod.id);
    expect(movements.some((m) => m.movementType === 'sale_return')).toBe(true);
  });

  it('creates purchase orders and receives stock replenishing inventory', () => {
    const suppliers = supplierService.getSuppliers();
    expect(suppliers.length).toBeGreaterThan(0);
    const supplier = suppliers[0];

    const cat = inventoryService.getCategories()[0];
    const prod = inventoryService.createProduct(
      {
        name: 'PO Inflow Item',
        sku: `PO-IN-${Date.now()}`,
        barcode: `PO-BAR-${Date.now()}`,
        categoryId: cat.id,
        purchaseCost: 12,
        sellingPrice: 25,
        initialStock: 5,
      },
      'Test Suite'
    );

    // Create purchase with status 'received' for 25 units
    const purchase = supplierService.createPurchase({
      supplierId: supplier.id,
      orderDate: new Date().toISOString().slice(0, 10),
      status: 'received',
      items: [{ productId: prod.id, quantity: 25, unitCost: 12 }],
      amountPaid: 300,
      receivedByName: 'Test Admin',
    });

    expect(purchase.purchaseNumber).toMatch(/^PO-/);
    // Stock should be 5 + 25 = 30
    const prodAfter = inventoryService.getProductById(prod.id);
    expect(prodAfter?.currentStock).toBe(30);
  });

  it('verifies customer credit, balance updates, and payment reconciliation', () => {
    const customer = customerService.createCustomer({
      name: 'Test Customer Ledger',
      phone: `555-${Date.now().toString().slice(-4)}`,
      creditLimit: 1000,
    });

    expect(customer.currentBalance).toBe(0);

    // Record payment of $50 towards due
    const payment = customerService.recordPayment(
      customer.id,
      50,
      'cash',
      'REC-001',
      'Deposit payment',
      'Admin'
    );

    expect(payment.amount).toBe(50);
    const updatedCust = customerService.getCustomerById(customer.id);
    expect(updatedCust?.currentBalance).toBe(-50); // In credit by $50
  });

  it('validates password hashing security and authentication', async () => {
    const testUsername = `user_${Date.now()}`;
    const testPassword = 'SecureSecretPassword123!';

    const created = await authService.createUser(
      testUsername,
      'Test Security Operator',
      testPassword,
      'cashier'
    );

    expect(created.id).toBeDefined();

    // Verify correct password succeeds
    const loggedIn = await authService.login(testUsername, testPassword);
    expect(loggedIn.username).toBe(testUsername.toLowerCase());

    // Verify wrong password fails
    await expect(authService.login(testUsername, 'WrongPassword123')).rejects.toThrow(
      /Invalid username or password/
    );
  });

  it('validates database binary export header and safety backup creation', async () => {
    const binary = sqliteService.exportBinary();
    expect(binary.byteLength).toBeGreaterThan(100);

    // Validate SQLite format 3 magic bytes
    const isValidHeader = sqliteService.validateSqliteHeader(binary);
    expect(isValidHeader).toBe(true);

    // Create safety backup
    const backup = await sqliteService.createSafetyBackup('manual');
    expect(backup.backupId).toBeDefined();
    expect(backup.fileSizeBytes).toBe(binary.byteLength);
    expect(backup.recordCounts.products).toBeGreaterThan(0);
  });
});
