import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, Search, Phone, MessageCircle, 
  FileText, TrendingDown, CalendarClock, Download, 
  CheckCircle2, RefreshCw 
} from 'lucide-react';

export default function DebtorsAging() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [activeToastClient, setActiveToastClient] = useState('');
  
  const [agingData, setAgingData] = useState([]); // Starts Empty!
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. FETCH LIVE AGING REPORT FROM MONGODB ---
  const fetchAgingData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/debtors-aging');
      if (response.ok) {
        const data = await response.json();
        setAgingData(data);
      }
    } catch (error) {
      console.error("Error fetching aging data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingData();
  }, []);

  const totals = useMemo(() => {
    return agingData.reduce((acc, curr) => {
      acc.total += curr.totalDue || 0;
      acc.current += curr.current || 0;
      acc.days30 += curr.days30 || 0;
      acc.days60 += curr.days60 || 0;
      acc.days90 += curr.days90 || 0;
      acc.days120Plus += curr.days120Plus || 0;
      return acc;
    }, { total: 0, current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0 });
  }, [agingData]);

  const filteredData = agingData.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendReminder = (clientName) => {
    setActiveToastClient(clientName);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-8 right-8 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-4 duration-300 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-bold">Reminder Dispatched</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">WhatsApp sent to {activeToastClient}</p>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarClock className="w-6 h-6 text-red-600" /> Debtors Aging Report
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            Track outstanding accounts receivable and prioritize recovery
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={fetchAgingData} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition shadow-md flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* --- KPI ROW --- */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-1 bg-slate-900 p-5 rounded-xl shadow-sm text-white border border-slate-800 flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total A/R</p>
          <p className="text-2xl font-black">Rs. {(totals.total / 100000).toFixed(2)}M</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current</p>
          <p className="text-xl font-bold text-slate-800">Rs. {(totals.current / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-blue-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">1-30 Days</p>
          <p className="text-xl font-bold text-slate-800">Rs. {(totals.days30 / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">31-60 Days</p>
          <p className="text-xl font-bold text-slate-800">Rs. {(totals.days60 / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-orange-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">61-90 Days</p>
          <p className="text-xl font-bold text-orange-600">Rs. {(totals.days90 / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm border-b-4 border-b-red-600 relative overflow-hidden">
          <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1 relative z-10">90+ Days</p>
          <p className="text-xl font-black text-red-600 relative z-10">Rs. {(totals.days120Plus / 1000).toFixed(0)}k</p>
          <AlertCircle className="w-12 h-12 text-red-100 absolute -right-2 -bottom-2" />
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search customer or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-sm"></div> Critical (90+)</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><div className="w-2.5 h-2.5 bg-amber-50 border border-amber-300 rounded-sm"></div> Warning (61-90)</span>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider">Customer Details</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right">Total Owed</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-700">Current</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-700">1-30 Days</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-700">31-60 Days</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-700">61-90 Days</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-700 text-red-400">90+ Days</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-center border-l border-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-500" />
                    Calculating live aging report...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    No outstanding accounts receivable found!
                  </td>
                </tr>
              ) : (
                filteredData.map(row => {
                  const isCritical = row.days90 > 0 || row.days120Plus > 0;
                  const isWarning = row.days60 > 0 && !isCritical;
                  
                  return (
                    <tr key={row.name} className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50/30' : isWarning ? 'bg-amber-50/30' : 'bg-white'}`}>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{row.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{row.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {row.phone}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900 border-r border-slate-100">
                        {row.totalDue.toLocaleString()}
                      </td>
                      
                      <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600 border-r border-slate-100">{row.current > 0 ? row.current.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 text-right text-xs font-semibold text-slate-600 border-r border-slate-100">{row.days30 > 0 ? row.days30.toLocaleString() : '-'}</td>
                      <td className={`px-6 py-4 text-right text-xs font-bold border-r border-slate-100 ${row.days60 > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-600'}`}>{row.days60 > 0 ? row.days60.toLocaleString() : '-'}</td>
                      <td className={`px-6 py-4 text-right text-xs font-black border-r border-slate-100 ${row.days90 > 0 ? 'text-orange-600 bg-orange-50/50' : 'text-slate-600'}`}>{row.days90 > 0 ? row.days90.toLocaleString() : '-'}</td>
                      <td className={`px-6 py-4 text-right text-xs font-black ${row.days120Plus > 0 ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>{row.days120Plus > 0 ? row.days120Plus.toLocaleString() : '-'}</td>
                      
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Ledger">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSendReminder(row.name)}
                          className={`px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition ${isCritical ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* TOTALS FOOTER */}
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-6 py-4 font-black text-slate-500 text-right uppercase text-[10px] tracking-widest">Total Aging Profile:</td>
                <td className="px-6 py-4 font-black text-slate-900 text-right text-sm border-l border-slate-200">Rs. {totals.total.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-slate-700 text-right text-xs border-l border-slate-200">{totals.current.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-slate-700 text-right text-xs border-l border-slate-200">{totals.days30.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-amber-700 text-right text-xs border-l border-slate-200">{totals.days60.toLocaleString()}</td>
                <td className="px-6 py-4 font-black text-orange-600 text-right text-xs border-l border-slate-200">{totals.days90.toLocaleString()}</td>
                <td className="px-6 py-4 font-black text-red-600 text-right text-xs border-l border-slate-200 bg-red-50">{totals.days120Plus.toLocaleString()}</td>
                <td className="px-6 py-4 bg-slate-50"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* INSIGHT ALERT */}
      {(totals.days90 > 0 || totals.days120Plus > 0) && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-900 font-medium leading-relaxed">
            <strong className="font-black">System Insight:</strong> Rs. {(totals.days90 + totals.days120Plus).toLocaleString()} is severely overdue (90+ Days). 
            Consider halting further deliveries to these accounts until a recovery plan is established.
          </p>
        </div>
      )}

    </div>
  );
}