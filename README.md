# BusinessOS Pro — Enterprise Windows Desktop & Web Business Management Suite

**BusinessOS Pro** is a high-performance, local-first business management application designed for supermarkets, garments/apparel stores, mobile & electronics shops, wholesale distributors, small retail counters, and service-oriented businesses.

Built with **React 19, TypeScript, Electron, Vite, Tailwind CSS, and SQLite (WASM/C engine)**.

---

## 1. Key Architectural Principles

- **100% Local-First & Offline Ready:** Zero cloud telemetry, no mandatory subscriptions, no internet connection required for core operations.
- **Accurate Financial Accrual Engine:** Gross Sales minus Item Discounts yields Net Revenue. Cost of Goods Sold (COGS) tracks actual acquisition costs at the moment of sale. Gross Profit minus Operating Expenses calculates Net Operating Profit.
- **Strict Negative Inventory Protection:** Prohibits negative stock in accordance with configured store policy, preventing inventory discrepancies.
- **Transaction Safety & Atomicity:** Sales, refunds/returns, purchases, and stock movements are executed inside atomic SQLite transactions (`BEGIN TRANSACTION ... COMMIT / ROLLBACK`).
- **Cryptographic Security:** 100,000-iteration PBKDF2 with HMAC-SHA-256 and unique 16-byte random salts. Zero plaintext passwords.
- **Non-Destructive Storage:** Data is stored strictly outside the application binary directory in the user profile AppData folder. Upgrades, reinstalls, or uninstalls do not delete business records.

---

## 2. Windows Desktop Storage & Data Preservation

### Live Database Path
In the Windows Electron release, the active SQLite 3 database is located at:
```
%APPDATA%\BusinessOS-Pro\businessos-pro.sqlite
```
(typically `C:\Users\<Username>\AppData\Roaming\BusinessOS-Pro\businessos-pro.sqlite`).

### Upgrade & Reinstall Safety
- When you install a new version of BusinessOS Pro using `BusinessOS-Pro-Setup.exe`, your existing database in `%APPDATA%` is left completely intact.
- Database schema migrations run automatically on startup without data loss.
- The NSIS uninstaller explicitly preserves `%APPDATA%\BusinessOS-Pro\` so accidental uninstalls never wipe historical sales or inventory.

---

## 3. Backup, Restore, and Disaster Recovery

### Creating Backups
1. Navigate to **Settings & Backups** -> **Database Backup & Integrity**.
2. Click **Download Database File (.sqlite)**.
3. A timestamped, binary-verified copy of your complete SQLite database is saved.
4. An internal safety backup is also archived locally.

### Restoring from Backup
1. Navigate to **Settings & Backups** -> **Database Backup & Integrity**.
2. Click **Select .sqlite File to Restore** or select an existing snapshot from **Internal Safety Snapshots**.
3. **Safety Guarantee:** Before overwriting the database, BusinessOS Pro creates an automated safety snapshot (`pre_restore_safety`) of the live database.
4. The system validates the `SQLite format 3` binary magic bytes and runs `PRAGMA integrity_check` before loading.

### Database Integrity Check
Run `PRAGMA integrity_check` at any time from the Settings tab to verify B-Tree indexes, page consistency, and constraint health.

---

## 4. Default Operator Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access: Settings, Backups, Users, Reports, POS, Purchases, Inventory |
| **Cashier** | `cashier` | `cashier123` | Fast POS register, customer lookups, receipt printing |

*Note: You can create new operators, change roles, or reset passwords under the **Users & Roles** tab.*

---

## 5. Development & Packaging Commands

### Web / Browser Preview
```bash
npm run dev
```
Runs the Vite development server on port 3000.

### Production Web Build
```bash
npm run build
```

### Run Vitest Automated Test Suite
```bash
npm test
```
Executes all unit, integration, transactional, and cryptographic security tests.

### Compile Electron Bundles
```bash
npm run electron:build
```
Bundles the Electron main process (`electron/main.ts`) and sandboxed preload bridge (`electron/preload.ts`) into `dist-electron/`.

### Package Windows x64 Installer
```bash
npm run build:win
```
Builds the standalone Windows 64-bit installer (`release/BusinessOS-Pro-Setup.exe`) and portable executable.

---

## 6. Commercial Licensing Architecture

BusinessOS Pro includes a modular licensing subsystem:
- Generates a local, hardware-bound Machine Identifier (e.g. `BOS-XXXX-XXXX-XXXX`).
- Supports offline cryptographic key activation (format `BOS-PRO-YYYY-XXXX`).
- License validation logic is isolated in `src/services/licensing-service.ts`, ensuring that core POS, inventory, and ledger operations remain completely functional offline regardless of network connectivity.

---

## 7. Supported Modules Summary

1. **Dashboard:** Live daily KPIs, accrual profit counter, low-stock warnings, and Recharts 7-day trend.
2. **POS Register:** Instant barcode scanning, keyboard quick keys (F1, F2, F3, F4), line discounts, split cash/card payments, customer store credit, and 80mm thermal receipt printing.
3. **Sale Returns & Refunds:** Partial/full returns, restock toggle, reason logging, and ledger adjustment.
4. **Products & Inventory:** Categories, barcode/SKU uniqueness, units of measure, purchase cost vs selling price margins, and stock movement audit log.
5. **Purchases & Suppliers:** Vendor profiles, PO generation, and 1-click stock receiving that updates inventory current_stock and cost atomically.
6. **Customer Accounts:** Profiles, sales history, customer due tracking, credit limits, and payment receipts.
7. **Expenses & Cash Register:** Operating expense tracking, opening cash float, expected till cash formula, actual counted cash, and variance discrepancy recording.
8. **Reports & CSV:** Accrual P&L statements, inventory valuation summary, bestselling products ranking, and RFC 4180 CSV exports with UTF-8 BOM.
