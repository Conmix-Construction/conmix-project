import React, { useState } from 'react';
import { Menu, Lock, User, ArrowRight, Building, Shield, AlertCircle } from 'lucide-react';

// --- GLOBAL UTILITIES ---
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// --- ALL ERP MODULE SCREENS (MATCHING EXACT FILENAMES) ---
import PaymentVerification from './components/PaymentVerification';
import DashboardScreen from './components/Dashboard';
import QuotationsScreen from './components/QuotationsScreen';
import DispatchBoard from './components/DispatchBoard'; 
import DeliveryChallanScreen from './components/DeliveryChallanScreen';
import InvoiceScreen from './components/InvoiceScreen';
import SalesReturnScreen from './components/SalesReturnScreen';
import LiveInventoryScreen from './components/LiveInventoryScreen';
import RecipeBuilder from './components/RecipeBuilder';
import ProductionScreen from './components/ProductionScreen';
import CuringLog from './components/CuringLog'; 
import PurchaseOrderScreen from './components/PurchaseOrderScreen';
import ProcurementScreen from './components/ProcurementScreen';
import PartyLedger from './components/PartyLedger'; 
import VouchersScreen from './components/VouchersScreen';
import DailyCashBook from './components/DailyCashBook'; 
import PDCManager from './components/PDCManager';
import DebtorsAgingScreen from './components/DebtorsAgingScreen';
import ReportingScreen from './components/ReportingScreen';
import ExpensesPnL from './components/ExpensesPnL';
import EmployeeManager from './components/EmployeeManager';
import PayrollScreen from './components/PayrollScreen';
import AttendanceRegister from './components/AttendanceRegister';
import FleetMaintenance from './components/FleetMaintenance'; 
import FuelLogScreen from './components/FuelLogScreen';
import MasterData from './components/MasterData'; 
import SecurityGatePassScreen from './components/SecurityGatePassScreen';

export default function App() {
  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);

  // --- 1. PREMIUM GLASSMORPHISM LOGIN SCREEN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center lg:justify-end p-6 lg:pr-24 relative font-sans selection:bg-blue-900 selection:text-white"
      >
        {/* User's Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/Insulated block.png')` }}
        ></div>
        
        {/* Subtle dark gradient overlay to ensure the login text is readable without hiding the background blocks */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-slate-900/40 to-slate-900/90"></div>

        {/* Floating Glassmorphism Login Card */}
        <div className="w-full max-w-[400px] relative z-10 animate-in fade-in slide-in-from-right-8 duration-1000">
          
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="p-8 sm:p-10">
              
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Login</h1>
                <p className="text-xs text-slate-600 mt-2 font-bold uppercase tracking-[0.15em]">Conmix Operations Hub</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={loginForm.username}
                      onChange={(e) => { setLoginForm({...loginForm, username: e.target.value}); setLoginError(false); }}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder-slate-400 backdrop-blur-sm shadow-inner"
                      placeholder="Enter ID"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Security Key</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => { setLoginForm({...loginForm, password: e.target.value}); setLoginError(false); }}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder-slate-400 backdrop-blur-sm shadow-inner"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-700 bg-red-100/80 backdrop-blur-md p-3 rounded-xl border border-red-200 animate-in zoom-in-95 duration-200">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">Authentication failed.</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-slate-900/20 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-[0.98]"
                  >
                    ACCESS SYSTEM <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
            
            {/* Card Footer */}
            <div className="px-8 py-5 bg-slate-900/5 backdrop-blur-md border-t border-white/20 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <p className="text-[10px] text-slate-700 font-black tracking-widest uppercase">
                Gadap Town, Karachi
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. DYNAMIC ROUTER ---
  const renderContent = () => {
    switch (activeTab) {
      // Overview
      case 'dashboard': return <DashboardScreen onNavigate={setActiveTab} />;
      
      // Sales & Outbound
      case 'quotations': return <QuotationsScreen />;
      case 'dispatch': return <DispatchBoard />;
      case 'challan': return <DeliveryChallanScreen />;
      case 'invoices': return <InvoiceScreen />;
      case 'returns': return <SalesReturnScreen />;
      
      // Yard & Production
      case 'inventory': return <LiveInventoryScreen />;
      case 'recipes': return <RecipeBuilder />;
      case 'production': return <ProductionScreen />;
      case 'curing': return <CuringLog />;
      
      // Procurement
      case 'purchaseorders': return <PurchaseOrderScreen />;
      case 'procurement': return <ProcurementScreen />;
      
      // Finance & Accounts
      case 'ledger': return <PartyLedger />;
      case 'vouchers': return <VouchersScreen />;
      case 'cashbook': return <DailyCashBook />;
      case 'pdc': return <PDCManager />;
      case 'payment-verification': return <PaymentVerification />; // Added right here!
      case 'aging': return <DebtorsAgingScreen />;
      case 'reports': return <ReportingScreen />;
      case 'pnl': return <ExpensesPnL />;
      
      // HR & Maintenance
      case 'employees': return <EmployeeManager />;
      case 'payroll': return <PayrollScreen />;
      case 'attendance': return <AttendanceRegister />;
      case 'fleet': return <FleetMaintenance />;
      case 'fuel': return <FuelLogScreen />;
      
      // Administration
      case 'masterdata': return <MasterData />;
      case 'gatepass': return <SecurityGatePassScreen />;
      
      // Fallback for missing/typo routes
      default: 
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="text-center">
              <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Module Under Construction</h2>
              <p className="text-slate-500">The <b>{activeTab}</b> module is currently being developed.</p>
            </div>
          </div>
        );
    }
  };

  // --- 3. MAIN ERP LAYOUT ---
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Global Toast Notification Component */}
      <Toast />

      {/* Sidebar Component */}
      <Sidebar 
        activeTab={activeTab} 
        onNavigate={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onLogout={() => setIsAuthenticated(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-900 text-white h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm">CMX</div>
            <span className="font-bold tracking-wide uppercase text-sm">Conmix ERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}