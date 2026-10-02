import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Plus, CheckCircle2, XCircle, 
  Hash, UserCircle, Phone, X
} from 'lucide-react';

export default function MasterData() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parties, setParties] = useState([]); // Start Empty!

  const initialFormState = {
    type: 'Customer', code: '', companyName: '', ntn: '', strn: '',
    creditLimit: 0, contactPerson: '', phone: '', email: '',
    billingAddress: '', shippingAddress: '', status: 'Active'
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- 1. FETCH FROM DATABASE ---
  const fetchParties = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/parties');
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  // --- 2. SAVE TO DATABASE ---
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        fetchParties();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving party:', error);
    }
  };

  const filteredParties = parties.filter(party => {
    const matchesSearch = party.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          party.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || party.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" /> Customer & Supplier Master
          </h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Register New Party
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Company Profile</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Primary Contact</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Classification & Tax</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParties.map((party) => (
                <tr key={party._id || party.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{party.companyName}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{party.code}</p>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-2"><UserCircle className="w-3.5 h-3.5" /> {party.contactPerson}</p>
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {party.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 ${party.type === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {party.type}
                    </span>
                    {party.ntn && <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider"><Hash className="w-3 h-3" /> NTN: {party.ntn}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${party.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {party.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {party.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredParties.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-sm font-bold text-slate-500">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> Register Party</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold text-slate-700">
                  <option>Customer</option><option>Supplier</option><option>Both</option>
                </select>
                <input type="text" placeholder="Party Code (e.g., CUS-001)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Company Name" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Contact Person" value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="NTN Number" value={formData.ntn} onChange={(e) => setFormData({...formData, ntn: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <textarea placeholder="Billing Address" value={formData.billingAddress} onChange={(e) => setFormData({...formData, billingAddress: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium resize-none" rows="2"></textarea>
                <textarea placeholder="Shipping / Site Address" value={formData.shippingAddress} onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium resize-none" rows="2"></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}