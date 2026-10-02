import React from 'react';
import { 
  LayoutDashboard, Truck, Factory, Calculator, FileText, FileCheck, 
  CornerUpLeft, ShieldCheck, Activity, Droplet, ClipboardList, 
  ShoppingCart, BookOpen, Wallet, DollarSign, PieChart, AlertOctagon, 
  Briefcase, Users, Wrench, Database, Beaker, ThermometerSun, 
  UserCheck, ChevronRight, X, LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, onNavigate, isOpen, setIsOpen, onLogout }) {
  
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { id: 'dashboard', name: 'Executive Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: "Sales & Outbound",
      items: [
        { id: 'quotations', name: 'Quotations & Estimates', icon: Calculator },
        { id: 'dispatch', name: 'Order & Dispatch Board', icon: Truck },
        { id: 'challan', name: 'Delivery Challans', icon: FileText },
        { id: 'invoices', name: 'Commercial Invoices', icon: FileCheck },
        { id: 'returns', name: 'Sales Returns (Credit)', icon: CornerUpLeft },
      ]
    },
    {
      title: "Yard & Production",
      items: [
        { id: 'inventory', name: 'Live Inventory', icon: Activity },
        { id: 'recipes', name: 'Recipe Builder (BOM)', icon: Beaker },
        { id: 'production', name: 'Yard Production', icon: Factory },
        { id: 'curing', name: 'QC & Curing Log', icon: ThermometerSun },
      ]
    },
    {
      title: "Procurement",
      items: [
        { id: 'purchaseorders', name: 'Purchase Orders', icon: ClipboardList },
        { id: 'procurement', name: 'Inbound Receiving', icon: ShoppingCart },
      ]
    },
    {
      title: "Finance & Accounts",
      items: [
        { id: 'ledger', name: 'Party Ledger (Khata)', icon: BookOpen },
        { id: 'vouchers', name: 'Cash/Bank Vouchers', icon: Wallet },
        { id: 'cashbook', name: 'Daily Cash Book', icon: DollarSign },
        { id: 'pdc', name: 'PDC & Cheques', icon: Briefcase },
        { id: 'payment-verification', name: 'Payment Verification', icon: ShieldCheck },
        { id: 'aging', name: 'Debtors Aging', icon: AlertOctagon },
        { id: 'reports', name: 'Financial Reports', icon: PieChart },
        { id: 'pnl', name: 'Expenses & P&L', icon: Activity },
      ]
    },
    {
      title: "HR & Maintenance",
      items: [
        { id: 'employees', name: 'Employee Master', icon: UserCheck },
        { id: 'payroll', name: 'Payroll & Advances', icon: Users },
        { id: 'attendance', name: 'Daily Attendance', icon: Users },
        { id: 'fleet', name: 'Fleet Maintenance', icon: Wrench },
        { id: 'fuel', name: 'Diesel & Fuel Logs', icon: Droplet },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: 'masterdata', name: 'Master Data', icon: Database },
        { id: 'gatepass', name: 'Security Terminal', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header with Logo from Public Folder */}
        <div className="h-20 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-blue-900/20">
              <img 
                src="/logo.png" 
                alt="Conmix Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide uppercase leading-tight">Conmix</h2>
              <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Gadap Town, KHI</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Menu */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-8">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-3 mb-3">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onNavigate(item.id);
                          if (window.innerWidth < 1024) setIsOpen(false); // Close on mobile
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-sm font-semibold tracking-wide flex-grow text-left">
                          {item.name}
                        </span>
                        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border-2 border-blue-500">
                <UserCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">System Admin</p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            
            {/* The Logout Button */}
            <button 
              onClick={onLogout} 
              title="Log Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            
          </div>
        </div>

      </div>
    </>
  );
}