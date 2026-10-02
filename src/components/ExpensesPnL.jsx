import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, 
  Plus, Receipt, Calculator, Calendar, CreditCard, RefreshCw
} from 'lucide-react';

export default function ExpensesPnL() {
  // Revenue and COGS are set to 0 until the full BOM and Sales modules are linked
  const mockRevenue = 0; 
  const mockCOGS = 0;    

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    category: 'Office & Admin',
    amount: '',
    description: '',
    method: 'Petty Cash'
  };
  const [formData, setFormData] = useState(initialForm);

  const categories = ["Utilities", "Office & Admin", "Maintenance", "Rent", "Marketing", "Miscellaneous"];

  // --- 1. FETCH LIVE EXPENSES FROM MONGODB ---
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. SAVE NEW EXPENSE TO MONGODB ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount)
        })
      });

      if (response.ok) {
        setFormData(initialForm);
        fetchExpenses(); // Refresh the ledger and recalculate P&L
      }
    } catch (error) {
      console.error("Error saving expense:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. DYNAMIC P&L CALCULATIONS ---
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const grossProfit = mockRevenue - mockCOGS;
  const netProfit = grossProfit - totalExpenses;
  const isProfitable = netProfit >= 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 rounded-xl flex justify-between items-center shadow-md">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PieChart className="w-6 h-6 text-emerald-400" /> General Expenses & P&L
            </h1>
            <p className="text-slate-300 text-sm mt-1">Track overhead costs and view live company profitability.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchExpenses} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
              <RefreshCw className={`w-5 h-5 text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right hidden md:block">
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Reporting Period</p>
              <p className="text-lg font-bold">June 2026</p>
            </div>
          </div>
        </div>

        {/* Executive P&L Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Gross Revenue</p>
            <p className="text-xl font-black text-slate-800 mt-1">Rs. {mockRevenue.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Total Sales</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">- Cost of Goods</p>
            <p className="text-xl font-black text-red-600 mt-1">Rs. {mockCOGS.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Materials & Direct Labor</p>
          </div>
          <div className="bg-slate-100 p-5 rounded-xl border border-slate-300 shadow-inner">
            <p className="text-xs font-bold text-slate-600 uppercase">= Gross Profit</p>
            <p className="text-xl font-black text-slate-800 mt-1">Rs. {grossProfit.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Before Overhead</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">- Operating Expenses</p>
            <p className="text-xl font-black text-orange-500 mt-1">Rs. {totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">From ledger below</p>
          </div>
          <div className={`p-5 rounded-xl border shadow-sm ${isProfitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-bold uppercase ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>= Net Profit / Loss</p>
            <div className="flex items-center gap-2 mt-1">
              {isProfitable ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
              <p className={`text-2xl font-black ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
                Rs. {netProfit.toLocaleString()}
              </p>
            </div>
            <p className={`text-xs mt-1 ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>Bottom Line</p>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Add Expense Form */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden h-fit">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-500" /> Record New Expense
              </h3>
            </div>
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expense Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none bg-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Amount (Rs.)</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required min="1" placeholder="e.g. 1500" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} required placeholder="e.g. Office cleaning supplies" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3"/> Paid From</label>
                <select name="method" value={formData.method} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none bg-white">
                  <option value="Petty Cash">Petty Cash (Cash Book)</option>
                  <option value="Bank Transfer">Bank Transfer (Meezan)</option>
                  <option value="Corporate Card">Corporate Card</option>
                </select>
              </div>

              <button disabled={isSaving} type="submit" className={`w-full text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2 ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}>
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isSaving ? 'Posting...' : 'Post Expense to Ledger'}
              </button>
            </form>
          </div>

          {/* Right Column: Expense Ledger */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-500" /> Operating Expenses Ledger
              </h3>
              <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{expenses.length} Records</span>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold">Description & Method</th>
                    <th className="p-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-slate-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-400" />
                        Calculating P&L Ledger...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-slate-400 font-medium">No expenses recorded for this period.</td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 whitespace-nowrap text-slate-600 font-medium">{expense.date}</td>
                        <td className="p-3">
                          <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded text-xs font-semibold">
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{expense.description}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{expense.method}</p>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800 whitespace-nowrap">
                          Rs. {expense.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}