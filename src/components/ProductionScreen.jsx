import React, { useState, useEffect, useMemo } from 'react';
import { Factory, HardHat, Scale, Users, CheckCircle, AlertTriangle, Hammer, ClipboardList, RefreshCw } from 'lucide-react';

export default function ProductionScreen() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    productId: '',
    loadsProduced: ''
  });

  // Live Database State
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  
  const [actualMaterials, setActualMaterials] = useState({});
  const [selectedCrew, setSelectedCrew] = useState([]);
  const [batchResult, setBatchResult] = useState(null);

  // Mock Crew (Until HR module is fully populated)
  const crewMembers = [
    { id: "EMP-001", name: "Tariq", role: "Machine Operator" },
    { id: "EMP-003", name: "Hassan", role: "Mixer" },
    { id: "EMP-004", name: "Kamran", role: "Loader" },
    { id: "EMP-005", name: "Nadeem", role: "Helper" }
  ];

  // Mock BOM definitions for the products
  const bomDefinitions = {
    "1500 PSI": { blocksPerLoad: 56, recipe: { "Cement": 1.5, "Sand": 28, "Aggregate": 30 } },
    "1000 PSI": { blocksPerLoad: 56, recipe: { "Cement": 1.2, "Sand": 30, "Aggregate": 32 } },
    "Default": { blocksPerLoad: 50, recipe: { "Cement": 1.0, "Sand": 25, "Aggregate": 25 } }
  };

  // --- 1. FETCH LIVE INVENTORY ---
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('http://localhost:5000/api/inventory');
        if (response.ok) {
          const allInv = await response.json();
          setProducts(allInv.filter(i => i.itemType === 'Finished Good'));
          setRawMaterials(allInv.filter(i => i.itemType === 'Raw Material'));
        }
      } catch (error) {
        console.error("Error loading inventory:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchInventory();
  }, []);

  const selectedProduct = products.find(p => p.itemCode === formData.productId);

  // Auto-calculate Standard BOM when product or loads change
  const standardBom = useMemo(() => {
    if (!selectedProduct || !formData.loadsProduced) return null;
    
    // Attempt to match a BOM recipe based on the product name, fallback to Default
    let bomDef = bomDefinitions["Default"];
    if (selectedProduct.itemName.includes("1500 PSI")) bomDef = bomDefinitions["1500 PSI"];
    if (selectedProduct.itemName.includes("1000 PSI")) bomDef = bomDefinitions["1000 PSI"];

    const loads = Number(formData.loadsProduced);
    
    // We map the recipe requirements against the actual Raw Materials found in MongoDB
    const requiredMaterials = {};
    rawMaterials.forEach(rm => {
      // Very basic matching logic for demo purposes (matching 'Cement' to 'OPC Cement', etc.)
      const isCement = rm.itemName.toLowerCase().includes('cement');
      const isSand = rm.itemName.toLowerCase().includes('sand');
      const isAgg = rm.itemName.toLowerCase().includes('aggregate') || rm.itemName.toLowerCase().includes('crush');
      
      let multiplier = 0;
      if (isCement) multiplier = bomDef.recipe["Cement"];
      if (isSand) multiplier = bomDef.recipe["Sand"];
      if (isAgg) multiplier = bomDef.recipe["Aggregate"];

      if (multiplier > 0) {
        requiredMaterials[rm.itemCode] = multiplier * loads;
      }
    });

    return {
      materials: requiredMaterials,
      totalBlocks: bomDef.blocksPerLoad * loads
    };
  }, [formData.productId, formData.loadsProduced, rawMaterials, selectedProduct]);

  // Sync actual materials with standard BOM initially
  useEffect(() => {
    if (standardBom) {
      setActualMaterials(standardBom.materials);
    } else {
      setActualMaterials({});
    }
  }, [standardBom]);

  const handleMaterialChange = (itemCode, value) => {
    setActualMaterials(prev => ({ ...prev, [itemCode]: Number(value) }));
  };

  const toggleCrew = (id) => {
    setSelectedCrew(prev => prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]);
  };

  // --- 2. SUBMIT PRODUCTION BATCH ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || formData.loadsProduced <= 0) return;
    
    setIsSaving(true);

    // Format the materials array for the backend
    const materialsUsedArray = Object.keys(actualMaterials).map(code => {
      const rm = rawMaterials.find(r => r.itemCode === code);
      return {
        materialId: code,
        materialName: rm ? rm.itemName : 'Unknown',
        quantityUsed: actualMaterials[code]
      };
    });

    const payload = {
      batchId: `BATCH-${Math.floor(10000 + Math.random() * 90000)}`,
      date: formData.date,
      shift: formData.shift,
      productId: selectedProduct.itemCode,
      productName: selectedProduct.itemName,
      loadsProduced: Number(formData.loadsProduced),
      totalBlocksYield: standardBom.totalBlocks,
      materialsUsed: materialsUsedArray,
      crewIds: selectedCrew
    };

    try {
      const response = await fetch('http://localhost:5000/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setBatchResult(payload);
        setIsSubmitted(true);
      } else {
        alert("Failed to save production log.");
      }
    } catch (error) {
      console.error("Error saving production:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], shift: 'Morning', productId: '', loadsProduced: '' });
    setSelectedCrew([]);
    setBatchResult(null);
    setIsSubmitted(false);
  };

  if (isSubmitted && batchResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full border-t-4 border-green-600 text-center animate-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Shift Production Logged!</h2>
          <p className="text-gray-600 mb-8 font-mono text-sm">{batchResult.batchId}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-2"><Factory className="w-4 h-4"/> Inventory</h3>
              <p className="text-sm text-green-700"><strong>+{batchResult.totalBlocksYield}</strong> units of {batchResult.productName} added to stock.</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2"><Scale className="w-4 h-4"/> Backflush</h3>
              <p className="text-sm text-orange-700">{batchResult.materialsUsed.length} raw materials successfully deducted from yard stock.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Users className="w-4 h-4"/> Payroll</h3>
              <p className="text-sm text-blue-700">Piece-rate wages flagged for {batchResult.crewIds.length} crew members.</p>
            </div>
          </div>

          <button 
            onClick={resetForm}
            className="w-full bg-slate-800 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition"
          >
            Log Another Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hammer className="w-6 h-6 text-yellow-500" /> Yard Production Entry
            </h1>
            <p className="text-slate-300 text-sm mt-1">Log blocks, adjust mix recipes, and credit crew.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-300">Supervisor:</span>
            <span className="font-bold text-yellow-400">Kamran</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
            <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Factory className="w-5 h-5 text-blue-600"/> 1. Production Output
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input 
                  type="date" required
                  className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Shift</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.shift}
                  onChange={(e) => setFormData({...formData, shift: e.target.value})}
                >
                  <option>Morning</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex justify-between">
                  Product Manufactured {isLoadingData && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                </label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                >
                  <option value="" disabled>{isLoadingData ? 'Loading inventory...' : 'Select finished good...'}</option>
                  {products.map(p => <option key={p.itemCode} value={p.itemCode}>{p.itemName}</option>)}
                </select>
              </div>
            </div>

            {formData.productId && (
              <div className="mt-6 flex flex-col md:flex-row items-center gap-6 bg-blue-50 p-4 rounded-md border border-blue-100 animate-in fade-in">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-bold text-blue-900 mb-1">Machine Loads Mixed</label>
                  <input 
                    type="number" required min="1" placeholder="e.g., 10"
                    className="w-full border border-blue-300 rounded-md p-3 outline-none focus:ring-2 focus:ring-blue-600 font-bold text-lg text-blue-900"
                    value={formData.loadsProduced}
                    onChange={(e) => setFormData({...formData, loadsProduced: e.target.value})}
                  />
                </div>
                <div className="w-full md:w-2/3 flex items-center justify-center md:justify-start gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Total Blocks Yield (Est.)</p>
                    <p className="text-3xl font-black text-blue-800">
                      {standardBom ? standardBom.totalBlocks.toLocaleString() : "0"}
                      <span className="text-sm font-normal text-blue-600 ml-2">(Auto-calculated)</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-orange-50 p-5 rounded-lg border border-orange-100 mb-8">
            <div className="flex justify-between items-center border-b border-orange-200 pb-2 mb-4">
              <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Scale className="w-5 h-5 text-orange-600"/> 2. Material Consumption (Inventory Backflush)
              </h3>
              {standardBom && (
                <span className="text-xs font-semibold bg-orange-200 text-orange-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Edit 'Actual Used' if mix varied
                </span>
              )}
            </div>

            {!standardBom ? (
              <p className="text-sm text-gray-500 italic text-center py-8">Select a product and enter loads to calculate material usage.</p>
            ) : Object.keys(standardBom.materials).length === 0 ? (
               <p className="text-sm text-red-500 italic text-center py-8">No matching raw materials found in the Live Inventory database to generate a BOM recipe.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg border border-orange-200">
                <table className="w-full text-left">
                  <thead className="bg-orange-100 text-orange-900 text-sm">
                    <tr>
                      <th className="p-3 font-semibold">Raw Material</th>
                      <th className="p-3 font-semibold text-center w-32">Current Yard Stock</th>
                      <th className="p-3 font-semibold text-center w-32">Standard BOM</th>
                      <th className="p-3 font-semibold text-center w-40 bg-orange-200">Actual Used (Editable)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(standardBom.materials).map(matKey => {
                      const mat = rawMaterials.find(r => r.itemCode === matKey);
                      if (!mat) return null;

                      const stdQty = standardBom.materials[matKey];
                      const actualQty = actualMaterials[matKey] || 0;
                      const isOver = actualQty > mat.currentStock;
                      const isAdjusted = actualQty !== stdQty;

                      return (
                        <tr key={matKey} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{mat.itemName}</td>
                          <td className="p-3 text-center text-sm">
                            <span className={`font-bold ${isOver ? 'text-red-600' : 'text-gray-600'}`}>{mat.currentStock.toLocaleString()}</span> <span className="text-xs text-gray-500">{mat.unitOfMeasure}</span>
                          </td>
                          <td className="p-3 text-center text-sm text-gray-500">
                            {stdQty.toFixed(2)} {mat.unitOfMeasure}
                          </td>
                          <td className="p-2 bg-orange-50/50">
                            <div className="flex items-center justify-center gap-1">
                              <input 
                                type="number" step="any" min="0" required
                                className={`w-24 border rounded p-1.5 text-center font-bold outline-none focus:ring-2 focus:ring-orange-500 ${isAdjusted ? 'border-orange-400 bg-orange-100 text-orange-900' : 'border-gray-300 text-gray-800'}`}
                                value={actualQty}
                                onChange={(e) => handleMaterialChange(matKey, e.target.value)}
                              />
                              <span className="text-xs text-gray-500 w-8 text-left">{mat.unitOfMeasure}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Users className="w-5 h-5 text-green-600"/> 3. Shift Crew (Wage Crediting)
            </h3>
            <p className="text-sm text-gray-600 mb-4">Select the piece-rate workers present during this shift. Production wages will be split/credited to their ledgers.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {crewMembers.map(emp => {
                const isSelected = selectedCrew.includes(emp.id);
                return (
                  <label 
                    key={emp.id} 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-green-50 border-green-500 shadow-sm ring-1 ring-green-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleCrew(emp.id)}
                    />
                    <div>
                      <p className={`font-bold ${isSelected ? 'text-green-900' : 'text-gray-800'}`}>{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {selectedCrew.length === 0 && (
              <p className="text-xs text-red-500 mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Warning: No crew selected. Wages will not be logged for this batch.</p>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:static bg-white border-t border-gray-200 md:border-none p-4 md:p-0 md:mt-8 md:bg-transparent shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none flex justify-end z-10">
             <button 
                type="submit"
                disabled={!formData.productId || formData.loadsProduced <= 0 || isSaving}
                className={`w-full md:w-auto flex items-center justify-center gap-2 font-bold py-4 md:py-3 px-8 rounded-lg shadow-lg transition-all text-lg md:text-base ${
                  !formData.productId || formData.loadsProduced <= 0 || isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-xl'
                }`}
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ClipboardList className="w-5 h-5" />}
                {isSaving ? 'Updating Inventories...' : 'Log Production & Update Inventory'}
              </button>
          </div>

        </form>
      </div>
    </div>
  );
}