import React, { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, CheckCircle2, Search, Plus, X, Save, RefreshCw } from 'lucide-react';

export default function CuringLog() {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    batchId: `B-${Math.floor(Math.random() * 9000) + 1000}`,
    dateCast: new Date().toISOString().split('T')[0],
    product: '8" Hollow Block (1500 PSI)',
    qty: ''
  });

  // --- 1. FETCH LIVE BATCHES FROM MONGODB ---
  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/curing');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. ADD NEW BATCH TO MONGODB ---
  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!formData.qty) return;

    try {
      const response = await fetch('http://localhost:5000/api/curing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qty: parseInt(formData.qty)
        })
      });

      if (response.ok) {
        setFormData({
          batchId: `B-${Math.floor(Math.random() * 9000) + 1000}`,
          dateCast: new Date().toISOString().split('T')[0],
          product: '8" Hollow Block (1500 PSI)',
          qty: ''
        });
        setShowForm(false);
        fetchBatches(); // Refresh list to get calculated days
      }
    } catch (error) {
      console.error("Error saving batch:", error);
    }
  };

  // --- 3. LOG WATERING ACTION ---
  const markWatered = async (mongoId, customBatchId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/curing/${mongoId}/water`, {
        method: 'PUT'
      });
      if (response.ok) {
        alert(`Success: Batch ${customBatchId} marked as watered for today.`);
        fetchBatches(); // Refresh to update any visual indicators if needed
      }
    } catch (error) {
      console.error("Error watering:", error);
    }
  };

  // Filter based on search
  const filteredBatches = batches.filter(b => 
    b.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <ThermometerSun className="w-6 h-6 text-orange-400" /> QC & Curing Log
            </h1>
            <p className="text-slate-300 text-sm mt-1">Track watering cycles and batch readiness.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={fetchBatches} className="p-2 text-slate-300 hover:text-white transition-colors">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-slate-900/50 p-2 rounded-lg flex items-center gap-2 border border-slate-700 flex-1 md:flex-none">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="text" 
                placeholder="Search Product or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm text-white outline-none placeholder:text-slate-500 w-full" 
              />
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-orange-500/20"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden md:inline">{showForm ? 'Cancel' : 'New Batch'}</span>
            </button>
          </div>
        </div>

        {/* Add New Batch Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 animate-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> Enter New Batch to Curing Yard
            </h3>
            <form onSubmit={handleAddBatch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Batch ID</label>
                <input type="text" name="batchId" value={formData.batchId} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-700 bg-slate-50" readOnly />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Date Cast</label>
                <input type="date" name="dateCast" value={formData.dateCast} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Product Type</label>
                <select name="product" value={formData.product} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500">
                  <option>8" Hollow Block (1500 PSI)</option>
                  <option>6" Solid Block (2000 PSI)</option>
                  <option>4" Solid Block (1500 PSI)</option>
                  <option>Tuff Tile (Red)</option>
                  <option>Tuff Tile (Grey)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Quantity Cast</label>
                <input type="number" name="qty" value={formData.qty} onChange={handleInputChange} placeholder="e.g. 1500" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-orange-500" required />
              </div>
              <div className="md:col-span-5 flex justify-end mt-2">
                <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save & Start Curing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Curing Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Scanning yard batches...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-medium">No active curing batches found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBatches.map(batch => {
              // Format the date nicely for the card
              const castDateStr = new Date(batch.dateCast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              
              return (
                <div key={batch._id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${batch.status === 'Ready' ? 'border-emerald-200' : 'border-blue-200'}`}>
                  
                  {/* Progress Bar Background */}
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all ${batch.status === 'Ready' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min((batch.curingDays / 14) * 100, 100)}%` }}
                  />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">BATCH ID</p>
                      <p className="text-lg font-black text-slate-800">{batch.batchId}</p>
                    </div>
                    {batch.status === 'Ready' ? (
                      <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"><CheckCircle2 className="w-5 h-5"/></span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><Droplets className="w-5 h-5"/></span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-sm font-bold text-slate-700">{batch.product}</p>
                    <p className="text-xs text-slate-500">{batch.qty.toLocaleString()} units cast on <span className="font-semibold">{castDateStr}</span></p>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-auto">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-0.5">CURING TIME</p>
                      <p className={`text-xl font-black ${batch.curingDays >= 14 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        Day {batch.curingDays} <span className="text-sm font-medium text-slate-400">/ 14</span>
                      </p>
                    </div>
                    {batch.status !== 'Ready' && (
                      <button 
                        onClick={() => markWatered(batch._id, batch.batchId)} 
                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        Water Today
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}