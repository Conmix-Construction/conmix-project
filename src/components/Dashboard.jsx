import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Truck, Factory, AlertCircle, ArrowRight, Activity, 
  FileText, DollarSign, Package, Bell, CheckCircle2, Search,
  Calculator, FileCheck, CornerUpLeft, ShieldCheck, Droplet, 
  ClipboardList, ShoppingCart, BookOpen, Wallet, PieChart, 
  AlertOctagon, Briefcase, Users, Wrench, BarChart3, Database, 
  ThermometerSun, UserCheck, Beaker, RefreshCw
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  
  // LIVE KPI STATE
  const [stats, setStats] = useState({
    revenue: 0,
    pendingDispatches: 0,
    production: 0,
    receivables: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // ROLE SWITCHER STATE
  const [currentRole, setCurrentRole] = useState('Admin View');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const availableRoles = ['Admin View', 'CEO Access', 'Yard Manager', 'Accountant'];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const allModules = [
    { id: 'quotations', name: 'Sales & Quotations', icon: Calculator },
    { id: 'dispatch', name: 'Order & Dispatch Board', icon: Truck },
    { id: 'challan', name: 'Delivery Challans', icon: FileText },
    { id: 'invoices', name: 'Tax Invoices', icon: FileCheck },
    { id: 'returns', name: 'Sales Returns (Credit Notes)', icon: CornerUpLeft },
    { id: 'gatepass', name: 'Security Gate Pass', icon: ShieldCheck },
    { id: 'inventory', name: 'Live Inventory', icon: Activity },
    { id: 'production', name: 'Yard Production', icon: Factory },
    { id: 'curing', name: 'QC & Curing Log', icon: ThermometerSun },
    { id: 'fuel', name: 'Diesel & Fuel Logs', icon: Droplet },
    { id: 'purchaseorders', name: 'Purchase Orders', icon: ClipboardList },
    { id: 'procurement', name: 'Procurement (Inbound)', icon: ShoppingCart },
    { id: 'ledger', name: 'Party Ledger (Khata)', icon: BookOpen },
    { id: 'vouchers', name: 'Cash & Bank Vouchers', icon: Wallet },
    { id: 'cashbook', name: 'Daily Cash Book', icon: DollarSign },
    { id: 'pnl', name: 'General Expenses & P&L', icon: PieChart },
    { id: 'aging', name: 'Debtors Aging Report', icon: AlertOctagon },
    { id: 'pdc', name: 'Cheque & PDC Manager', icon: Briefcase },
    { id: 'attendance', name: 'Daily Attendance', icon: UserCheck },
    { id: 'payroll', name: 'Payroll & Advances', icon: Users },
    { id: 'fleet', name: 'Fleet Maintenance', icon: Wrench },
    { id: 'reports', name: 'Management Reports', icon: BarChart3 },
    { id: 'masterdata', name: 'Master Data Manager', icon: Database },
    { id: 'recipes', name: 'Recipe Builder (BOM)', icon: Beaker },
  ];

  const filteredModules = allModules.filter(module => 
    module.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (moduleId) => {
    setSearchQuery(''); 
    onNavigate(moduleId); 
  };

  // --- FETCH LIVE KPI DATA ---
  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format large numbers cleanly (e.g., 245000 -> 245K)
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Executive Dashboard
              {isLoading && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
            </h1>
            <p className="text-slate-500 text-sm mt-1">{today}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            
            {/* Global Module Search Bar */}
            <div className="relative w-full sm:w-80 z-40">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Quick search modules..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
                />
                <div className="absolute right-3 flex items-center pointer-events-none">
                  <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-300">Ctrl K</span>
                </div>
              </div>
              
              {searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto">
                  {filteredModules.length > 0 ? (
                    <ul className="py-2">
                      {filteredModules.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <li key={mod.id}>
                            <button onClick={() => handleSearchSelect(mod.id)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left transition-colors group">
                              <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{mod.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-slate-500 text-center font-medium">No modules found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive User Profile Dropdown */}
            <div className="relative z-50">
              <button 
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px]">MC</div>
                <span>{currentRole}</span>
              </button>
              
              {isRoleMenuOpen && (
                <>
                  {/* Invisible overlay to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsRoleMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Switch Role</p>
                    
                    {availableRoles.map((role) => (
                      <button 
                        key={role}
                        onClick={() => {
                          setCurrentRole(role);
                          setIsRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-between ${
                          currentRole === role 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {role}
                        {currentRole === role && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
          </div>
        </div>

        {/* Top KPI Cards (NOW LIVE!) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div onClick={() => onNavigate('reports')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Revenue</p>
                <h3 className="text-3xl font-black text-slate-800 whitespace-nowrap">
                  {isLoading ? '...' : `Rs. ${formatNumber(stats.revenue)}`}
                </h3>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <p className="text-sm text-emerald-600 font-medium mt-4 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Live from Ledger</p>
          </div>

          <div onClick={() => onNavigate('dispatch')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Dispatches</p>
                <h3 className="text-3xl font-black text-slate-800 whitespace-nowrap">
                  {isLoading ? '...' : stats.pendingDispatches}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors"><Truck className="w-6 h-6" /></div>
            </div>
            <p className="text-sm text-blue-600 font-medium mt-4 flex items-center gap-1"><Package className="w-4 h-4" /> Trucks waiting</p>
          </div>

          <div onClick={() => onNavigate('production')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Production</p>
                <h3 className="text-3xl font-black text-slate-800 whitespace-nowrap">
                  {isLoading ? '...' : formatNumber(stats.production)}
                </h3>
              </div>
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors"><Factory className="w-6 h-6" /></div>
            </div>
            <p className="text-sm text-orange-600 font-medium mt-4 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Blocks cast today</p>
          </div>

          <div onClick={() => onNavigate('aging')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Receivables</p>
                <h3 className="text-3xl font-black text-slate-800 whitespace-nowrap">
                   {isLoading ? '...' : `Rs. ${formatNumber(stats.receivables)}`}
                </h3>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors"><AlertCircle className="w-6 h-6" /></div>
            </div>
            <p className="text-sm text-red-600 font-medium mt-4 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Outstanding balances</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}