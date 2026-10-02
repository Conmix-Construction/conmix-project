import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, RefreshCw, Banknote, Calendar, User, Building, X } from 'lucide-react';

export default function PDCManager() {
  const [cheques, setCheques] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCheque, setNewCheque] = useState({ 
    partyId: '', partyName: '', amount: '', dateOnCheque: '', bankName: '', remarks: '' 
  });

  // --- 1. FETCH LIVE CHEQUES AND CUSTOMERS ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [chequesRes, custRes] = await Promise.all([
        fetch('http://localhost:5000/api/cheques'),
        fetch('http://localhost:5000/api/customers')
      ]);
      
      if (chequesRes.ok && custRes.ok) {
        setCheques(await chequesRes.json());
        setCustomers(await custRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. ADD NEW CHEQUE TO MONGODB ---
  const handleSaveCheque = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Find the full customer object to save the name alongside the ID
    const selectedCust = customers.find(c => c.customerId === newCheque.partyId);

    try {
      const response = await fetch('http://localhost:5000/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCheque,
          chequeId: `CHQ-${Math.floor(1000 + Math.random() * 9000)}`,
          partyName: selectedCust ? selectedCust.name : 'Unknown',
          amount: Number(newCheque.amount)
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewCheque({ partyId: '', partyName: '', amount: '', dateOnCheque: '', bankName: '', remarks: '' });
        fetchData(); // Refresh list
      }
    } catch (error) {
      console.error("Error saving cheque:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. UPDATE STATUS & POST TO LEDGER ---
  const handleUpdateStatus = async (mongoId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cheques/${mongoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // If it cleared, show an alert so the user knows the Ledger was updated
        if (newStatus === 'Cleared') {
          alert("Cheque Cleared! Customer's ledger balance has been automatically updated.");
        }
        fetchData(); // Refresh list
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Cleared': return 'bg-green-100 text-green-700';
      case 'In Clearing': return 'bg-blue-100 text-blue-700';
      case 'Bounced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24 relative">
      
      {/* Add New Cheque Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Log Received Cheque
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-indigo-300 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCheque} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select Customer *</label>
                <select 
                  required 
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                  value={newCheque.partyId}
                  onChange={e => setNewCheque({...newCheque, partyId: e.target.value})}
                >
                  <option value="" disabled>Choose account...</option>
                  {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Cheque Amount (Rs.) *</label>
                <input 
                  required type="number" min="1"
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                  value={newCheque.amount}
                  onChange={e => setNewCheque({...newCheque, amount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date on Cheque *</label>
                  <input 
                    required type="date" 
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={newCheque.dateOnCheque}
                    onChange={e => setNewCheque({...newCheque, dateOnCheque: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bank Name *</label>
                  <input 
                    required type="text" placeholder="e.g. Meezan Bank"
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={newCheque.bankName}
                    onChange={e => setNewCheque({...newCheque, bankName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Remarks (Optional)</label>
                <input 
                  type="text" placeholder="Cheque number or notes"
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newCheque.remarks}
                  onChange={e => setNewCheque({...newCheque, remarks: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={isProcessing} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition flex items-center justify-center gap-2">
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4"/>} 
                  Save Cheque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-indigo-600" /> PDC & Cheque Reconciliation
            </h1>
            <p className="text-slate-500 mt-1">Track pending collections, bank clearing, and manage bounced payments.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center gap-2"
            >
              <Banknote className="w-5 h-5" /> Receive New Cheque
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">Pending Collection</p>
            <p className="text-3xl font-black text-indigo-700 mt-2">Rs. {cheques.filter(c => c.status === 'Pending').reduce((s,c) => s + c.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">In Clearing</p>
            <p className="text-3xl font-black text-blue-600 mt-2">Rs. {cheques.filter(c => c.status === 'In Clearing').reduce((s,c) => s + c.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">Cleared</p>
            <p className="text-3xl font-black text-green-600 mt-2">Rs. {cheques.filter(c => c.status === 'Cleared').reduce((s,c) => s + c.amount, 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs">Cheque ID</th>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs">Party / Bank</th>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs text-right">Amount</th>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs">Post Date</th>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs">Status</th>
                <th className="p-4 font-bold text-slate-600 uppercase text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" /> Loading cheques...
                  </td>
                </tr>
              ) : cheques.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">No cheques recorded.</td>
                </tr>
              ) : (
                cheques.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-700">{c.chequeId}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{c.partyName}</p>
                      <p className="text-xs text-slate-500">{c.bankName}</p>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">Rs. {c.amount.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-600">{new Date(c.dateOnCheque).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      {c.status === 'Pending' && (
                        <button onClick={() => handleUpdateStatus(c._id, 'In Clearing')} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">Send to Bank</button>
                      )}
                      {c.status === 'In Clearing' && (
                        <>
                          <button onClick={() => handleUpdateStatus(c._id, 'Cleared')} className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100">Clear</button>
                          <button onClick={() => handleUpdateStatus(c._id, 'Bounced')} className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100">Bounce</button>
                        </>
                      )}
                      {c.status === 'Cleared' && <span className="text-xs text-slate-400 font-bold">Ledger Updated</span>}
                      {c.status === 'Bounced' && <span className="text-xs text-red-400 font-bold">Requires Action</span>}
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