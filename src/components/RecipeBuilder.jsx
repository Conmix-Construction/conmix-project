import React, { useState, useEffect, useMemo } from 'react';
import { Beaker, Scale, Plus, Save, Settings2, Trash2, RefreshCw } from 'lucide-react';

export default function RecipeBuilder() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [targetProduct, setTargetProduct] = useState('');
  const [yieldPerBatch, setYieldPerBatch] = useState(120);
  const [ingredients, setIngredients] = useState([
    { id: 1, materialId: '', qty: '' }
  ]);

  // --- 1. FETCH LIVE INVENTORY ---
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.filter(i => i.itemType === 'Finished Good'));
          setRawMaterials(data.filter(i => i.itemType !== 'Finished Good')); // Raw Materials & Consumables
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleAddRow = () => {
    setIngredients([...ingredients, { id: Date.now(), materialId: '', qty: '' }]);
  };

  const handleRemoveRow = (id) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(item => item.id !== id));
    }
  };

  const handleIngredientChange = (id, field, value) => {
    setIngredients(ingredients.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // --- LIVE COST CALCULATION ---
  const estimatedCost = useMemo(() => {
    let totalBatchCost = 0;
    
    ingredients.forEach(item => {
      if (item.materialId && item.qty) {
        const material = rawMaterials.find(m => m.itemCode === item.materialId);
        if (material) {
          // Fallback to sellingPrice if costPrice isn't set
          const unitCost = material.costPrice || material.sellingPrice || 0; 
          totalBatchCost += (Number(item.qty) * unitCost);
        }
      }
    });

    return yieldPerBatch > 0 ? (totalBatchCost / yieldPerBatch) : 0;
  }, [ingredients, rawMaterials, yieldPerBatch]);

  // --- 2. SAVE RECIPE TO MONGODB ---
  const handleSave = async () => {
    if (!targetProduct || ingredients.length === 0 || !ingredients[0].materialId) {
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: 'Please select a product and add ingredients.', type: 'error' } 
      }));
      return;
    }

    setIsSaving(true);
    const prodDetails = products.find(p => p.itemCode === targetProduct);

    const formattedIngredients = ingredients.filter(i => i.materialId).map(i => {
      const mat = rawMaterials.find(m => m.itemCode === i.materialId);
      return {
        materialId: i.materialId,
        materialName: mat ? mat.itemName : 'Unknown',
        qty: Number(i.qty),
        unit: mat ? mat.unitOfMeasure : 'Units'
      };
    });

    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetProduct,
          productName: prodDetails ? prodDetails.itemName : 'Unknown',
          yieldPerBatch: Number(yieldPerBatch),
          ingredients: formattedIngredients,
          estimatedCostPerUnit: estimatedCost
        })
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { 
          detail: { message: 'Success! Recipe (BOM) has been saved to the database.', type: 'success' } 
        }));
        // Reset form
        setTargetProduct('');
        setYieldPerBatch(120);
        setIngredients([{ id: Date.now(), materialId: '', qty: '' }]);
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                Recipe Builder (BOM)
                {isLoading && <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Define Bill of Materials for automatic inventory deduction.</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm ${
              isSaving || isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
            }`}
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            {isSaving ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Settings Column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings2 className="w-4 h-4 text-slate-400" /> Master Configuration
            </h3>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Target Product (Finished Good)</label>
              <select 
                className="w-full mt-1.5 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
              >
                <option value="" disabled>Select product...</option>
                {products.map(p => <option key={p.itemCode} value={p.itemCode}>{p.itemName}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Yield Per Batch</label>
              <input 
                type="number" min="1"
                value={yieldPerBatch}
                onChange={(e) => setYieldPerBatch(e.target.value)}
                className="w-full mt-1.5 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Estimated Cost / Unit</p>
              <p className="text-3xl font-black text-purple-900">
                Rs. {estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Recipe List Column */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-500" /> Ingredients per Batch
              </h3>
              <button 
                onClick={handleAddRow}
                className="text-sm font-bold text-purple-600 hover:text-purple-800 bg-purple-100/50 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="p-2 flex-grow overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-2">Raw Material</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((row) => {
                    const material = rawMaterials.find(m => m.itemCode === row.materialId);
                    
                    return (
                      <tr key={row.id} className="bg-white group">
                        <td className="px-4 py-2">
                          <select 
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
                            value={row.materialId}
                            onChange={(e) => handleIngredientChange(row.id, 'materialId', e.target.value)}
                          >
                            <option value="" disabled>Select material...</option>
                            {rawMaterials.map(m => <option key={m.itemCode} value={m.itemCode}>{m.itemName}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <input 
                              type="number" step="any" min="0" placeholder="0"
                              value={row.qty}
                              onChange={(e) => handleIngredientChange(row.id, 'qty', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2.5 pr-12 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500" 
                            />
                            <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                              {material ? material.unitOfMeasure : '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button 
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={ingredients.length === 1}
                            className={`p-2 rounded-lg transition-colors ${ingredients.length === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}