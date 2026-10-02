import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle, Clock, FileText, 
  ShieldCheck, Image as ImageIcon, X, Building2, Search, Download
} from 'lucide-react';

export default function PaymentVerification() {
  const [parties, setParties] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ADDED: Success Feedback State
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Modal State for Viewing Proof
  const [previewPayment, setPreviewPayment] = useState(null);

  const [formData, setFormData] = useState({
    partyId: '',
    partyType: 'customer',
    amount: '',
    paymentMethod: 'Bank Transfer',
    reference: '',
    description: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchParties();
    fetchPendingPayments();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/parties');
      if (response.ok) setParties(await response.json());
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const fetchPendingPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/verify-payment/pending');
      if (response.ok) setPendingPayments(await response.json());
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyId || !formData.amount) return alert("Please fill required fields.");
    
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('partyId', formData.partyId);
    data.append('partyType', formData.partyType);
    data.append('amount', formData.amount);
    data.append('paymentMethod', formData.paymentMethod);
    data.append('reference', formData.reference);
    data.append('description', formData.description);
    data.append('date', new Date().toISOString());
    if (file) data.append('proofImage', file);

    try {
      const response = await fetch('http://localhost:5000/api/verify-payment', {
        method: 'POST',
        body: data 
      });

      if (response.ok) {
        setFormData({ ...formData, amount: '', reference: '', description: '' });
        setFile(null);
        document.getElementById('proof-upload').value = '';
        fetchPendingPayments(); 
        
        // ADDED: Trigger Success Message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      } else {
        // ADDED: Handle backend security error messages
        const errData = await response.json();
        alert(`Failed to upload: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/verify-payment/approve/${id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        setPendingPayments(pendingPayments.filter(p => p._id !== id));
        if (previewPayment && previewPayment._id === id) setPreviewPayment(null);
      }
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  // ADDED: Force Download Logic
  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(`http://localhost:5000${url}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || `Receipt-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const activeParties = parties.filter(p => p.type.toLowerCase() === formData.partyType || p.type === 'Both');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg border border-slate-800 mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
              <ShieldCheck className="w-8 h-8 text-yellow-500" /> Payment Verification Portal
            </h1>
            <p className="text-slate-400 font-medium mt-2">Securely upload, review, and approve financial transactions.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-800 px-5 py-2.5 rounded-lg border border-slate-700">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-slate-200">
              {pendingPayments.length} Pending Approvals
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit relative">
            <div className="bg-slate-900 p-5 border-b-4 border-yellow-500">
              <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-wider text-sm">
                <UploadCloud className="w-5 h-5 text-yellow-500" /> Record & Upload Proof
              </h3>
            </div>
            
            {/* ADDED: Success Banner */}
            {showSuccess && (
              <div className="absolute top-[68px] left-0 right-0 bg-emerald-500 text-white p-3 px-6 font-bold flex items-center gap-2 animate-in slide-in-from-top-2 z-10">
                <CheckCircle className="w-5 h-5" />
                Payment & Proof Uploaded Successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Party Type</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 outline-none font-semibold text-slate-700 bg-slate-50"
                    value={formData.partyType}
                    onChange={(e) => setFormData({...formData, partyType: e.target.value, partyId: ''})}
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Account</label>
                  <select 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 outline-none font-bold text-slate-900 bg-white"
                    value={formData.partyId}
                    onChange={(e) => setFormData({...formData, partyId: e.target.value})}
                  >
                    <option value="" disabled>Choose...</option>
                    {activeParties.map(p => <option key={p._id} value={p._id}>{p.companyName || p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Amount (Rs.)</label>
                <input 
                  type="number" required min="1"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-800 outline-none text-xl font-black text-slate-900"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 outline-none font-semibold text-slate-700 bg-white"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ref / Cheque No.</label>
                  <input 
                    type="text" required
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-800 outline-none font-semibold"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Upload Receipt / Screenshot</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    id="proof-upload"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {!file ? (
                    <div className="flex flex-col items-center pointer-events-none">
                      <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Click or drag file to upload</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 5MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Ready to submit</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-lg font-bold text-white transition-all shadow-md flex justify-center items-center gap-2 ${
                  isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? 'Uploading Data...' : 'Submit for Verification'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" /> Pending Approval Queue
              </h3>
              <button onClick={fetchPendingPayments} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
                Refresh <Search className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-bold">
                Loading queue...
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
                <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
                <p className="font-bold text-slate-500 text-lg">All caught up!</p>
                <p className="text-sm text-slate-400">No pending payments require verification.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => {
                  const partyDetails = parties.find(p => p._id === payment.partyId);
                  
                  return (
                    <div key={payment._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                          <Building2 className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                            {new Date(payment.date).toLocaleDateString()} • {payment.paymentMethod}
                          </p>
                          <p className="font-black text-slate-900 text-lg">{partyDetails?.companyName || partyDetails?.name || 'Unknown Party'}</p>
                          <p className="text-sm font-semibold text-slate-600">Ref: {payment.reference}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end w-full sm:w-auto gap-3">
                        <p className="text-2xl font-black text-slate-900">
                          Rs. {payment.amount?.toLocaleString()}
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => setPreviewPayment(payment)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition text-sm flex justify-center items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> View Proof
                          </button>
                          <button 
                            onClick={() => handleApprove(payment._id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-yellow-500 text-slate-900 font-black rounded-lg hover:bg-yellow-400 transition text-sm flex justify-center items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900">Payment Verification</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Ref: {previewPayment.reference}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* ADDED: Download Button */}
                <button 
                  onClick={() => handleDownload(previewPayment.proofDocumentUrl, `Receipt-${previewPayment.reference}`)}
                  className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Save Local
                </button>
                <button onClick={() => setPreviewPayment(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition">
                  <X className="w-6 h-6 text-slate-700" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-center">
              {previewPayment.proofDocumentUrl ? (
                previewPayment.proofDocumentUrl.endsWith('.pdf') ? (
                  <iframe 
                    src={`http://localhost:5000${previewPayment.proofDocumentUrl}`} 
                    className="w-full h-[60vh] rounded-lg border border-slate-300 shadow-sm"
                    title="Document Proof"
                  />
                ) : (
                  <img 
                    src={`http://localhost:5000${previewPayment.proofDocumentUrl}`} 
                    alt="Payment Proof" 
                    className="max-w-full max-h-[60vh] rounded-lg border border-slate-300 shadow-md object-contain"
                  />
                )
              ) : (
                <div className="text-center p-12">
                  <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-500">No digital proof attached to this record.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Amount to Verify</p>
                <p className="text-2xl font-black text-slate-900">Rs. {previewPayment.amount?.toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewPayment(null)} 
                  className="px-6 py-3 text-sm font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApprove(previewPayment._id)}
                  className="px-8 py-3 text-sm font-black text-slate-900 bg-yellow-500 rounded-lg hover:bg-yellow-400 transition shadow-md flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Confirm & Verify
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}