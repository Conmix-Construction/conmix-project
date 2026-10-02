import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, MapPin, Phone, 
  Mail, ShieldCheck, CheckCircle2, XCircle, Briefcase,
  Building, Calendar, FileText, X
} from 'lucide-react';

export default function EmployeeManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]); 

  // Form State
  const initialFormState = {
    code: '', name: '', designation: '', phone: '', cnic: '',
    email: '', siteName: '', siteAddress: '', city: 'Karachi',
    status: 'Active', joiningDate: '', remarks: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- 1. FETCH FROM DATABASE ---
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- 2. SAVE TO DATABASE ---
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData(initialFormState); // Reset form
        fetchEmployees(); // Refresh the table
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" /> Employee & Site Master
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Manage Staff, Supervisors, and Site Assignments</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition shadow-md flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Employee Info</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Site Assignment</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id || emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{emp.code} • {emp.designation}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-700">{emp.phone}</p>
                    {emp.cnic && <p className="text-[10px] text-slate-400 mt-1">CNIC: {emp.cnic}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{emp.siteName}</p>
                    <p className="text-[10px] text-slate-500">{emp.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                    No employees found. Register one to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> Register Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Employee Code (e.g., CMX001)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Designation" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="CNIC (Optional)" value={formData.cnic} onChange={(e) => setFormData({...formData, cnic: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="Site Name (e.g., DHA Phase 8)" value={formData.siteName} onChange={(e) => setFormData({...formData, siteName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
                <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium" />
              </div>
              <textarea placeholder="Complete Site Address" value={formData.siteAddress} onChange={(e) => setFormData({...formData, siteAddress: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium resize-none" rows="2"></textarea>
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