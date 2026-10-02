import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // This listens for any "showToast" signals from anywhere in the app!
    const handleShowToast = (e) => {
      setToast({ show: true, message: e.detail.message, type: e.detail.type || 'success' });
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000); 
    };

    window.addEventListener('showToast', handleShowToast);
    return () => window.removeEventListener('showToast', handleShowToast);
  }, []);

  if (!toast.show) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
        toast.type === 'success' 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
        <p className="text-sm font-bold">{toast.message}</p>
        <button onClick={() => setToast({ ...toast, show: false })} className="ml-6 text-slate-400 hover:text-slate-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}