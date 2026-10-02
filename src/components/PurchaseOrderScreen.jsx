import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Building, Calendar, Plus, Trash2, 
  CheckCircle, FileText, Send, Printer, Info, RefreshCw
} from 'lucide-react';

export default function PurchaseOrderScreen() {
  const [poData, setPoData] = useState({
    poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: ''
  });

  const [items, setItems] = useState([
    { id: 1, materialId: '', qty: '', unitPrice: '' }
  ]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Live Master Data
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // --- 1. FETCH LIVE SUPPLIERS & RAW MATERIALS ---
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [supRes, invRes] = await Promise.all([
          fetch('http://localhost:5000/api/suppliers'),
          fetch('http://localhost:5000/api/inventory')
        ]);
        
        if (supRes.ok && invRes.ok) {
          setSuppliers(await supRes.json());
          const allInventory = await invRes.json();
          setRawMaterials(allInventory.filter(item => item.itemType !== 'Finished Good'));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), materialId: '', qty: '', unitPrice: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'materialId' && value) {
          // Auto-fill the unit price based on the inventory cost price
          const selectedMat = rawMaterials.find(m => m.itemCode === value);
          updatedItem.unitPrice = selectedMat ? selectedMat.costPrice || selectedMat.sellingPrice : 0;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const mathSummary = useMemo(() => {
    let totalCommitment = 0;
    items.forEach(item => {
      if (item.materialId && item.qty > 0 && item.unitPrice >= 0) {
        totalCommitment += (Number(item.qty) * Number(item.unitPrice));
      }
    });
    return { totalCommitment };
  }, [items]);

  // --- 2. SUBMIT TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poData.supplierId || items.length === 0 || !items[0].materialId) return;
    
    setIsSaving(true);
    const activeSupplier = suppliers.find(s => s.supplierId === poData.supplierId);

    const formattedItems = items.map(item => {
      const mat = rawMaterials.find(m => m.itemCode === item.materialId);
      return {
        materialId: item.materialId,
        materialName: mat ? mat.itemName : 'Unknown',
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.qty) * Number(item.unitPrice)
      };
    });

    try {
      const response = await fetch('http://localhost:5000/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...poData,
          supplierName: activeSupplier ? activeSupplier.name : 'Unknown',
          items: formattedItems,
          totalAmount: mathSummary.totalCommitment
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to save Purchase Order.");
      }
    } catch (error) {
      console.error("Error saving PO:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setPoData({ 
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: '', 
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: '' 
    });
    setItems([{ id: Date.now(), materialId: '', qty: '', unitPrice: '' }]);
    setIsSubmitted(false);
  };

  const activeSupplier = suppliers.find(s => s.supplierId === poData.supplierId);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-t-4 border-blue-600 animate-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Purchase Order Issued!</h2>
          <p className="text-slate-600 mb-2">
            PO <span className="font-bold text-slate-800">{poData.poNumber}</span> generated for {activeSupplier?.name}.
          </p>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg my-6 text-left border border-blue-100 space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Financial Commitment:</span>
              <span>Rs. {mathSummary.totalCommitment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Expected Delivery:</span>
              <span>{new Date(poData.expectedDelivery).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition shadow">
              <Printer className="w-5 h-5" /> Print PO Document
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition shadow">
              <Send className="w-5 h-5" /> Send to Vendor via WhatsApp
            </button>
            <button onClick={resetForm} className="w-full mt-4 text-blue-600 font-semibold hover:underline">
              Create Another PO
            </button>
          </div>
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
                <ShoppingCart className="w-6 h-6 text-blue-400" /> Purchase Orders (PO)
              </h1>
              <p className="text-slate-300 text-sm mt-1">Issue official orders to vendors to lock in rates & quantities.</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-slate-400">PO Ref</p>
              <p className="font-mono font-bold text-blue-300">{poData.poNumber}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4 text-slate-400"/> Select Vendor / Supplier
                </label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={poData.supplierId}
                  onChange={(e) => setPoData({...poData, supplierId: e.target.value})}
                >
                  <option value="" disabled>{isLoadingData ? 'Loading...' : 'Choose vendor...'}</option>
                  {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Order Date</label>
                <input type="date" required className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white outline-none" value={poData.orderDate} onChange={(e) => setPoData({...poData, orderDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Delivery By</label>
                <input type="date" required className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white outline-none" value={poData.expectedDelivery} onChange={(e) => setPoData({...poData, expectedDelivery: e.target.value})} />
              </div>
            </div>

            <div className="mb-4 flex justify-between items-end">
              <h3 className="text-lg font-bold text-slate-800">Materials Requested</h3>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition">
                <Plus className="w-4 h-4" /> Add Material
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => {
                const material = item.materialId ? rawMaterials.find(m => m.itemCode === item.materialId) : null;
                const lineTotal = item.qty * item.unitPrice;

                return (
                  <div key={item.id} className="p-4 rounded-lg border border-slate-200 bg-white relative group">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      
                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Raw Material</label>
                        <select required className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white outline-none" value={item.materialId} onChange={(e) => handleItemChange(item.id, 'materialId', e.target.value)}>
                          <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select material...'}</option>
                          {rawMaterials.map(m => <option key={m.itemCode} value={m.itemCode}>{m.itemName}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Qty Ordered</label>
                        <div className="relative">
                          <input type="number" required min="1" placeholder="0" className="w-full border border-slate-300 rounded p-2 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} />
                          <div className="absolute right-3 top-2 text-xs text-slate-400 font-bold">{material?.unitOfMeasure || '-'}</div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Agreed Rate</label>
                        <input type="number" required min="0" step="0.01" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 outline-none" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} />
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-center items-end h-full pt-4 md:pt-0">
                         {material && item.qty > 0 ? (
                           <div className="text-right">
                             <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Amount</p>
                             <p className="text-sm font-bold text-slate-800">Rs. {lineTotal.toLocaleString()}</p>
                           </div>
                         ) : null}
                      </div>

                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-slate-100 text-slate-400 p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 shadow-sm transition opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Terms & Conditions / Remarks</label>
                <textarea className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows="2" placeholder="e.g. Delivery must be before 8 AM..." value={poData.remarks} onChange={e => setPoData({...poData, remarks: e.target.value})}></textarea>
            </div>
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-slate-50 border-l border-slate-200 flex flex-col">
          <div className="p-6 md:p-8 flex-grow">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-blue-600" /> Order Summary
            </h3>

            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-1">Total PO Value</p>
                <p className="text-3xl font-black text-slate-800">Rs. {mathSummary.totalCommitment.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-2">Gross amount to be paid upon fulfillment.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">ERP Accounting Rule</p>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Issuing a Purchase Order creates a <strong>Financial Commitment</strong> but does <em>not</em> impact the General Ledger. 
                    <br/><br/>
                    Accounts Payable (Khata) will only be credited when the goods are physically received at the yard using the <span className="font-semibold">Procurement Module</span>.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleSubmit}
              disabled={items.length === 0 || !items[0].materialId || !poData.supplierId || isSaving}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-lg shadow-lg transition-all ${
                items.length === 0 || !items[0].materialId || !poData.supplierId || isSaving
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <><CheckCircle className="w-5 h-5" /> Issue Purchase Order</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}