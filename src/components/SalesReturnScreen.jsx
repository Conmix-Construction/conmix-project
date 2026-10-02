import React, { useState, useEffect } from 'react';
import { 
  CornerUpLeft, FileMinus, Search, Plus, Trash2, 
  CheckCircle, AlertTriangle, Building, Calculator, 
  RefreshCw, PackageMinus 
} from 'lucide-react';

export default function SalesReturnScreen() {
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceRef: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Damaged in transit / Broken edges'
  });

  const [items, setItems] = useState([
    { id: 1, productId: '', qty: '', unitPrice: '', condition: 'damaged' }
  ]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState('');

  // Live Database State
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // --- 1. FETCH LIVE CUSTOMERS & PRODUCTS ---
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [custRes, invRes] = await Promise.all([
          fetch('http://localhost:5000/api/customers'),
          fetch('http://localhost:5000/api/inventory')
        ]);
        
        if (custRes.ok && invRes.ok) {
          setCustomers(await custRes.json());
          const allInventory = await invRes.json();
          // Only show finished goods for sales returns
          setProducts(allInventory.filter(item => item.itemType === 'Finished Good'));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productId: '', qty: '', unitPrice: '', condition: 'damaged' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'productId' && value) {
          // Auto-fill the unit price based on the product's selling price
          const prod = products.find(p => p.itemCode === value);
          if (prod) updatedItem.unitPrice = prod.sellingPrice || 0;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const totalCreditAmount = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  const activeCustomer = customers.find(c => c.customerId === formData.customerId);

  // --- 2. SUBMIT TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || items.length === 0 || !items[0].productId) return;
    
    setIsProcessing(true);
    const newNoteId = `CN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const formattedItems = items.map(item => {
      const prod = products.find(p => p.itemCode === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.itemName : 'Unknown',
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        condition: item.condition,
        amount: Number(item.qty) * Number(item.unitPrice)
      };
    });

    try {
      const response = await fetch('http://localhost:5000/api/sales-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditNoteId: newNoteId,
          customerId: formData.customerId,
          customerName: activeCustomer ? activeCustomer.name : 'Unknown',
          invoiceRef: formData.invoiceRef,
          date: formData.date,
          reason: formData.reason,
          items: formattedItems,
          totalCreditAmount: totalCreditAmount
        })
      });

      if (response.ok) {
        setSavedNoteId(newNoteId);
        setIsSubmitted(true);
      } else {
        alert("Failed to process Sales Return.");
      }
    } catch (error) {
      console.error("Error saving return:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({ customerId: '', invoiceRef: '', date: new Date().toISOString().split('T')[0], reason: 'Damaged in transit / Broken edges' });
    setItems([{ id: 1, productId: '', qty: '', unitPrice: '', condition: 'damaged' }]);
    setIsSubmitted(false);
    setSavedNoteId('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border-t-4 border-red-500 text-center animate-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Credit Note Issued!</h2>
          <p className="text-slate-600 mb-6">
            Return processed for <span className="font-bold">{activeCustomer?.name}</span>.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-5 mb-8 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Credit Note #</span>
              <span className="font-bold text-red-600 font-mono text-lg">{savedNoteId}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-slate-600 font-medium">Customer Account Credited:</span>
              <span className="font-black text-slate-800">Rs. {totalCreditAmount.toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={resetForm}
            className="w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition shadow-md"
          >
            Process Another Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CornerUpLeft className="w-6 h-6 text-red-400" /> Sales Returns & Credit Notes
              </h1>
              <p className="text-slate-300 text-sm mt-1">Process rejected goods, reduce receivables, and adjust inventory.</p>
            </div>
          </div>

          <form id="return-form" onSubmit={handleSubmit} className="p-6 md:p-8 flex-grow">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-red-50/50 p-5 rounded-xl border border-red-100">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400"/> Customer Name
                </label>
                <select 
                  required name="customerId" value={formData.customerId} onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select customer...'}</option>
                  {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Original Invoice / DC Ref.</label>
                <div className="relative">
                  <input 
                    type="text" required name="invoiceRef" value={formData.invoiceRef} onChange={handleInputChange}
                    placeholder="e.g., INV-2026-089"
                    className="w-full border border-slate-300 rounded-lg p-2.5 pl-9 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Return</label>
                <input 
                  type="date" required name="date" value={formData.date} onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Return</label>
                <select 
                  required name="reason" value={formData.reason} onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option>Damaged in transit / Broken edges</option>
                  <option>Failed Quality Control at Site</option>
                  <option>Customer Over-ordered (Excess goods)</option>
                  <option>Wrong item dispatched</option>
                </select>
              </div>
            </div>

            <div className="mb-4 flex justify-between items-end">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PackageMinus className="w-5 h-5 text-slate-500"/> Items Returned
              </h3>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm relative group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Product Description</label>
                      <select required className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white" value={item.productId} onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}>
                        <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select block type...'}</option>
                        {products.map(p => <option key={p.itemCode} value={p.itemCode}>{p.itemName}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Return Qty</label>
                      <input type="number" required min="1" placeholder="0" className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none font-bold text-slate-800" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Billed Rate</label>
                      <input type="number" required min="0" step="0.01" className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Condition / Action</label>
                      <select required className={`w-full border rounded p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none font-semibold ${item.condition === 'damaged' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-green-50 border-green-200 text-green-800'}`} value={item.condition} onChange={(e) => handleItemChange(item.id, 'condition', e.target.value)}>
                        <option value="damaged">Damaged (Send to Wastage)</option>
                        <option value="intact">Intact (Restock to Yard)</option>
                      </select>
                    </div>

                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-slate-100 text-slate-400 p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 shadow-sm transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-200 flex flex-col">
          <div className="p-6 md:p-8 flex-grow">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <FileMinus className="w-5 h-5 text-red-600" /> Credit Note Summary
            </h3>

            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Refund Value</p>
                <p className="text-3xl font-black text-red-600">Rs. {totalCreditAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-2">To be credited to customer's account</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Automated Ledger Impacts</h4>
                
                <div className="bg-blue-50/80 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                  <Calculator className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Finance (Khata)</p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Decreases customer's <span className="font-bold">Accounts Receivable</span> by Rs. {totalCreditAmount.toLocaleString()}. Decreases <span className="font-bold">Sales Revenue</span>.
                    </p>
                  </div>
                </div>

                {items.some(i => i.productId) && (
                  <div className={`${items.some(i => i.condition === 'damaged') ? 'bg-orange-50/80 border-orange-100' : 'bg-green-50/80 border-green-100'} p-3 rounded-lg flex items-start gap-3 transition-colors`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${items.some(i => i.condition === 'damaged') ? 'text-orange-500' : 'text-green-500'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${items.some(i => i.condition === 'damaged') ? 'text-orange-900' : 'text-green-900'}`}>Inventory Routing</p>
                      <ul className={`text-xs mt-1 leading-relaxed space-y-1 ${items.some(i => i.condition === 'damaged') ? 'text-orange-800' : 'text-green-800'}`}>
                        {items.filter(i => i.condition === 'intact' && i.qty).length > 0 && (
                           <li>• <span className="font-bold">+{items.filter(i => i.condition === 'intact').reduce((s,i) => s + parseFloat(i.qty||0), 0)} units</span> added back to Finished Goods Stock.</li>
                        )}
                        {items.filter(i => i.condition === 'damaged' && i.qty).length > 0 && (
                           <li>• <span className="font-bold">{items.filter(i => i.condition === 'damaged').reduce((s,i) => s + parseFloat(i.qty||0), 0)} units</span> written off to Inventory Wastage Account.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              form="return-form"
              type="submit"
              disabled={isProcessing || totalCreditAmount === 0 || !formData.customerId}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-lg shadow-lg transition-all ${
                isProcessing || totalCreditAmount === 0 || !formData.customerId
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-xl'
              }`}
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isProcessing ? 'Processing Return...' : 'Generate Credit Note'}
            </button>
            <p className="text-xs text-center text-slate-400 mt-3">Action cannot be reversed once posted to ledgers.</p>
          </div>
        </div>

      </div>
    </div>
  );
}