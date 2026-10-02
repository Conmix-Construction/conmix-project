# Conmix ERP - Enterprise Resource Planning System

A comprehensive, full-stack ERP tailored specifically for construction, concrete, and block manufacturing operations. Built with the MERN stack (MongoDB, Express, React, Node.js), this system provides real-time tracking of production, logistics, sales, finance, and human resources.

## 🌟 Key Modules & Features

### 📊 Executive Dashboard
* Live financial tracking (Revenue, Receivables).
* Real-time production yields and dispatch queues.

### 🚚 Sales & Logistics
* **Delivery Challans:** Instantly generate, track, and print A4/A5 delivery dispatch tickets.
* **Invoicing & Aging:** Commercial invoice generation and intelligent Debtors Aging tracking.
* **Dispatch Board:** Live queue management for outbound trucks.

### 🏭 Yard & Production
* **Live Inventory & BOM:** Recipe builder (Bill of Materials) and automated stock deductions.
* **Production Logs:** Daily yield tracking for block machines and batching mixers.
* **QC & Curing:** Quality control and curing batch timers.

### 💰 Finance & Accounts
* **Party Ledger (Khata):** Automated debit/credit running balances for customers and suppliers with printable PDF statements.
* **Payment Verification Portal:** High-security portal for uploading, viewing, and verifying payment proofs (Bank Receipts, Cheques) with local download capabilities.
* **Expenses & P&L:** General ledger expense tracking and real-time Profit & Loss calculation.
* **Daily Cash Book & PDC:** Manage petty cash and post-dated cheques.

### 👷 HR & Maintenance
* **Payroll & Advances:** Automated piece-rate and fixed-salary processing with printable payslips.
* **Fleet Maintenance:** Track truck/machinery odometer readings, service logs, and maintenance expenses.
* **Employee Management:** Centralized staff master data and daily attendance registers.

---

## 🛠️ Technology Stack

**Frontend:**
* React.js (Hooks, Context, Functional Components)
* Tailwind CSS (Styling, Print Modifiers)
* Lucide React (Iconography)

**Backend:**
* Node.js & Express.js (RESTful API Server)
* MongoDB & Mongoose (NoSQL Database & Object Modeling)
* Multer (Secure File Uploads & Multipart Form Data)
* CORS & Dotenv (Security & Environment Variables)

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js installed on your machine.
* MongoDB installed locally or a MongoDB Atlas URI.

### 1. Backend Setup (Node.js / Express)
Navigate to your backend directory and install dependencies:
```bash
cd conmix-backend
npm install express mongoose cors dotenv multer