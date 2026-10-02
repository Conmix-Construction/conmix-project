import React, { useState, useEffect } from 'react';
import { Wrench, Truck, Settings, Calendar, DollarSign, CheckCircle, PenTool, ClipboardList, RefreshCw } from 'lucide-react';

export default function FleetMaintenance() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live Data State
  const [assets, setAssets] = useState([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);

  const [logData, setLogData] = useState({
    assetId: '',
    maintenanceType: '',
    date: new Date().toISOString().split('T')[0],
    meterReading: '',
    vendor: '',
    cost: '',
    description: ''
  });

  const maintenanceTypes = [
    "Routine Oil Change",
    "Tire Replacement",
    "Engine Repair / Breakdown",
    "Hydraulic Service",
    "Electrical Fix",
    "General Welding"
  ];

  // --- 1. FETCH LIVE ASSETS FROM MONGODB ---
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/fleet');
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        }
      } catch (err) {
        console.error("Failed to fetch fleet assets:", err);
      } finally {
        setIsAssetsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // --- 2. SAVE TO MONGODB & AUTO-POST TO LEDGER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Find the live asset to send its name to the backend for the Ledger description
    const selectedAsset = assets.find(a => a._id === logData.assetId || a.id === logData.assetId);
    const resolvedAssetName = selectedAsset ? (selectedAsset.assetName || selectedAsset.vehicleNo || selectedAsset.name) : 'Unknown Asset';

    try {
      const response = await fetch('http://localhost:5000/api/fleet-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          assetName: resolvedAssetName,
          meterReading: Number(logData.meterReading),
          cost: Number(logData.cost)
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError("Failed to save record.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLogData({
      assetId: '',
      maintenanceType: '',
      date: new Date().toISOString().split('T')[0],
      meterReading: '',
      vendor: '',
      cost: '',
      description: ''
    });
    setIsSubmitted(false);
    setError(null);
  };

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (isSubmitted) {
    const selectedAsset = assets.find(a => a._id === logData.assetId || a.id === logData.assetId);
    const resolvedAssetName = selectedAsset ? (selectedAsset.assetName || selectedAsset.vehicleNo || selectedAsset.name) : 'Unknown Asset';
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border-t-4 border-orange-500 text-center animate-in zoom-in duration-300">
          <CheckCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Maintenance Logged!</h2>
          <p className="text-slate-600 mb-6">
            The service for <span className="font-bold text-slate-800">{resolvedAssetName}</span> has been recorded successfully.
          </p>
          
          <div className="bg-orange-50 rounded-lg p-4 mb-8 border border-orange-100 text-left shadow-inner">
            <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Ledger Integration
            </h3>
            <p className="text-sm text-slate-700 font-medium">
              An expense of <strong className="text-slate-900">Rs. {Number(logData.cost).toLocaleString()}</strong> has been automatically routed to the General Ledger under <em className="text-slate-600">"Fleet & Plant Maintenance"</em>.
            </p>
          </div>

          <button 
            onClick={resetForm}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition shadow-md hover:-translate-y-0.5"
          >
            Log Another Service
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD DATA ENTRY FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-400" /> Fleet & Machinery Maintenance
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">Track repairs, operational hours, and overhead costs.</p>
          </div>
          <Settings className="w-8 h-8 text-slate-600 hidden md:block" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 mb-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-600"/> Asset Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Select Asset</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm font-bold text-slate-700"
                  value={logData.assetId}
                  onChange={(e) => setLogData({...logData, assetId: e.target.value})}
                >
                  <option value="" disabled>{isAssetsLoading ? 'Loading live fleet...' : 'Choose truck or machine...'}</option>
                  {assets.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>
                      {a.assetName || a.vehicleNo || a.name}
                    </option>
                  ))}
                  {/* Fallbacks in case the database is completely empty during testing */}
                  {assets.length === 0 && !isAssetsLoading && (
                    <>
                      <option value="TRK-01">KHI-1234 (Temporary Truck)</option>
                      <option value="MAC-01">Block Machine A (Temporary)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Operating Hours / Odometer (KM)
                </label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g., 45000"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold text-slate-700"
                  value={logData.meterReading}
                  onChange={(e) => setLogData({...logData, meterReading: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600"/> Service & Cost Data
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Date of Service</label>
                <div className="relative">
                  <input 
                    type="date" 
                    required
                    className="w-full border border-slate-300 rounded-md p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-700"
                    value={logData.date}
                    onChange={(e) => setLogData({...logData, date: e.target.value})}
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Service Type</label>
                <select 
                  required
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-bold text-slate-700"
                  value={logData.maintenanceType}
                  onChange={(e) => setLogData({...logData, maintenanceType: e.target.value})}
                >
                  <option value="" disabled>Select type...</option>
                  {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Total Cost (Rs)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required min="0" placeholder="0"
                    className="w-full border border-slate-300 rounded-md p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800"
                    value={logData.cost}
                    onChange={(e) => setLogData({...logData, cost: e.target.value})}
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Mechanic / Vendor</label>
                <input 
                  type="text" 
                  placeholder="e.g., Al-Makkah Autos"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={logData.vendor}
                  onChange={(e) => setLogData({...logData, vendor: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Parts Replaced / Details</label>
                <input 
                  type="text" 
                  placeholder="e.g., Replaced 2 rear tires and oil filter"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={logData.description}
                  onChange={(e) => setLogData({...logData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 font-bold mb-4 text-right flex items-center justify-end gap-1"><RefreshCw className="w-4 h-4" /> {error}</p>}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto flex items-center justify-center gap-2 font-bold py-3 px-8 rounded-lg shadow-md transition-all ${
                isLoading ? 'bg-slate-400 text-slate-100 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isLoading ? 'Posting to Ledger...' : 'Save Record & Post to Ledger'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}