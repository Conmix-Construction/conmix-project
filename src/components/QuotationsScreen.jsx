import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, FileText, TrendingUp, Plus, Trash2, CheckCircle, Send, User, RefreshCw } from 'lucide-react';

export default function QuotationsScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live Master Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [quoteData, setQuoteData] = useState({
    quoteId: `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [items, setItems] = useState([
    { id: 1, productId: '', qty: '', quotedPrice: '' }
  ]);

  // --- 1. FETCH LIVE CUSTOMERS & INVENTORY ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [custRes, invRes] = await Promise.all([
          fetch('http://localhost:5000/api/customers'),
          fetch('http://localhost:5000/api/inventory')
        ]);
        
        if (custRes.ok && invRes.ok) {
          setCustomers(await custRes.json());
          const allInventory = await invRes.json();
          // Filter to only show items that can be sold
          setProducts(allInventory.filter(item => item.itemType === 'Finished Good' || item.itemType === 'Raw Material'));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productId: '', qty: '', quotedPrice: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-fill suggested price when product is selected
        if (field === 'productId' && value) {
          const selectedProduct = products.find(p => p.itemCode === value);
          if (selectedProduct) {
            updatedItem.quotedPrice = selectedProduct.sellingPrice || 0;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Perform Live Margin Math
  const mathSummary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;

    items.forEach(item => {
      if (item.productId && item.qty > 0 && item.quotedPrice >= 0) {
        const qty = Number(item.qty);
        const price = Number(item.quotedPrice);
        const product = products.find(p => p.itemCode === item.productId);
        const cost = product ? (product.costPrice || 0) : 0; // Guard against missing cost
        
        totalRevenue += (qty * price);
        totalCost += (qty * cost);
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

    return { totalRevenue, totalCost, grossProfit, marginPercentage };
  }, [items, products]);

  // --- 2. SAVE QUOTATION TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quoteData.customerId || items.length === 0 || !items[0].productId) return;
    
    setIsSaving(true);
    const activeCustomer = customers.find(c => c.customerId === quoteData.customerId);

    // Format items to match backend schema
    const formattedItems = items.map(item => {
      const prod = products.find(p => p.itemCode === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.itemName : 'Unknown',
        qty: Number(item.qty),
        unitCost: prod ? (prod.costPrice || 0) : 0,
        quotedPrice: Number(item.quotedPrice)
      };
    });

    try {
      const response = await fetch('http://localhost:5000/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quoteData.quoteId,
          customerId: quoteData.customerId,
          customerName: activeCustomer ? activeCustomer.name : 'Unknown',
          date: quoteData.date,
          validUntil: quoteData.validUntil,
          items: formattedItems,
          totalRevenue: mathSummary.totalRevenue,
          totalCost: mathSummary.totalCost,
          grossProfit: mathSummary.grossProfit,
          marginPercentage: Number(mathSummary.marginPercentage),
          status: 'Draft'
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to save Quotation.");
      }
    } catch (error) {
      console.error("Error saving quotation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setQuoteData({ 
      quoteId: `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setItems([{ id: Date.now(), productId: '', qty: '', quotedPrice: '' }]);
    setIsSubmitted(false);
  };

  const handleWhatsApp = () => {
    const activeCustomer = customers.find(c => c.customerId === quoteData.customerId);
    const name = activeCustomer ? activeCustomer.name : 'Customer';
    const message = `Hello ${name}, your quotation (Ref: ${quoteData.quoteId}) for Rs. ${mathSummary.totalRevenue.toLocaleString()} is ready. Please let us know if you would like to proceed.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isSubmitted) {
    const activeCustomer = customers.find(c => c.customerId === quoteData.customerId);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center border-t-4 border-indigo-600 animate-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Saved!</h2>
          <p className="text-gray-600 mb-2">
            Quote <span className="font-bold text-gray-800">{quoteData.quoteId}</span> generated for {activeCustomer?.name}.
          </p>
          <div className="bg-indigo-50 text-indigo-800 font-semibold p-4 rounded-lg my-6">
            Projected Margin: {mathSummary.marginPercentage}% (Rs. {mathSummary.grossProfit.toLocaleString()})
          </div>
          
          <div className="flex flex-col gap-3">
            <button onClick={handleDownloadPDF} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition shadow">
              <FileText className="w-5 h-5" /> Download PDF Estimate
            </button>
            <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition shadow">
              <Send className="w-5 h-5" /> Send Quote via WhatsApp
            </button>
            <button onClick={resetForm} className="w-full mt-4 text-indigo-600 font-semibold hover:underline">
              Create Another Quote
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Column: Form Details */}
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-400" /> Quotations & Estimates
              </h1>
              <p className="text-slate-300 text-sm mt-1">Price orders with live margin tracking.</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-slate-400">Quote Ref</p>
              <p className="font-mono font-bold text-indigo-300">{quoteData.quoteId}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex-grow">
            {/* Client & Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4"/> Select Customer / Lead
                </label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={quoteData.customerId}
                  onChange={(e) => setQuoteData({...quoteData, customerId: e.target.value})}
                >
                  <option value="" disabled>{isLoadingData ? 'Loading...' : 'Choose client...'}</option>
                  {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Date</label>
                  <input type="date" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 bg-white" value={quoteData.date} onChange={(e) => setQuoteData({...quoteData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Valid Until</label>
                  <input type="date" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 bg-white" value={quoteData.validUntil} onChange={(e) => setQuoteData({...quoteData, validUntil: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Quoted Items */}
            <div className="mb-4 flex justify-between items-end">
              <h3 className="text-lg font-bold text-gray-800">Items to Quote</h3>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => {
                const product = item.productId ? products.find(p => p.itemCode === item.productId) : null;
                const liveCost = product ? (product.costPrice || 0) : 0;
                const lineRevenue = item.qty * item.quotedPrice;
                const lineCost = item.qty * liveCost;
                const lineMargin = lineRevenue > 0 ? (((lineRevenue - lineCost) / lineRevenue) * 100).toFixed(1) : 0;
                const isLoss = lineMargin < 10 && item.productId; // Warn if margin is under 10%

                return (
                  <div key={item.id} className={`p-4 rounded-lg border ${isLoss ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} relative transition-colors`}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      
                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Product</label>
                        <select required className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" value={item.productId} onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}>
                          <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select product...'}</option>
                          {products.map(p => <option key={p.itemCode} value={p.itemCode}>{p.itemName}</option>)}
                        </select>
                        {product && <p className="text-xs text-gray-500 mt-1">Base Cost: Rs. {liveCost} / {product.unitOfMeasure || 'unit'}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                        <input type="number" required min="1" placeholder="0" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Unit Price Quoted</label>
                        <input type="number" required min="0" step="0.01" className={`w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 font-bold outline-none ${isLoss ? 'border-red-400 text-red-700' : 'border-gray-300 text-gray-800'}`} value={item.quotedPrice} onChange={(e) => handleItemChange(item.id, 'quotedPrice', e.target.value)} />
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-center items-end h-full pt-4 md:pt-0">
                         {product && item.qty > 0 ? (
                           <div className="text-right">
                             <p className="text-sm font-bold text-gray-800">Rs. {lineRevenue.toLocaleString()}</p>
                             <p className={`text-xs font-semibold ${isLoss ? 'text-red-600' : 'text-green-600'}`}>Margin: {lineMargin}%</p>
                           </div>
                         ) : null}
                      </div>

                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 shadow-sm transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </form>
        </div>

        {/* Right Column: Live Margin Analysis */}
        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-200 flex flex-col">
          <div className="p-6 md:p-8 flex-grow">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Margin Analysis
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Estimated Cost</p>
                <p className="text-xl font-semibold text-gray-700">Rs. {mathSummary.totalCost.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Based on current BOM & yard stock</p>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Total Quote Value (Revenue)</p>
                <p className="text-3xl font-black text-indigo-700">Rs. {mathSummary.totalRevenue.toLocaleString()}</p>
              </div>

              <div className={`p-4 rounded-lg border ${mathSummary.marginPercentage >= 15 ? 'bg-green-50 border-green-200' : mathSummary.marginPercentage > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-100 border-gray-200'}`}>
                <p className="text-sm font-semibold text-gray-700 mb-1">Projected Gross Profit</p>
                <p className={`text-2xl font-bold ${mathSummary.marginPercentage >= 15 ? 'text-green-700' : mathSummary.marginPercentage > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
                  Rs. {mathSummary.grossProfit.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${mathSummary.marginPercentage >= 15 ? 'bg-green-600' : mathSummary.marginPercentage > 0 ? 'bg-orange-500' : 'bg-gray-400'}`}>
                    {mathSummary.marginPercentage}% Margin
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleSubmit}
              disabled={items.length === 0 || !items[0].productId || !quoteData.customerId || isSaving}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-lg shadow-lg transition-all ${
                items.length === 0 || !items[0].productId || !quoteData.customerId || isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl'
              }`}
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isSaving ? 'Processing...' : 'Save Estimate & Send'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">Approved quotes can be 1-click converted to Delivery Challans.</p>
          </div>
        </div>

      </div>
    </div>
  );
}