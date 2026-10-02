import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, Calendar, ArrowDownCircle, ArrowUpCircle, 
  Calculator, Lock, AlertCircle, CheckCircle2, Printer, FileText, RefreshCw
} from 'lucide-react';

export default function DailyCashBook() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isClosed, setIsClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  const initialCashCount = {
    notes5000: '', notes1000: '', notes500: '', notes100: '', 
    notes50: '', notes20: '', notes10: '', coins: ''
  };
  const [cashCount, setCashCount] = useState(initialCashCount);

  // --- 1. FETCH LIVE DAILY SUMMARY ---
  const fetchDailySummary = async (dateStr) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/daily-summary/${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setOpeningBalance(data.openingBalance);
        setIsClosed(data.isClosed);
        
        // If the day is locked, populate the inputs with the saved tally
        if (data.isClosed && data.closingRecord) {
          setCashCount(data.closingRecord.cashCount);
        } else {
          setCashCount(initialCashCount); // Reset if it's a new, open day
        }
      }
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate]);

  // Auto-calculate Ledger Totals
  const ledgerMath = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    
    transactions.forEach(t => {
      if (t.type === 'IN') totalIn += t.amount;
      else totalOut += t.amount;
    });

    const expectedClosing = openingBalance + totalIn - totalOut;
    return { totalIn, totalOut, expectedClosing };
  }, [transactions, openingBalance]);

  // Auto-calculate Physical Cash Total
  const physicalMath = useMemo(() => {
    const total = 
      (Number(cashCount.notes5000) * 5000) +
      (Number(cashCount.notes1000) * 1000) +
      (Number(cashCount.notes500) * 500) +
      (Number(cashCount.notes100) * 100) +
      (Number(cashCount.notes50) * 50) +
      (Number(cashCount.notes20) * 20) +
      (Number(cashCount.notes10) * 10) +
      Number(cashCount.coins);
      
    const variance = total - ledgerMath.expectedClosing;
    return { total, variance };
  }, [cashCount, ledgerMath.expectedClosing]);

  const handleDenominationChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || Number(value) >= 0) {
      setCashCount(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- 2. CLOSE & LOCK THE DAY ---
  const handleCloseDay = async () => {
    if (physicalMath.variance !== 0) {
      const confirmForce = window.confirm(`WARNING: You have a cash variance of Rs. ${physicalMath.variance}. Do you still want to force close the day?`);
      if (!confirmForce) return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/cashbook/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          cashCount: cashCount,
          ledgerExpected: ledgerMath.expectedClosing,
          physicalTotal: physicalMath.total,
          variance: physicalMath.variance
        })
      });

      if (response.ok) {
        setIsClosed(true);
      }
    } catch (error) {
      console.error("Error closing day:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24 relative">
      
      {/* Overlay if Day is Closed */}
      {isClosed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in duration-300">
            <Lock className="w-16 h-16 text-slate-800 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Day Closed & Locked</h2>
            <p className="text-slate-600 mb-6">Roznamcha for <span className="font-bold text-slate-800">{selectedDate}</span> has been securely posted to the master ledger.</p>
            <button 
              onClick={() => {
                const tomorrow = new Date(selectedDate);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition"
            >
              Start Next Day
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Book className="w-8 h-8 text-emerald-600" /> Daily Cash Book (Roznamcha)
            </h1>
            <p className="text-slate-500 mt-1">Reconcile physical drawer cash against digital ERP vouchers.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDailySummary(selectedDate)} className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-300 rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input 
                type="date" 
                className="outline-none text-sm font-bold text-slate-700 bg-transparent cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition tooltip" title="Print Register">
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-xl shadow-sm text-white">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Opening Balance</p>
            <p className="text-xl font-black">Rs. {openingBalance.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-green-500">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownCircle className="w-3 h-3 text-green-500"/> Total In</p>
            <p className="text-lg font-bold text-green-700">Rs. {ledgerMath.totalIn.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-orange-500">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3 text-orange-500"/> Total Out</p>
            <p className="text-lg font-bold text-orange-700">Rs. {ledgerMath.totalOut.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm border-b-4 border-b-emerald-600">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Expected Closing</p>
            <p className="text-xl font-black text-emerald-700">Rs. {ledgerMath.expectedClosing.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Digital Ledger (System Expected) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Digital Vouchers (System)
                </h2>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{transactions.length} Entries</span>
              </div>
              
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-3 font-semibold w-24">Time/Ref</th>
                      <th className="p-3 font-semibold">Category & Details</th>
                      <th className="p-3 font-semibold text-right">Cash In (Dr)</th>
                      <th className="p-3 font-semibold text-right">Cash Out (Cr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                          Fetching today's ledger transactions...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500 font-medium">
                          No transactions recorded for this date yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition text-sm">
                          <td className="p-3">
                            <p className="font-semibold text-slate-700 whitespace-nowrap">{t.time}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{t.id}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{t.category}</p>
                            <p className="text-xs text-slate-500">{t.details}</p>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-green-700 bg-green-50/30">
                            {t.type === 'IN' ? t.amount.toLocaleString() : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-orange-700 bg-orange-50/30">
                            {t.type === 'OUT' ? t.amount.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Physical Cash Calculator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full sticky top-8">
              
              <div className="bg-slate-800 p-4 rounded-t-xl text-white flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" /> Physical Cash Tally
                </h2>
              </div>

              <div className="p-5 flex-grow overflow-y-auto">
                <p className="text-xs text-slate-500 mb-4">Count the physical notes in the cash drawer and enter the quantities below.</p>
                
                <div className="space-y-2.5">
                  {[
                    { val: 5000, name: 'notes5000', label: 'Rs. 5000' },
                    { val: 1000, name: 'notes1000', label: 'Rs. 1000' },
                    { val: 500, name: 'notes500', label: 'Rs. 500' },
                    { val: 100, name: 'notes100', label: 'Rs. 100' },
                    { val: 50, name: 'notes50', label: 'Rs. 50' },
                    { val: 20, name: 'notes20', label: 'Rs. 20' },
                    { val: 10, name: 'notes10', label: 'Rs. 10' },
                  ].map(note => (
                    <div key={note.name} className="flex items-center gap-3">
                      <div className="w-20 text-right text-sm font-bold text-slate-700 shrink-0">{note.label}</div>
                      <div className="text-slate-400 font-bold text-xs shrink-0">x</div>
                      <input 
                        type="number" min="0" name={note.name}
                        value={cashCount[note.name]} onChange={handleDenominationChange}
                        placeholder="0" disabled={isClosed}
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-center font-semibold bg-slate-50 disabled:opacity-70 disabled:bg-slate-100"
                      />
                      <div className="w-24 text-right text-sm font-mono text-slate-500 shrink-0 bg-slate-100 py-2 px-2 rounded border border-slate-200">
                        = {(Number(cashCount[note.name]) * note.val).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {/* Coins / Misc */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
                    <div className="w-20 text-right text-sm font-bold text-slate-700 shrink-0">Coins/Misc</div>
                    <div className="text-slate-400 font-bold text-xs shrink-0">+</div>
                    <input 
                      type="number" min="0" name="coins"
                      value={cashCount.coins} onChange={handleDenominationChange}
                      placeholder="Total Value" disabled={isClosed}
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-center font-semibold bg-slate-50 disabled:opacity-70 disabled:bg-slate-100"
                    />
                    <div className="w-24 text-right text-sm font-mono text-slate-500 shrink-0 bg-slate-100 py-2 px-2 rounded border border-slate-200">
                      = {Number(cashCount.coins).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-b-xl border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-600">Physical Cash Total:</span>
                  <span className="text-2xl font-black text-slate-900">Rs. {physicalMath.total.toLocaleString()}</span>
                </div>

                <div className={`p-3 rounded-lg flex items-center justify-between border mb-6 ${
                  physicalMath.variance === 0 && physicalMath.total > 0
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : physicalMath.variance < 0 
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : physicalMath.variance > 0
                        ? 'bg-orange-50 border-orange-200 text-orange-800'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {physicalMath.variance === 0 && physicalMath.total > 0 ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    Variance
                  </span>
                  <span className="font-bold font-mono text-lg">
                    {physicalMath.variance > 0 ? '+' : ''}{physicalMath.variance.toLocaleString()}
                  </span>
                </div>

                <button 
                  onClick={handleCloseDay}
                  disabled={physicalMath.total === 0 || isClosed || isSaving}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-lg shadow-md transition-all ${
                    physicalMath.total === 0 || isClosed
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : physicalMath.variance === 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                  }`}
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  {isSaving ? 'Locking Ledger...' : physicalMath.variance === 0 ? 'Tally Matched - Close Day' : 'Force Close with Variance'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}