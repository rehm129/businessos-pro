# BusinessOS Pro — Enterprise Local-First Desktop & Web Business Management Suite

BusinessOS Pro is an enterprise-grade, local-first desktop and web application designed for supermarkets, retail counters, apparel stores, mobile & electronics shops, wholesale distributors, and service businesses.

Built with React 19, TypeScript, Electron, Vite, Tailwind CSS, and SQLite (WASM/C Engine).

---

## 📌 Key Features

- 🛒 Fast POS Register: Barcode scanning, keyboard quick keys (F1, F2, F3, F4), line-item discounts, split cash/card payments, customer credit, and 80mm thermal receipt printing.
- 📦 Inventory & Stock Tracking: SKU management, category organization, margin calculation, stock movement logs, and strict negative inventory protection.
- 🚚 Purchases & Supplier Management: Vendor profiles, PO generation, and 1-click stock receiving that updates current stock and cost atomically.
- 👥 Customer Accounts & Ledger: Profiles, sales history, customer due tracking, credit limits, and payment receipts.
- 📊 Financial & Accrual Engine: Real-time P&L reporting, Cost of Goods Sold (COGS) tracking, operating expense logging, and till cash reconciliation.
- 🔐 Security & Safety: PBKDF2 authentication, zero plaintext passwords, offline storage, and atomic database transactions (`BEGIN TRANSACTION ... COMMIT`).
- 📁 Backup & Recovery: Local SQLite database exports, pre-restore automated snapshots, and binary integrity validation (`PRAGMA integrity_check`).

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 20 or higher)
- `npm` or `bun`

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone [https://github.com/your-username/businessos-pro.git](https://github.com/your-username/businessos-pro.git)
cd businessos-pro
npm install
