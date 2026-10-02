import React, { useState, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Wallet, Download, Calendar, RefreshCw } from 'lucide-react';

export default function ReportingScreen() {
  const [activeTab, setActiveTab] = useState('pnl');
  const [isLoading, setIsLoading] = useState(true);
  
  const [reportData, setReportData] = useState({
    kpis: { cashAndBank: 0, accountsReceivable: 0, accountsPayable: 0 },
    pnl: { revenue: [], cogs: [], expenses: [] },
    trialBalance: []
  });

  // --- 1. FETCH LIVE FINANCIALS FROM MONGODB ---
  const fetchFinancials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/reports/financials');
      if (response.ok) {
        setReportData(await response.json());
      }
    } catch (error) {
      console.error("Error fetching financials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Math Helpers
  const totalRevenue = reportData.pnl.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalCOGS = reportData.pnl.cogs.reduce((sum, item) => sum + item.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = reportData.pnl.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const totalTB = reportData.trialBalance.reduce((acc, curr) => ({
    debit: acc.debit + curr.debit,
    credit: acc.credit + curr.credit
  }), { debit: 0, credit: 0 });

  // Tab Components
  const ProfitAndLossView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Income Statement (Profit & Loss)</h2>
        <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>
      
      <div className="p-6">
        {/* Revenue Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-700 border-b pb-2 mb-3">Revenue</h3>
          {reportData.pnl.revenue.length === 0 && <p className="text-sm text-slate-400 italic py-2">No revenue recorded yet.</p>}
          {reportData.pnl.revenue.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 text-slate-600">
              <span>{item.name}</span>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
            <span>Total Revenue</span>
            <span>{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* COGS Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-700 border-b pb-2 mb-3">Cost of Goods Sold (COGS)</h3>
          {reportData.pnl.cogs.length === 0 && <p className="text-sm text-slate-400 italic py-2">No COGS recorded yet.</p>}
          {reportData.pnl.cogs.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 text-slate-600">
              <span>{item.name}</span>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
            <span>Total COGS</span>
            <span>{formatCurrency(totalCOGS)}</span>
          </div>
        </div>

        {/* Gross Profit Summary */}
        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mb-6 border border-blue-100">
          <span className="text-lg font-bold text-blue-900">Gross Profit</span>
          <span className="text-xl font-bold text-blue-700">{formatCurrency(grossProfit)}</span>
        </div>

        {/* Expenses Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-700 border-b pb-2 mb-3">Operating Expenses</h3>
          {reportData.pnl.expenses.length === 0 && <p className="text-sm text-slate-400 italic py-2">No expenses recorded yet.</p>}
          {reportData.pnl.expenses.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2 text-slate-600">
              <span>{item.name}</span>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-slate-800 mt-2 pt-2 border-t border-slate-200">
            <span>Total Expenses</span>
            <span>{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Net Profit Summary */}
        <div className={`p-4 rounded-lg flex justify-between items-center border ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>Net Profit (Loss)</span>
          <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(netProfit)}
          </span>
        </div>
      </div>
    </div>
  );

  const TrialBalanceView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Trial Balance</h2>
        <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> As of Today</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm">
              <th className="p-4 font-semibold border-b">Account Name</th>
              <th className="p-4 font-semibold border-b text-right">Debit (Rs)</th>
              <th className="p-4 font-semibold border-b text-right">Credit (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.trialBalance.map((row, i) => (
              <tr key={i} className="border-b hover:bg-slate-50 text-sm">
                <td className="p-4 text-slate-700">{row.account}</td>
                <td className="p-4 text-right font-mono text-slate-600">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                <td className="p-4 text-right font-mono text-slate-600">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
              </tr>
            ))}
            <tr className="bg-slate-800 text-white font-bold text-sm">
              <td className="p-4">TOTAL</td>
              <td className="p-4 text-right font-mono">{totalTB.debit.toLocaleString()}</td>
              <td className="p-4 text-right font-mono">{totalTB.credit.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        {totalTB.debit === totalTB.credit ? (
          <div className="p-4 bg-green-50 text-green-700 text-center text-sm font-semibold flex items-center justify-center gap-2 border-t border-green-200">
            <Wallet className="w-4 h-4" /> Trial Balance is perfectly balanced.
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-700 text-center text-sm font-semibold border-t border-red-200">
            Warning: Trial Balance out of balance. Check Journal Entries.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              Financial Reports
              {isLoading && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
            </h1>
            <p className="text-slate-500 mt-1">Real-time accounting and ledger analytics</p>
          </div>
          <button onClick={fetchFinancials} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center gap-2 font-bold">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Cash & Bank</p>
              <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : formatCurrency(reportData.kpis.cashAndBank)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Accounts Receivable</p>
              <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : formatCurrency(reportData.kpis.accountsReceivable)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><ArrowDownRight className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Accounts Payable</p>
              <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : formatCurrency(reportData.kpis.accountsPayable)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-300 mb-6">
          <button 
            onClick={() => setActiveTab('pnl')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition flex items-center gap-2 ${activeTab === 'pnl' ? 'bg-white text-blue-600 border-t border-l border-r border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <BarChart3 className="w-4 h-4" /> Profit & Loss
          </button>
          <button 
            onClick={() => setActiveTab('tb')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition flex items-center gap-2 ${activeTab === 'tb' ? 'bg-white text-blue-600 border-t border-l border-r border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Trial Balance
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="mb-12">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              Calculating live financial statements...
            </div>
          ) : (
            <>
              {activeTab === 'pnl' && <ProfitAndLossView />}
              {activeTab === 'tb' && <TrialBalanceView />}
            </>
          )}
        </div>

      </div>
    </div>
  );
}