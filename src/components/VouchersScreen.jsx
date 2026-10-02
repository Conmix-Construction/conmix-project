import React, { useState, useEffect } from 'react';
import { 
  Receipt, Wallet, Building, User, CheckCircle, 
  ArrowRightLeft, FileText, CreditCard, Banknote, RefreshCw
} from 'lucide-react';

export default function VouchersScreen() {
  const [formData, setFormData] = useState({
    voucherType: 'receipt', // 'receipt' (Money In) or 'payment' (Money Out)
    partyType: 'customer',  // customer, supplier, employee, general
    partyId: '',
    paymentMode: 'bank',    // cash, bank
    amount: '',
    reference: '',
    remarks: ''
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedVoucherId, setGeneratedVoucherId] = useState('');

  // Live Master Data Store
  const [dataStore, setDataStore] = useState({
    customer: [],
    supplier: [],
    employee: [ // Still mocked until HR module exists
      { id: 'EMP-001', name: 'Ali (Machine Operator)' },
      { id: 'EMP-002', name: 'Tariq (Driver)' }
    ],
    general: [ // Standard ERP Expense Accounts
      { id: 'ACC-601', name: 'Yard Utilities & Electricity' },
      { id: 'ACC-602', name: 'Fleet Maintenance & Fuel' },
      { id: 'ACC-603', name: 'Office Supplies' },
      { id: 'ACC-604', name: 'Owner Drawings / Capital' }
    ]
  });

  // --- 1. FETCH LIVE CUSTOMERS & SUPPLIERS ---
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [custRes, supRes] = await Promise.all([
          fetch('http://localhost:5000/api/customers'),
          fetch('http://localhost:5000/api/suppliers')
        ]);
        
        if (custRes.ok && supRes.ok) {
          const custData = await custRes.json();
          const supData = await supRes.json();
          
          setDataStore(prev => ({
            ...prev,
            customer: custData.map(c => ({ id: c.customerId, name: c.name })),
            supplier: supData.map(s => ({ id: s.supplierId, name: s.name }))
          }));
        }
      } catch (error) {
        console.error("Failed to load master data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset party ID if party type or voucher type changes
      if (name === 'partyType' || name === 'voucherType') {
        newData.partyId = '';
      }
      return newData;
    });
  };

  // Determine Ledger Impact Dynamically for UI
  const getLedgerImpact = () => {
    let debitAccount = '';
    let creditAccount = '';
    const modeAccount = formData.paymentMode === 'bank' ? 'Bank Account' : 'Cash in Hand';
    const partyName = formData.partyId ? dataStore[formData.partyType].find(p => p.id === formData.partyId)?.name : '[Select Party]';

    if (formData.voucherType === 'receipt') {
      debitAccount = modeAccount; // Money coming in
      if (formData.partyType === 'customer') creditAccount = `Accounts Receivable (${partyName})`;
      else if (formData.partyType === 'supplier') creditAccount = `Accounts Payable (${partyName}) - Refund`;
      else creditAccount = `Other Income / General`;
    } else { // Payment
      creditAccount = modeAccount; // Money going out
      if (formData.partyType === 'supplier') debitAccount = `Accounts Payable (${partyName})`;
      else if (formData.partyType === 'customer') debitAccount = `Accounts Receivable (${partyName}) - Refund`;
      else if (formData.partyType === 'employee') debitAccount = `Salary / Cash Advance (${partyName})`;
      else if (formData.partyType === 'general') debitAccount = `Expense Account (${partyName})`;
    }

    return { debitAccount, creditAccount };
  };

  // --- 2. POST VOUCHER TO LEDGER DB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || !formData.amount) return;
    
    setIsSaving(true);
    const newVoucherId = `VCH-${Math.floor(1000 + Math.random() * 9000)}`;
    const party = dataStore[formData.partyType].find(p => p.id === formData.partyId);

    // Determine the double-entry amounts based on standard accounting rules
    let debitAmount = 0;
    let creditAmount = 0;
    let finalType = '';

    if (formData.voucherType === 'receipt') {
      finalType = formData.paymentMode === 'bank' ? 'Receipt (Bank)' : 'Receipt (Cash)';
      // If customer pays us, we Credit their Accounts Receivable account
      creditAmount = Number(formData.amount); 
    } else {
      finalType = formData.paymentMode === 'bank' ? 'Payment (Bank)' : 'Payment (Cash)';
      // If we pay a supplier, we Debit their Accounts Payable account
      debitAmount = Number(formData.amount); 
    }

    // For general expenses, override logic
    if (formData.partyType === 'general' && formData.voucherType === 'payment') {
      finalType = 'Expense';
      debitAmount = Number(formData.amount);
      creditAmount = 0;
    }

    try {
      const response = await fetch('http://localhost:5000/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: newVoucherId,
          date: new Date().toISOString(), // Use current exact time
          partyId: formData.partyId,
          partyType: formData.partyType,
          type: finalType,
          reference: formData.reference,
          debit: debitAmount,
          credit: creditAmount,
          description: formData.remarks || `Manual ${finalType} entry`,
          paymentMethod: formData.paymentMode === 'bank' ? 'Bank' : 'Cash',
          category: formData.partyType === 'general' ? party.name : undefined // Attach expense category if general
        })
      });

      if (response.ok) {
        setGeneratedVoucherId(newVoucherId);
        setIsSubmitted(true);
      } else {
        alert("Failed to post voucher to ledger.");
      }
    } catch (error) {
      console.error("Voucher error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ voucherType: 'receipt', partyType: 'customer', partyId: '', paymentMode: 'bank', amount: '', reference: '', remarks: '' });
    setIsSubmitted(false);
    setGeneratedVoucherId('');
  };

  const ledger = getLedgerImpact();
  const themeColor = formData.voucherType === 'receipt' ? 'emerald' : 'orange';

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className={`bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-${themeColor}-500 animate-in zoom-in duration-300`}>
          <CheckCircle className={`w-16 h-16 text-${themeColor}-500 mx-auto mb-4`} />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Voucher Posted!</h2>
          <p className="text-slate-600 mb-6">The transaction has been recorded in the general ledger.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left border border-slate-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Voucher No:</span>
              <span className="font-bold text-slate-800 font-mono">{generatedVoucherId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount:</span>
              <span className="font-bold text-slate-800">Rs. {Number(formData.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-500">Ledger Status:</span>
              <span className="font-bold text-green-600">Updated ✓</span>
            </div>
          </div>

          <button 
            onClick={resetForm}
            className={`w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition`}
          >
            Create Another Voucher
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Main Form Area */}
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6" /> Cash & Bank Vouchers
              </h1>
              <p className="text-slate-300 text-sm mt-1">Record incoming receipts and outgoing payments</p>
            </div>
          </div>

          <form id="voucher-form" onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-grow">
            
            {/* Voucher Type Selection */}
            <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg cursor-pointer font-bold text-sm transition-all ${formData.voucherType === 'receipt' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>
                <input type="radio" name="voucherType" value="receipt" checked={formData.voucherType === 'receipt'} onChange={handleChange} className="hidden" />
                <Receipt className="w-5 h-5" /> Receipt (Money In)
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg cursor-pointer font-bold text-sm transition-all ${formData.voucherType === 'payment' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>
                <input type="radio" name="voucherType" value="payment" checked={formData.voucherType === 'payment'} onChange={handleChange} className="hidden" />
                <Wallet className="w-5 h-5" /> Payment (Money Out)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Party Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Account Category</label>
                <select 
                  name="partyType"
                  value={formData.partyType}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  {formData.voucherType === 'receipt' ? (
                    <>
                      <option value="customer">Customer (Receivables)</option>
                      <option value="supplier">Supplier Refund</option>
                      <option value="general">Other Income / Capital</option>
                    </>
                  ) : (
                    <>
                      <option value="supplier">Supplier (Payables)</option>
                      <option value="employee">Employee (Salary/Advance)</option>
                      <option value="general">General Expense</option>
                      <option value="customer">Customer Refund</option>
                    </>
                  )}
                </select>
              </div>

              {/* Specific Party */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Select Specific Account</label>
                <select 
                  name="partyId" required
                  value={formData.partyId} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>{isLoadingData ? 'Loading accounts...' : 'Choose...'}</option>
                  {dataStore[formData.partyType]?.map(party => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Amount (Rs)</label>
                <input 
                  type="number" name="amount" required min="1" placeholder="0.00"
                  value={formData.amount} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Payment Mode</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.paymentMode === 'bank' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" name="paymentMode" value="bank" checked={formData.paymentMode === 'bank'} onChange={handleChange} className="hidden" />
                    <CreditCard className="w-4 h-4" /> Bank
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.paymentMode === 'cash' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <input type="radio" name="paymentMode" value="cash" checked={formData.paymentMode === 'cash'} onChange={handleChange} className="hidden" />
                    <Banknote className="w-4 h-4" /> Cash
                  </label>
                </div>
              </div>

              {/* Reference / Cheque No */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Reference / Cheque No.</label>
                <input 
                  type="text" name="reference" placeholder="e.g. CHQ-123456 or Online Trx ID"
                  value={formData.reference} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Remarks</label>
                <textarea 
                  name="remarks" rows="2" placeholder="Additional details..."
                  value={formData.remarks} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

            </div>
          </form>
        </div>

        {/* Side Panel: Ledger Preview */}
        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col">
          <div className={`bg-slate-50 p-6 md:p-8 flex flex-col justify-between flex-grow`}>
            <div>
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 text-${themeColor}-700`}>
                <FileText className="w-5 h-5" /> Transaction Summary
              </h3>
              
              <div className="space-y-6">
                <div className={`p-5 rounded-xl bg-white border border-slate-200 shadow-sm text-center`}>
                  <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold">Total Amount</p>
                  <p className={`text-3xl font-black text-${themeColor}-600`}>
                    Rs. {formData.amount ? Number(formData.amount).toLocaleString() : '0'}
                  </p>
                </div>

                {/* Accounting Preview */}
                <div className="bg-slate-800 text-white rounded-xl p-5 font-mono text-sm shadow-inner">
                  <p className="text-slate-400 mb-4 text-xs uppercase tracking-widest font-sans border-b border-slate-600 pb-2">Double-Entry Preview</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-emerald-400 font-bold mb-1">DR (Debit)</p>
                      <p className="break-words opacity-90">{ledger.debitAccount}</p>
                    </div>
                    <div>
                      <p className="text-orange-400 font-bold mb-1">CR (Credit)</p>
                      <p className="break-words opacity-90">{ledger.creditAccount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              form="voucher-form" type="submit" disabled={isSaving || !formData.partyId || !formData.amount}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isSaving || !formData.partyId || !formData.amount
                ? 'bg-slate-300 cursor-not-allowed' 
                : `bg-${themeColor}-600 hover:bg-${themeColor}-700 shadow-lg hover:shadow-xl`
              }`}
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Post Voucher to Ledger'}
            </button>
            <p className="text-xs text-center text-slate-400 mt-3">This action will instantly update the Trial Balance.</p>
          </div>
        </div>

      </div>
    </div>
  );
}