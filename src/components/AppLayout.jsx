import React, { useState } from 'react';
import { 
  LayoutDashboard, Calculator, Truck, FileText, FileCheck, CornerUpLeft, 
  Droplet, Factory, Activity, ShieldCheck, ShoppingCart, ClipboardList, 
  BookOpen, Wallet, PieChart, AlertOctagon, Briefcase, Users, Wrench, 
  BarChart3, Database, LogOut, Menu, X, DollarSign, ThermometerSun, 
  UserCheck, Beaker
} from 'lucide-react';

// --- IMPORTS: All 27 Modules & System Components ---
import Toast from './Toast';
import Dashboard from './Dashboard';
import QuotationsScreen from './QuotationsScreen';
import OrderDispatchBoard from './OrderDispatchBoard';
import DeliveryChallan from './DeliveryChallanScreen';
import InvoiceScreen from './InvoiceScreen';
import SalesReturnScreen from './SalesReturnScreen';
import FuelLogScreen from './FuelLogScreen';
import LiveInventory from './LiveInventoryScreen';
import ProductionScreen from './ProductionScreen';
import SecurityGatePass from './SecurityGatePassScreen';
import ProcurementScreen from './ProcurementScreen';
import PurchaseOrderScreen from './PurchaseOrderScreen';
import PartyLedger from './PartyLedger';
import VoucherScreen from './VouchersScreen';
import DailyCashBook from './DailyCashBook';
import ExpensesPnL from './ExpensesPnL';
import DebtorsAging from './DebtorsAgingScreen';
import PDCManager from './PDCManager';
import PayrollScreen from './PayrollScreen';
import FleetMaintenance from './FleetMaintenance';
import ReportingScreen from './ReportingScreen';
import MasterData from './MasterData';
import AttendanceRegister from './AttendanceRegister';
import CuringLog from './CuringLog';
import RecipeBuilder from './RecipeBuilder';

export default function AppLayout({ onLogout }) {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- NAVIGATION CONFIGURATION ---
  const navigation = [
    { section: 'Main', items: [
      { id: 'dashboard', name: 'Master Dashboard', icon: LayoutDashboard },
    ]},
    { section: 'Sales & Logistics', items: [
      { id: 'quotations', name: 'Sales & Quotations', icon: Calculator },
      { id: 'dispatch', name: 'Order & Dispatch Board', icon: Truck },
      { id: 'challan', name: 'Delivery Challans', icon: FileText },
      { id: 'invoices', name: 'Tax Invoices', icon: FileCheck },
      { id: 'returns', name: 'Sales Returns (Credit Notes)', icon: CornerUpLeft },
      { id: 'gatepass', name: 'Security Gate Pass', icon: ShieldCheck },
    ]},
    { section: 'Production & Inventory', items: [
      { id: 'inventory', name: 'Live Inventory', icon: Activity },
      { id: 'production', name: 'Yard Production', icon: Factory },
      { id: 'curing', name: 'QC & Curing Log', icon: ThermometerSun },
      { id: 'fuel', name: 'Diesel & Fuel Logs', icon: Droplet },
    ]},
    { section: 'Procurement', items: [
      { id: 'purchaseorders', name: 'Purchase Orders', icon: ClipboardList },
      { id: 'procurement', name: 'Procurement (Inbound)', icon: ShoppingCart },
    ]},
    { section: 'Finance & Accounting', items: [
      { id: 'ledger', name: 'Party Ledger (Khata)', icon: BookOpen },
      { id: 'vouchers', name: 'Cash & Bank Vouchers', icon: Wallet },
      { id: 'cashbook', name: 'Daily Cash Book', icon: DollarSign },
      { id: 'pnl', name: 'General Expenses & P&L', icon: PieChart },
      { id: 'aging', name: 'Debtors Aging Report', icon: AlertOctagon },
      { id: 'pdc', name: 'Cheque & PDC Manager', icon: Briefcase },
    ]},
    { section: 'HR & Operations', items: [
      { id: 'attendance', name: 'Daily Attendance', icon: UserCheck },
      { id: 'payroll', name: 'Payroll & Advances', icon: Users },
      { id: 'fleet', name: 'Fleet Maintenance', icon: Wrench },
      { id: 'reports', name: 'Management Reports', icon: BarChart3 },
    ]},
    { section: 'System', items: [
      { id: 'masterdata', name: 'Master Data Manager', icon: Database },
      { id: 'recipes', name: 'Recipe Builder (BOM)', icon: Beaker },
    ]}
  ];

  // --- ROUTER ---
  const renderContent = () => {
    switch (activeScreen) {
      case 'quotations': return <QuotationsScreen />;
      case 'dispatch': return <OrderDispatchBoard />;
      case 'challan': return <DeliveryChallan />;
      case 'invoices': return <InvoiceScreen />;
      case 'returns': return <SalesReturnScreen />;
      case 'gatepass': return <SecurityGatePass />;
      case 'inventory': return <LiveInventory />;
      case 'production': return <ProductionScreen />;
      case 'curing': return <CuringLog />;
      case 'fuel': return <FuelLogScreen />;
      case 'purchaseorders': return <PurchaseOrderScreen />;
      case 'procurement': return <ProcurementScreen />;
      case 'ledger': return <PartyLedger />;
      case 'vouchers': return <VoucherScreen />;
      case 'cashbook': return <DailyCashBook />;
      case 'pnl': return <ExpensesPnL />;
      case 'aging': return <DebtorsAging />;
      case 'pdc': return <PDCManager />;
      case 'attendance': return <AttendanceRegister />;
      case 'payroll': return <PayrollScreen />;
      case 'fleet': return <FleetMaintenance />;
      case 'reports': return <ReportingScreen />;
      case 'masterdata': return <MasterData />;
      case 'recipes': return <RecipeBuilder />;
      case 'dashboard': return <Dashboard onNavigate={setActiveScreen} />;
      default: return <Dashboard onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar - print:hidden ensures it doesn't show on printed invoices */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* CONMIX LOGO BUTTON (Sleeker Version) */}
        <div className="pt-6 pb-4 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-center">
          <button 
            onClick={() => {
              setActiveScreen('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="flex flex-col items-center group cursor-pointer focus:outline-none w-full"
          >
            {/* Thinner padding, slightly smaller size, softer corners */}
            <div className="bg-white p-1 rounded-xl flex justify-center items-center shadow-lg shadow-black/40 group-hover:scale-105 transition-transform duration-300 ease-out mb-3 border border-slate-700">
              <img 
                src="/conmix-logo.png" 
                alt="Conmix Construction" 
                className="w-24 h-24 object-contain rounded-lg"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                Master Control
              </p>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navigation.map((group, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {group.section}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveScreen(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {item.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Secure Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 relative">
        {renderContent()}
      </div>

      {/* Global Pro Notifications */}
      <Toast />

    </div>
  );
}