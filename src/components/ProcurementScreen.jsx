import React, { useState, useEffect } from 'react';
import { PackagePlus, Truck, DollarSign, CheckCircle, Calculator, Building, FileText, RefreshCw } from 'lucide-react';

export default function ProcurementScreen() {
  const [formData, setFormData] = useState({
    supplierId: '',
    materialId: '',
    quantity: '',
    unitPrice: '',
    paymentMethod: 'credit'
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
          // Only show items categorized as Raw Materials or Consumables
          setMaterials(allInventory.filter(item => item.itemType !== 'Finished Good'));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    return qty * price;
  };

  const selectedMaterial = materials.find(m => m.itemCode === formData.materialId);
  const selectedSupplier = suppliers.find(s => s.supplierId === formData.supplierId);

  // --- 2. POST TO BACKEND ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier || !selectedMaterial) return;
    
    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierId: selectedSupplier.supplierId,
          supplierName: selectedSupplier.name,
          materialId: selectedMaterial.itemCode,
          materialName: selectedMaterial.itemName,
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
          totalValue: calculateTotal(),
          paymentMethod: formData.paymentMethod
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Failed to post procurement:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ supplierId: '', materialId: '', quantity: '', unitPrice: '', paymentMethod: 'credit' });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-green-500 animate-in zoom-in duration-300">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Receipt Logged Successfully</h2>
          <p className="text-slate-600 mb-6">Inventory has been updated and the financial ledger has been adjusted.</p>
          
          <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left border border-slate-200">
            <p className="text-sm text-slate-600 flex justify-between mb-2">
              <span>Total Amount:</span> 
              <span className="font-bold text-slate-800">Rs. {calculateTotal().toLocaleString()}</span>
            </p>
            <p className="text-sm text-slate-600 flex justify-between">
              <span>Payment Status:</span> 
              <span className={`font-bold ${formData.paymentMethod === 'cash' ? 'text-green-600' : 'text-orange-600'}`}>
                {formData.paymentMethod === 'cash' ? 'Paid (Cash)' : 'Added to Payables'}
              </span>
            </p>
          </div>

          <button 
            onClick={resetForm}
            className="w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition"
          >
            Log Another Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PackagePlus className="w-6 h-6" /> Procurement & Receiving
            </h1>
            <p className="text-slate-300 text-sm mt-1">Log inbound raw materials and supplier invoices</p>
          </div>
          <div className="hidden md:block text-right text-sm text-slate-300">
            <p>Date: <span className="font-bold text-white">{new Date().toLocaleDateString()}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Supplier */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" /> Supplier
                </label>
                <select 
                  name="supplierId" required value={formData.supplierId} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select Supplier...'}</option>
                  {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
                </select>
              </div>

              {/* Material */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-500" /> Raw Material
                </label>
                <select 
                  name="materialId" required value={formData.materialId} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  <option value="" disabled>{isLoadingData ? 'Loading...' : 'Select Material...'}</option>
                  {materials.map(m => <option key={m.itemCode} value={m.itemCode}>{m.itemName}</option>)}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Quantity Received</label>
                <div className="relative">
                  <input 
                    type="number" name="quantity" required min="1" step="any"
                    value={formData.quantity} onChange={handleChange} placeholder="0"
                    className="w-full border border-slate-300 rounded-lg p-3 pr-16 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 font-medium text-sm">
                    {selectedMaterial ? selectedMaterial.unitOfMeasure : 'Units'}
                  </div>
                </div>
              </div>

              {/* Unit Price */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Unit Price (Rs)</label>
                <input 
                  type="number" name="unitPrice" required min="1" step="any"
                  value={formData.unitPrice} onChange={handleChange} placeholder="0.00"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-4 border-t border-slate-200">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">Payment Method</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition ${formData.paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="paymentMethod" value="credit" checked={formData.paymentMethod === 'credit'} onChange={handleChange} className="hidden" />
                  <FileText className="w-5 h-5" /> Accounts Payable (Credit)
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition ${formData.paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="paymentMethod" value="cash" checked={formData.paymentMethod === 'cash'} onChange={handleChange} className="hidden" />
                  <DollarSign className="w-5 h-5" /> Cash on Delivery
                </label>
              </div>
            </div>
          </div>

          {/* Real-time Summary Panel */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" /> Transaction Summary
              </h3>
              
              <div className="space-y-3 text-sm text-slate-600 mb-6">
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span className="font-semibold text-slate-800">{selectedMaterial ? selectedMaterial.itemName : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="font-semibold text-slate-800">{formData.quantity || '0'} {selectedMaterial ? selectedMaterial.unitOfMeasure : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-semibold text-slate-800">Rs. {formData.unitPrice || '0'}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Value:</span>
                  <span className="text-2xl font-bold text-blue-600">Rs. {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Ledger Impact Info */}
              <div className="bg-blue-100/50 p-3 rounded-lg border border-blue-100 mb-6">
                <p className="text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wider">Automated Ledger Entry</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li><span className="font-bold">Debit:</span> Raw Material Inventory (+Rs. {calculateTotal().toLocaleString()})</li>
                  <li><span className="font-bold">Credit:</span> {formData.paymentMethod === 'cash' ? 'Cash Account' : 'Accounts Payable'} (-Rs. {calculateTotal().toLocaleString()})</li>
                </ul>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSaving || !formData.supplierId || !formData.materialId || !formData.quantity || !formData.unitPrice}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isSaving || !formData.supplierId || !formData.materialId || !formData.quantity || !formData.unitPrice
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isSaving ? 'Processing...' : 'Confirm & Post to Ledger'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}