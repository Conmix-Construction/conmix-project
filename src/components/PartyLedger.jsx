import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Printer, Download, Send, 
  Building2, User, Calendar, RefreshCw
} from 'lucide-react';

export default function PartyLedger() {
  const [filters, setFilters] = useState({
    partyType: 'customer',
    partyId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMasterLoading, setIsMasterLoading] = useState(true);

  // Live Master Data
  const [parties, setParties] = useState({ customer: [], supplier: [] });
  // Live Ledger Data
  const [transactions, setTransactions] = useState([]);

  // --- 1. LOAD CUSTOMERS AND SUPPLIERS ON MOUNT ---
  useEffect(() => {
    const fetchParties = async () => {
      try {
        // Fetching from your unified Parties route!
        const response = await fetch('http://localhost:5000/api/parties');
        if (response.ok) {
          const partyData = await response.json();
          
          // Split into respective categories for the dropdowns
          const custData = partyData.filter(p => p.type === 'Customer' || p.type === 'Both');
          const supData = partyData.filter(p => p.type === 'Supplier' || p.type === 'Both');
          
          setParties({ customer: custData, supplier: supData });
          
          // Auto-select the first customer if available
          if (custData.length > 0) {
            setFilters(prev => ({ ...prev, partyId: custData[0]._id || custData[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to load master data", error);
      } finally {
        setIsMasterLoading(false);
      }
    };
    fetchParties();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'partyType') {
        // Auto-select first party of the newly selected type
        const newPartyList = parties[value];
        if (newPartyList.length > 0) {
          newFilters.partyId = newPartyList[0]._id || newPartyList[0].id;
        } else {
          newFilters.partyId = '';
        }
      }
      return newFilters;
    });
    setIsGenerated(false);
  };

  // --- 2. FETCH LEDGER DATA ON SUBMIT ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!filters.partyId) return;
    
    setIsLoading(true);
    try {
      // NOTE: Ensure your server.js still has this route active!
      const response = await fetch(`http://localhost:5000/api/ledger/party/${filters.partyId}?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      if (response.ok) {
        setTransactions(await response.json());
        setIsGenerated(true);
      } else {
        alert("Failed to fetch ledger data. Please check backend.");
      }
    } catch (error) {
      console.error("Failed to fetch ledger", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. AUTO-CALCULATE RUNNING BALANCE ---
  const processedLedger = useMemo(() => {
    if (!isGenerated) return null;

    const isCustomer = filters.partyType === 'customer';
    
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const formattedData = transactions.map(row => {
      totalDebit += row.debit || 0;
      totalCredit += row.credit || 0;

      // Logic: Customers (Assets) increase with Debits. Suppliers (Liabilities) increase with Credits.
      if (isCustomer) {
        runningBalance = runningBalance + (row.debit || 0) - (row.credit || 0);
      } else {
        runningBalance = runningBalance + (row.credit || 0) - (row.debit || 0);
      }

      return {
        ...row,
        balance: runningBalance,
        balanceType: isCustomer 
          ? (runningBalance >= 0 ? 'Dr' : 'Cr') 
          : (runningBalance >= 0 ? 'Cr' : 'Dr')
      };
    });

    return {
      rows: formattedData,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance,
      isCustomer
    };
  }, [isGenerated, transactions, filters.partyType]);

  const activePartyList = parties[filters.partyType];
  const activeParty = activePartyList.find(p => (p._id || p.id) === filters.partyId);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Hidden on Print */}
        <div className="mb-6 flex justify-between items-start print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Party Ledger & Statements
            </h1>
            <p className="text-slate-500 mt-1">Generate complete account statements for customers and suppliers (Khata).</p>
          </div>
        </div>

        {/* Filter Card - Hidden on Print */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative print:hidden">
          {isMasterLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Type</label>
              <select 
                name="partyType" 
                value={filters.partyType} 
                onChange={handleFilterChange}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-semibold"
              >
                <option value="customer">Customer (Receivables)</option>
                <option value="supplier">Supplier (Payables)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Party</label>
              <select 
                name="partyId" 
                value={filters.partyId} 
                onChange={handleFilterChange}
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
              >
                <option value="" disabled>Select an account...</option>
                {activePartyList.map(p => {
                  const id = p._id || p.id;
                  return <option key={id} value={id}>{p.companyName || p.name}</option>;
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
              <input 
                type="date" 
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !filters.partyId}
              className={`w-full h-[46px] text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-md ${
                isLoading || !filters.partyId ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4" /> Generate Ledger</>}
            </button>
          </form>
        </div>

        {/* Ledger Statement Document */}
        {isGenerated && processedLedger && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:shadow-none print:border-none print:rounded-none">
            
            {/* Toolbar - Hidden on Print */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                  {filters.partyType === 'customer' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </span>
                <span className="font-bold text-slate-700">Account Statement Ready</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-bold transition shadow-sm">
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </div>

            {/* Printable Area Starts */}
            <div className="p-8 print:p-0">
              
              <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">STATEMENT OF ACCOUNT</h2>
                  <p className="text-slate-600 font-bold mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400"/> {new Date(filters.startDate).toLocaleDateString()} — {new Date(filters.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-black text-slate-900">CONMIX CONSTRUCTION</h3>
                  <p className="text-sm font-semibold text-slate-600 mt-1">Near Usman Shah Mazar, 8 Km Gatap Road, Karachi</p>
                </div>
              </div>

              {/* Party Details & Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:gap-4">
                <div className="md:col-span-1 bg-slate-50 p-5 rounded-lg border border-slate-200 print:bg-transparent print:border-slate-300">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Name</p>
                  <h4 className="text-xl font-black text-slate-900">{activeParty?.companyName || activeParty?.name || 'Unknown'}</h4>
                  <p className="text-sm font-bold text-slate-600 mt-2">{filters.partyType === 'customer' ? 'Customer' : 'Supplier'} ID: <span className="text-slate-800">{activeParty?.code || filters.partyId.substring(0,6).toUpperCase()}</span></p>
                  <p className="text-sm font-bold text-slate-600">Ph: <span className="text-slate-800">{activeParty?.phone || 'N/A'}</span></p>
                </div>

                <div className="md:col-span-2 grid grid-cols-3 gap-4 print:gap-2">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center flex flex-col justify-center print:shadow-none print:border-slate-300">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Debit (Dr)</p>
                    <p className="text-lg font-black text-slate-800">Rs. {processedLedger.totalDebit.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center flex flex-col justify-center print:shadow-none print:border-slate-300">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Credit (Cr)</p>
                    <p className="text-lg font-black text-slate-800">Rs. {processedLedger.totalCredit.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-lg border shadow-sm text-center flex flex-col justify-center print:shadow-none print:border-slate-900 print:border-2 ${
                    processedLedger.isCustomer 
                      ? (processedLedger.closingBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                      : (processedLedger.closingBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-80 text-slate-700">
                      {processedLedger.isCustomer ? 'Amount Receivable' : 'Amount Payable'}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      Rs. {Math.abs(processedLedger.closingBalance).toLocaleString()} 
                      {processedLedger.rows.length > 0 && (
                        <span className="text-sm font-bold opacity-75 ml-1">{processedLedger.rows[processedLedger.rows.length-1].balanceType}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 print:border-slate-300">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white print:bg-slate-100 print:text-slate-900 border-b border-slate-300">
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider">Date</th>
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider">Ref / Voucher</th>
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider">Description</th>
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider text-right border-l border-slate-600 print:border-slate-300">Debit (Dr)</th>
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider text-right border-r border-slate-600 print:border-slate-300">Credit (Cr)</th>
                      <th className="p-3 text-[11px] font-black uppercase tracking-wider text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedLedger.rows.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center font-bold text-slate-400 italic">No transactions found for this period.</td>
                      </tr>
                    ) : (
                      processedLedger.rows.map((row, idx) => (
                        <tr key={row.id || idx} className={`border-b border-slate-200 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-transparent'}`}>
                          <td className="p-3 text-sm font-bold text-slate-700 whitespace-nowrap">{row.date}</td>
                          <td className="p-3 text-sm font-mono text-blue-600 font-bold">{row.ref}</td>
                          <td className="p-3 text-sm text-slate-800">
                            <span className="font-bold block">{row.type}</span>
                            <span className="text-xs font-semibold text-slate-500">{row.remarks}</span>
                          </td>
                          <td className="p-3 text-sm text-right font-mono border-l border-slate-200 text-slate-900 font-bold">
                            {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                          </td>
                          <td className="p-3 text-sm text-right font-mono border-r border-slate-200 text-slate-900 font-bold">
                            {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                          </td>
                          <td className="p-3 text-sm text-right font-mono font-black text-slate-900 bg-slate-100/50 print:bg-transparent">
                            {Math.abs(row.balance).toLocaleString()} <span className="text-[10px] font-black text-slate-500 ml-1">{row.balanceType}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  
                  {processedLedger.rows.length > 0 && (
                    <tfoot className="print:border-t-2 print:border-slate-800">
                      <tr className="bg-slate-100 border-t-2 border-slate-300 print:bg-transparent">
                        <td colSpan="3" className="p-3 text-sm font-black text-slate-800 text-right uppercase tracking-wider">Total For Period:</td>
                        <td className="p-3 text-sm font-black text-right font-mono border-l border-slate-200 text-slate-900">{processedLedger.totalDebit.toLocaleString()}</td>
                        <td className="p-3 text-sm font-black text-right font-mono border-r border-slate-200 text-slate-900">{processedLedger.totalCredit.toLocaleString()}</td>
                        <td className="p-3 text-sm font-black text-right font-mono text-slate-900">
                          {Math.abs(processedLedger.closingBalance).toLocaleString()} <span className="text-[10px]">{processedLedger.rows[processedLedger.rows.length-1].balanceType}</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="mt-16 flex justify-between items-end">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <p>System Generated Document</p>
                  <p>Timestamp: {new Date().toLocaleString()}</p>
                </div>
                <div className="w-64 text-center border-t-2 border-slate-400 pt-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">Authorized Signature</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">Conmix Accounts Dept.</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}