import React, { useState, useEffect, useMemo } from 'react';
import { Droplet, Plus, Search, Truck, CheckCircle, RefreshCw, AlertCircle, FileText } from 'lucide-react';

export default function FuelLogScreen() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driverName: '',
    liters: '',
    ratePerLiter: '',
    pumpName: 'Local Pump (Gadap Town)',
    meterReading: '',
    remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-calculate Total
  const totalCost = useMemo(() => {
    const l = Number(formData.liters) || 0;
    const r = Number(formData.ratePerLiter) || 0;
    return l * r;
  }, [formData.liters, formData.ratePerLiter]);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, empRes] = await Promise.all([
        fetch('http://localhost:5000/api/fuel-logs'),
        fetch('http://localhost:5000/api/employees')
      ]);
      if (logsRes.ok && empRes.ok) {
        setLogs(await logsRes.json());
        // Only show Logistics/Drivers and Production operators (for generators/loaders)
        const allEmp = await empRes.json();
        setEmployees(allEmp.filter(e => e.status === 'Active' && (e.role === 'Logistics' || e.role === 'Production')));
      }
    } catch (error) {
      console.error("Error fetching fuel data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SAVE LOG ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNo || !formData.liters || !formData.ratePerLiter) return;
    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/fuel-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          logId: `FUEL-${Math.floor(1000 + Math.random() * 9000)}`,
          liters: Number(formData.liters),
          ratePerLiter: Number(formData.ratePerLiter),
          meterReading: Number(formData.meterReading),
          totalCost
        })
      });

      if (response.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { 
          detail: { message: 'Fuel Log saved and posted to General Ledger.', type: 'success' } 
        }));
        fetchData();
        setIsModalOpen(false);
        setFormData(initialForm);
      } else {
        alert("Failed to save fuel log.");
      }
    } catch (error) {
      console.error("Error saving log:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.logId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-24 relative">
      
      {/* Modal for New Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <Droplet className="w-5 h-5 text-blue-200" /> New Fuel Entry
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white transition">
                <AlertCircle className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle / Equipment No. *</label>
                  <input required type="text" name="vehicleNo" placeholder="e.g. KHI-1234" value={formData.vehicleNo} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver / Operator *</label>
                <select required name="driverName" value={formData.driverName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="" disabled>Select Staff Member...</option>
                  {employees.map(emp => <option key={emp.empId} value={emp.name}>{emp.name} ({emp.role})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Liters</label>
                  <input required type="number" name="liters" min="1" step="any" value={formData.liters} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate/Ltr</label>
                  <input required type="number" name="ratePerLiter" min="1" step="any" value={formData.ratePerLiter} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total (Rs)</label>
                  <div className="w-full border border-slate-300 bg-slate-200 rounded-lg p-2 text-slate-800 font-black text-right">
                    {totalCost.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pump / Source</label>
                  <input type="text" name="pumpName" value={formData.pumpName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Odometer (Optional)</label>
                  <input type="number" name="meterReading" placeholder="Current KM" value={formData.meterReading} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={isSaving || !formData.vehicleNo} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition flex items-center justify-center gap-2 disabled:bg-slate-400">
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5"/>} 
                  Log & Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Screen */}
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Droplet className="w-8 h-8 text-blue-600" /> Diesel & Fuel Logs
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track fuel consumption across the fleet and yard equipment.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchData} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition font-bold">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-md">
              <Plus className="w-5 h-5" /> New Fuel Entry
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Search by vehicle, driver, or ID..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Ref ID & Date</th>
                  <th className="p-4 font-semibold">Vehicle / Driver</th>
                  <th className="p-4 font-semibold">Pump Source</th>
                  <th className="p-4 font-semibold text-right">Liters / Rate</th>
                  <th className="p-4 font-semibold text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />Loading data...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No fuel logs found.</td></tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition text-sm">
                      <td className="p-4">
                        <p className="font-mono font-bold text-blue-600">{log.logId}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(log.date).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 uppercase flex items-center gap-1"><Truck className="w-4 h-4 text-slate-400"/> {log.vehicleNo}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{log.driverName}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{log.pumpName}</p>
                        {log.meterReading && <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Odo: {log.meterReading} KM</p>}
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-slate-800">{log.liters} L</p>
                        <p className="text-xs text-slate-500">@ Rs. {log.ratePerLiter}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-block bg-red-50 text-red-700 font-black px-3 py-1.5 rounded-lg border border-red-100">
                          Rs. {log.totalCost.toLocaleString()}
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
    </div>
  );
}