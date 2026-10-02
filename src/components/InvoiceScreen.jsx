import React, { useState, useEffect } from 'react';
import { FileCheck, Printer, Download, Plus, ArrowLeft, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function InvoiceScreen() {
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'print'
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    customerId: '',
    dateBilled: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +15 days
  });
  
  const [items, setItems] = useState([
    { description: '', qty: '', rate: '', amount: 0 }
  ]);

  // --- FETCH INVOICES & CUSTOMERS ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        fetch('http://localhost:5000/api/invoices'),
        fetch('http://localhost:5000/api/customers')
      ]);
      if (invRes.ok && custRes.ok) {
        setInvoices(await invRes.json());
        setCustomers(await custRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CALCULATION LOGIC ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'qty' || field === 'rate') {
      const q = Number(newItems[index].qty) || 0;
      const r = Number(newItems[index].rate) || 0;
      newItems[index].amount = q * r;
    }
    setItems(newItems);
  };

  const addItemRow = () => setItems([...items, { description: '', qty: '', rate: '', amount: 0 }]);

  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 18;
  const taxAmount = (subTotal * taxRate) / 100;
  const totalAmount = subTotal + taxAmount;

  // --- SAVE INVOICE TO MONGODB ---
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!formData.customerId || items.length === 0 || !items[0].description) return;
    
    setIsSaving(true);
    const activeCustomer = customers.find(c => c.customerId === formData.customerId);

    try {
      const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: formData.invoiceNumber,
          customerId: formData.customerId,
          customerName: activeCustomer ? activeCustomer.name : 'Unknown',
          customerPhone: activeCustomer ? activeCustomer.phone : '',
          dateBilled: formData.dateBilled,
          dueDate: formData.dueDate,
          items: items.filter(i => i.description !== ''),
          subTotal,
          taxRate,
          taxAmount,
          totalAmount
        })
      });

      if (response.ok) {
        fetchData();
        setViewMode('list');
        // Reset form
        setFormData({ 
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          customerId: '',
          dateBilled: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        setItems([{ description: '', qty: '', rate: '', amount: 0 }]);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  // ==========================================
  // VIEW: PRINT TEMPLATE
  // ==========================================
  if (viewMode === 'print' && selectedInvoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto space-y-6 print:space-y-0">
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition">
              <ArrowLeft className="w-5 h-5" /> Back to List
            </button>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">CMX</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Conmix Construction</h2>
                  <p className="text-sm text-slate-500 mt-1">Super Highway, Karachi, Pakistan</p>
                  <p className="text-sm text-slate-500">NTN: 1234567-8 | STRN: 87654321</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-black text-slate-200 uppercase tracking-widest">Invoice</h1>
                <p className="text-sm font-bold text-slate-800 mt-2">{selectedInvoice.invoiceNumber}</p>
                <p className="text-sm text-slate-500 mt-0.5">Date: {new Date(selectedInvoice.dateBilled).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
                <h3 className="text-lg font-bold text-slate-800">{selectedInvoice.customerName}</h3>
                <p className="text-sm text-slate-600 mt-1">Phone: {selectedInvoice.customerPhone || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</p>
                <h3 className="text-sm font-bold text-slate-800">Net 15 Days</h3>
                <p className="text-sm text-red-600 font-semibold mt-1">Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <table className="w-full text-left mb-8">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="p-3 font-semibold rounded-tl-lg">Description</th>
                  <th className="p-3 font-semibold text-center">Qty</th>
                  <th className="p-3 font-semibold text-right">Rate (Rs)</th>
                  <th className="p-3 font-semibold text-right rounded-tr-lg">Amount (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-4 py-4 font-bold text-slate-800">{item.description}</td>
                    <td className="p-4 font-semibold text-slate-700 text-center">{item.qty.toLocaleString()}</td>
                    <td className="p-4 font-semibold text-slate-700 text-right">{item.rate.toLocaleString()}</td>
                    <td className="p-4 font-black text-slate-800 text-right">{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-12">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-slate-600 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{selectedInvoice.subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm font-semibold">
                  <span>Sales Tax ({selectedInvoice.taxRate}%)</span>
                  <span>{selectedInvoice.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-slate-800 border-t-2 border-slate-800 pt-3 mt-3">
                  <span>Total</span>
                  <span>Rs. {selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="text-center border-t border-slate-200 pt-8 mt-12 print:mt-auto">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Building Today. Creating Tomorrow.</p>
              <p className="text-xs text-slate-500 mt-1">Make all cheques payable to Conmix Construction. Thank you for your business.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: CREATE NEW INVOICE FORM
  // ==========================================
  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Plus className="w-8 h-8 text-blue-600" /> Create Tax Invoice
            </h1>
            <button onClick={() => setViewMode('list')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> Cancel
            </button>
          </div>

          <form onSubmit={handleSaveInvoice} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name *</label>
                <select 
                  required 
                  value={formData.customerId} 
                  onChange={e => setFormData({...formData, customerId: e.target.value})} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="" disabled>Select Customer...</option>
                  {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Billed</label>
                  <input type="date" required value={formData.dateBilled} onChange={e => setFormData({...formData, dateBilled: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                  <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Line Items</h3>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 mb-3 items-start">
                  <div className="flex-1">
                    <input required type="text" placeholder="Description (e.g. 8'' Hollow Block)" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                  <div className="w-24">
                    <input required type="number" placeholder="Qty" min="1" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                  <div className="w-32">
                    <input required type="number" placeholder="Rate" min="0" step="0.01" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                  <div className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-700">
                    {item.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItemRow} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-6">
              <div className="w-64 space-y-3">
                <div className="flex justify-between font-bold text-slate-600"><span>Subtotal:</span><span>Rs. {subTotal.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-slate-600"><span>Tax (18%):</span><span>Rs. {taxAmount.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-xl text-slate-800 pt-2 border-t border-slate-300"><span>Total:</span><span>Rs. {totalAmount.toLocaleString()}</span></div>
              </div>
            </div>

            <button type="submit" disabled={isSaving} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
              {isSaving ? 'Generating Invoice...' : 'Save & Generate Invoice'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MASTER LIST OF INVOICES (Default)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-blue-600" /> Tax Invoices
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage billing and view past invoices.</p>
          </div>
          <button onClick={() => setViewMode('create')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors shadow-md">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Invoice #</th>
                <th className="p-4 font-bold border-b border-slate-200">Customer</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Total Amount</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Status</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500"/> Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No invoices generated yet.</td></tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-600 text-sm">{inv.invoiceNumber}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{inv.customerName}</p>
                      <p className="text-xs text-slate-500">{new Date(inv.dateBilled).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 font-black text-slate-800 text-right">Rs. {inv.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'Unpaid' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setSelectedInvoice(inv); setViewMode('print'); }}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        View & Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}