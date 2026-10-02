import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, FileText, CheckCircle, Search, RefreshCw, MapPin, Printer } from 'lucide-react';

export default function DeliveryChallan() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);          
  
  // Loading States
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);

  // Live Data States
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [fleet, setFleet] = useState([]);
  
  const [challanData, setChallanData] = useState({
    challanNo: `CHL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    customer: '',
    truckNo: '',
  });

  const [items, setItems] = useState([
    { id: 1, qty: '', product: '', remarks: '' }
  ]);

  // --- 1. FETCH LIVE DATA FROM DATABASE ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const invRes = await fetch('http://localhost:5000/api/inventory');
        if (invRes.ok) {
          const invData = await invRes.json();
          const formattedStock = invData.map(item => 
            `${item.itemName} - [Stock: ${item.currentStock}]`
          );
          setInventory(formattedStock);
        }
        setInventoryLoading(false);

        const partyRes = await fetch('http://localhost:5000/api/parties');
        if (partyRes.ok) {
          const partyData = await partyRes.json();
          const customerList = partyData.filter(p => p.type === 'Customer' || p.type === 'Both');
          setCustomers(customerList);
        }

        const fleetRes = await fetch('http://localhost:5000/api/fleet');
        if (fleetRes.ok) {
          const fleetData = await fleetRes.json();
          setFleet(fleetData);
        }
        setDropdownsLoading(false);

      } catch (err) {
        console.error("Failed to load master data", err);
        setInventoryLoading(false);
        setDropdownsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), qty: '', product: '', remarks: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // --- 2. SAVE CHALLAN TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/challans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challanNo: challanData.challanNo,
          date: challanData.date,
          customer: challanData.customer,
          truckNo: challanData.truckNo,
          items: items.map(i => ({ product: i.product, qty: Number(i.qty), remarks: i.remarks }))
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError('Failed to save Challan. Please try again.');
      }
    } catch (err) {
      setError('Server connection error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setChallanData({ 
      challanNo: `CHL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0], 
      customer: '', 
      truckNo: '' 
    });
    setItems([{ id: Date.now(), qty: '', product: '', remarks: '' }]);
    setIsSubmitted(false);
  };

  // ==========================================
  // PRINTABLE CHALLAN SUCCESS SCREEN
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center font-sans">
        
        {/* Action Bar - Hidden During Print */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">Challan Successfully Generated</h2>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={resetForm}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-center"
            >
              Create New
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable Area - Standardized A4/A5 Formatting */}
        <div className="w-full max-w-4xl bg-white p-10 md:p-14 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:w-full">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">CONMIX CONSTRUCTION</h1>
              <p className="text-sm font-semibold text-slate-600 mt-1">Near Usman Shah Mazar, 8 Km Gadap Town, Karachi</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest">Delivery Challan</h2>
            </div>
          </div>

          {/* Logistics Metadata */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billed & Delivered To:</p>
              <p className="text-lg font-black text-slate-900">{challanData.customer}</p>
            </div>
            <div className="space-y-1.5 text-right">
              <p className="text-sm"><span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mr-2">Challan No:</span> <span className="font-bold text-slate-900">{challanData.challanNo}</span></p>
              <p className="text-sm"><span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mr-2">Dispatch Date:</span> <span className="font-bold text-slate-900">{challanData.date}</span></p>
              <p className="text-sm"><span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mr-2">Vehicle / Truck No:</span> <span className="font-bold text-slate-900">{challanData.truckNo}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-3 w-24 text-xs font-black uppercase tracking-wider text-slate-800">Qty</th>
                  <th className="py-3 text-xs font-black uppercase tracking-wider text-slate-800">Description of Goods</th>
                  <th className="py-3 w-1/3 text-xs font-black uppercase tracking-wider text-slate-800">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200">
                    <td className="py-4 text-lg font-black text-slate-900">{item.qty}</td>
                    <td className="py-4 text-sm font-bold text-slate-800 uppercase">{item.product.split(' - ')[0]}</td>
                    <td className="py-4 text-sm font-semibold text-slate-600">{item.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-3 gap-8 pt-24 mt-8">
            <div className="text-center border-t-2 border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Authorized By</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">Conmix Dispatcher</p>
            </div>
            <div className="text-center border-t-2 border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Driver Signature</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">Carrier / Transporter</p>
            </div>
            <div className="text-center border-t-2 border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Receiver Signature</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">Goods received in good condition</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD DATA ENTRY FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" /> Conmix Construction
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 flex items-center gap-1 uppercase tracking-wider">
              <MapPin className="w-3 h-3" /> Near Usman Shah Mazar, 8 Km Gadap Town, Karachi
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Challan No.</p>
            <p className="text-xl font-mono font-bold text-yellow-400">{challanData.challanNo}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          {/* Top Section: Logistics Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
                value={challanData.date}
                onChange={(e) => setChallanData({...challanData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
              <div className="relative">
                <select 
                  required
                  className="w-full border border-slate-300 rounded-md p-2.5 appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
                  value={challanData.customer}
                  onChange={(e) => setChallanData({...challanData, customer: e.target.value})}
                >
                  <option value="" disabled>{dropdownsLoading ? 'Loading...' : 'Select Customer...'}</option>
                  {customers.map(c => <option key={c._id || c.companyName} value={c.companyName}>{c.companyName}</option>)}
                </select>
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Truck No.</label>
              <div className="relative">
                <select 
                  required
                  className="w-full border border-slate-300 rounded-md p-2.5 appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
                  value={challanData.truckNo}
                  onChange={(e) => setChallanData({...challanData, truckNo: e.target.value})}
                >
                  <option value="" disabled>{dropdownsLoading ? 'Loading...' : 'Select Fleet Asset...'}</option>
                  {fleet.length > 0 ? (
                    fleet.map(f => <option key={f._id || f.assetName} value={f.assetName || f.vehicleNo}>{f.assetName || f.vehicleNo}</option>)
                  ) : (
                    <option value="KHI-1234">KHI-1234 (Temporary)</option> // Fallback until fleet is populated
                  )}
                </select>
                <Truck className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Middle Section: Line Items */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Dispatch Items
                {inventoryLoading && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
              </h2>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition shadow-sm border border-blue-100"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
            
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-24 text-[11px] font-black uppercase tracking-wider text-slate-500">QTY</th>
                    <th className="p-3 text-[11px] font-black uppercase tracking-wider text-slate-500">DESCRIPTION (Select from Live Stock)</th>
                    <th className="p-3 w-1/3 text-[11px] font-black uppercase tracking-wider text-slate-500">REMARKS</th>
                    <th className="p-3 w-12 text-center text-sm font-semibold text-slate-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50 transition">
                      <td className="p-2">
                        <input 
                          type="number" 
                          required min="1" placeholder="0"
                          className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-center text-sm font-bold"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <select 
                          required
                          className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
                          value={item.product}
                          onChange={(e) => handleItemChange(item.id, 'product', e.target.value)}
                        >
                          <option value="" disabled>
                            {inventoryLoading ? 'Loading stock...' : 'Select material...'}
                          </option>
                          {inventory.length > 0 
                            ? inventory.map(inv => <option key={inv} value={inv}>{inv}</option>)
                            : <option disabled>No inventory available</option>
                          }
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          placeholder="Optional notes"
                          className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className={`p-1.5 rounded ${items.length > 1 ? 'text-red-500 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Terms & Submit */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-200 mt-8 gap-4">
            <div className="text-xs font-medium text-slate-500 max-w-lg">
              <p>Goods once delivered will not be taken back or exchanged.</p>
              <p>By dispatching, you confirm loading accuracy against active yard stock.</p>
              {error && <p className="text-red-600 font-bold mt-2 flex items-center gap-1"><Search className="w-3 h-3"/> {error}</p>}
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto flex items-center justify-center gap-2 font-bold py-3 px-8 rounded-lg shadow-lg transition-all ${
                isLoading 
                  ? 'bg-slate-400 cursor-not-allowed text-slate-100' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
              {isLoading ? 'Processing Dispatch...' : 'Generate & Dispatch Truck'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}