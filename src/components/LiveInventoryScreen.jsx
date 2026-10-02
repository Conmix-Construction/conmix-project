import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, TrendingUp, 
  RefreshCw, X, CheckCircle2, Box, Layers
} from 'lucide-react';

export default function LiveInventory() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State matching our Enterprise MongoDB Schema
  const initialForm = {
    itemCode: '', itemName: '', itemType: 'Finished Good', category: 'Solid',
    dimensions: '', strength: '', weightPerUnit: '', currentStock: '',
    minimumStockLevel: '1000', unitOfMeasure: 'Nos', costPrice: '', sellingPrice: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // --- 1. FETCH DATA FROM MONGODB ---
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      // Calls your Node.js server
      const response = await fetch('http://localhost:5000/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Failed to connect to database.', type: 'error' } }));
    } finally {
      setIsLoading(false);
    }
  };

  // Load data as soon as the screen opens
  useEffect(() => {
    fetchInventory();
  }, []);

  // --- 2. ADD NEW ITEM TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          weightPerUnit: Number(formData.weightPerUnit),
          currentStock: Number(formData.currentStock),
          minimumStockLevel: Number(formData.minimumStockLevel),
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
        })
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Item saved to database!', type: 'success' } }));
        setFormData(initialForm);
        setIsAddingMode(false);
        fetchInventory(); // Refresh the list
      } else {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Failed to save item. Check Item Code.', type: 'error' } }));
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter items based on search
  const filteredInventory = inventory.filter(item => 
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Live Inventory
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage database-synced yard stock</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchInventory} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setIsAddingMode(!isAddingMode)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200">
            {isAddingMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAddingMode ? 'Cancel' : 'Add New Item'}
          </button>
        </div>
      </div>

      {/* Add New Item Form (Slides down when button clicked) */}
      {isAddingMode && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Box className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Register New Inventory Item</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Code *</label>
                <input required type="text" name="itemCode" value={formData.itemCode} onChange={handleInputChange} placeholder="e.g., BLK-SOL-4IN" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name *</label>
                <input required type="text" name="itemName" value={formData.itemName} onChange={handleInputChange} placeholder="e.g., 4 Inch Solid Block" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Type</label>
                <select name="itemType" value={formData.itemType} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option>Finished Good</option>
                  <option>Raw Material</option>
                  <option>Consumable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option>Solid</option><option>Hollow</option><option>Paver</option><option>Cement</option><option>Crush</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight Per Unit (KG)</label>
                <input type="number" name="weightPerUnit" value={formData.weightPerUnit} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Stock *</label>
                <input required type="number" name="currentStock" value={formData.currentStock} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit of Measure</label>
                <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option>Nos</option><option>Tons</option><option>Bags</option><option>Liters</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cost Price (Rs.) *</label>
                <input required type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selling Price (Rs.) *</label>
                <input required type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Save to Database
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Database Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Search database..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <Layers className="w-4 h-4 text-blue-500" /> Total DB Entries: {inventory.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Item Code</th>
                <th className="p-4 font-bold border-b border-slate-200">Name & Category</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Current Stock</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Unit Price</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Fetching from MongoDB...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                    No items found in the database.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{item.itemCode}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.itemType} • {item.category}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.currentStock <= item.minimumStockLevel && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" title="Low Stock" />
                        )}
                        <span className={`font-black ${item.currentStock <= item.minimumStockLevel ? 'text-amber-600' : 'text-slate-800'}`}>
                          {item.currentStock.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">{item.unitOfMeasure}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      Rs. {item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        {item.status}
                      </span>
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