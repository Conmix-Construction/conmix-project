import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Search, Truck, CheckSquare, XOctagon, 
  Clock, UserCheck, Barcode, Package, AlertTriangle, 
  ArrowRightCircle, RefreshCw
} from 'lucide-react';

export default function SecurityGatePass() {
  const [referenceNo, setReferenceNo] = useState('');
  const [status, setStatus] = useState('idle'); // idle, fetching, reviewing, approved, flagged, not_found
  const [documentData, setDocumentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [guardInput, setGuardInput] = useState({
    actualQuantity: '',
    driverName: '',
    remarks: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 1. FETCH DOCUMENT FROM MONGODB ---
  const handleFetch = async (e) => {
    e.preventDefault();
    if (!referenceNo.trim()) return;
    
    setStatus('fetching');
    
    try {
      const response = await fetch(`http://localhost:5000/api/gate-pass/scan/${referenceNo}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocumentData(data);
        setGuardInput({ actualQuantity: '', driverName: '', remarks: '' });
        setStatus('reviewing');
      } else {
        setDocumentData(null);
        setStatus('not_found');
      }
    } catch (error) {
      console.error("Scan error:", error);
      setStatus('not_found');
    }
  };

  // --- 2. LOG THE ACTION TO MONGODB ---
  const handleSecurityLog = async (actionStatus) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/gate-pass/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNo: documentData.referenceNo,
          type: documentData.type,
          party: documentData.party,
          vehicle: documentData.vehicle,
          approvedQty: documentData.approvedQty,
          actualQty: Number(guardInput.actualQuantity),
          driverName: guardInput.driverName,
          remarks: guardInput.remarks,
          status: actionStatus // 'Approved' or 'Flagged'
        })
      });

      if (response.ok) {
        setStatus(actionStatus.toLowerCase());
      } else {
        alert("Failed to save security log.");
      }
    } catch (error) {
      console.error("Logging error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTerminal = () => {
    setReferenceNo('');
    setDocumentData(null);
    setGuardInput({ actualQuantity: '', driverName: '', remarks: '' });
    setStatus('idle');
  };

  if (status === 'approved' || status === 'flagged') {
    const isSuccess = status === 'approved';
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 font-sans">
        <div className={`bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center border-t-8 animate-in zoom-in duration-300 ${isSuccess ? 'border-green-500' : 'border-red-500'}`}>
          {isSuccess ? (
            <ArrowRightCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
          ) : (
            <XOctagon className="w-24 h-24 text-red-500 mx-auto mb-4 animate-pulse" />
          )}
          
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {isSuccess ? 'GATE CLEARED' : 'EXIT BLOCKED'}
          </h2>
          <p className="text-slate-600 font-medium mb-6">
            {isSuccess 
              ? `Vehicle authorized to proceed. Security log finalized.` 
              : `Discrepancy logged. Management alerted. Do not allow vehicle to pass.`}
          </p>
          
          <div className="bg-slate-100 p-4 rounded-lg mb-8 text-left font-mono text-sm border border-slate-300">
            <p className="text-slate-500 mb-1">Timestamp: <span className="text-slate-800 font-bold">{currentTime.toLocaleString()}</span></p>
            <p className="text-slate-500 mb-1">Document: <span className="text-slate-800 font-bold">{documentData?.referenceNo}</span></p>
            <p className="text-slate-500 mb-1">Variance: <span className={`font-bold ${documentData?.approvedQty === Number(guardInput.actualQuantity) ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(documentData?.approvedQty - Number(guardInput.actualQuantity))} Units
            </span></p>
            <p className="text-slate-500">Guard ID: <span className="text-slate-800 font-bold">GRD-04 (Main Gate)</span></p>
          </div>

          <button 
            onClick={resetTerminal}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition text-lg shadow-lg"
          >
            Scan Next Vehicle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 font-sans flex flex-col">
      
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center mb-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide">SECURITY TERMINAL</h1>
            <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">Gate 1 - Main Exit</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-2 text-slate-300 font-mono text-lg">
            <Clock className="w-5 h-5 text-slate-500" />
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        
        {status === 'idle' || status === 'not_found' || status === 'fetching' ? (
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl text-center">
            <Barcode className="w-20 h-20 text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Scan Document</h2>
            <p className="text-slate-400 mb-8 text-sm">Use barcode scanner or manually enter the Delivery Challan (CHL-) or Receipt (REC-) number.</p>
            
            <form onSubmit={handleFetch} className="relative">
              <input 
                type="text" 
                autoFocus
                placeholder="e.g. CHL-2026-123" 
                className="w-full bg-slate-950 border-2 border-slate-700 text-white text-center text-2xl font-mono py-5 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none uppercase placeholder-slate-700 transition"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                disabled={status === 'fetching'}
              />
              <button 
                type="submit"
                disabled={!referenceNo || status === 'fetching'}
                className="mt-6 w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 disabled:bg-slate-800 disabled:text-slate-500 flex justify-center items-center gap-2"
              >
                {status === 'fetching' ? <RefreshCw className="w-6 h-6 animate-spin" /> : null}
                {status === 'fetching' ? 'VERIFYING WITH SERVER...' : 'FETCH DETAILS'}
              </button>
            </form>

            {status === 'not_found' && (
              <div className="mt-6 bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">Invalid Document ID. Check ERP records.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            
            {/* LEFT: System Output */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Package className="w-4 h-4 text-blue-400" /> ERP Dispatch Data
                </h3>
                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-lg font-mono text-sm font-bold border border-blue-800/50">
                  {documentData.referenceNo}
                </span>
              </div>
              <div className="p-6 space-y-6 flex-grow">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Direction / Type</p>
                  <p className={`text-lg font-bold ${documentData.type === 'Outbound Delivery' ? 'text-orange-400' : 'text-green-400'}`}>
                    {documentData.type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Destination / Party</p>
                  <p className="text-xl font-bold text-white">{documentData.party}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs font-bold uppercase mb-2">Approved Cargo</p>
                  <p className="text-lg font-medium text-slate-300 mb-2">{documentData.items}</p>
                  <p className="text-3xl font-black text-white">{documentData.approvedQty.toLocaleString()} <span className="text-sm font-medium text-slate-500">Units</span></p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Assigned Vehicle</p>
                  <p className="text-lg font-mono text-slate-300">{documentData.vehicle}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Guard Input */}
            <div className="bg-slate-200 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="bg-white p-4 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-slate-600" />
                  <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Physical Verification</h3>
                </div>
                <button onClick={resetTerminal} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">Cancel</button>
              </div>
              
              <div className="p-6 space-y-5 flex-grow">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <p className="text-sm text-blue-800 font-semibold mb-2">Instructions for Guard:</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Physically count the blocks/bags on the truck.</li>
                    <li>Verify the driver's ID matches records.</li>
                    <li>Do NOT authorize if count mismatches ERP data.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Actual Count (Physical)</label>
                  <input 
                    type="number" 
                    placeholder="Enter physical count..."
                    className="w-full bg-white border-2 border-slate-300 text-slate-900 text-xl font-bold p-4 rounded-xl focus:border-blue-500 focus:ring-0 outline-none"
                    value={guardInput.actualQuantity}
                    onChange={(e) => setGuardInput({...guardInput, actualQuantity: e.target.value})}
                  />
                  {guardInput.actualQuantity && Number(guardInput.actualQuantity) !== documentData.approvedQty && (
                    <p className="text-red-600 text-sm font-bold mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4"/> Mismatch detected! Expected {documentData.approvedQty}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Driver Name / ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tariq Khan"
                    className="w-full bg-white border-2 border-slate-300 text-slate-900 text-lg font-bold p-4 rounded-xl focus:border-blue-500 focus:ring-0 outline-none"
                    value={guardInput.driverName}
                    onChange={(e) => setGuardInput({...guardInput, driverName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Security Remarks (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Any suspicious activity?"
                    className="w-full bg-white border-2 border-slate-300 text-slate-900 p-4 rounded-xl focus:border-blue-500 outline-none"
                    value={guardInput.remarks}
                    onChange={(e) => setGuardInput({...guardInput, remarks: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-300 grid grid-cols-2 gap-4 border-t border-slate-400">
                <button 
                  onClick={() => handleSecurityLog('Flagged')}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-lg transition flex flex-col items-center justify-center gap-1"
                >
                  {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <XOctagon className="w-6 h-6" />}
                  FLAG & BLOCK
                </button>
                <button 
                  onClick={() => handleSecurityLog('Approved')}
                  disabled={!guardInput.actualQuantity || !guardInput.driverName || isProcessing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:text-slate-200 text-white font-black py-5 rounded-xl shadow-lg transition flex flex-col items-center justify-center gap-1"
                >
                  {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckSquare className="w-6 h-6" />}
                  AUTHORIZE PASS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}