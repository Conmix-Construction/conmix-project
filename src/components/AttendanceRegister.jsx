import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Save, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function AttendanceRegister() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. FETCH LIVE REGISTER OR GENERATE BLANK ONE ---
  const fetchAttendance = async (selectedDate) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever the user changes the calendar date
  useEffect(() => {
    fetchAttendance(date);
  }, [date]);

  // --- 2. UPDATE LOCAL STATE WHEN BUTTONS ARE CLICKED ---
  const handleStatusChange = (id, newStatus) => {
    setEmployees(employees.map(emp => 
      // Handle both MongoDB _id or local employeeId depending on data state
      (emp._id === id || emp.employeeId === id) ? { ...emp, status: newStatus } : emp
    ));
  };

  const handleTimeChange = (id, newTime) => {
    setEmployees(employees.map(emp => 
      (emp._id === id || emp.employeeId === id) ? { ...emp, timeIn: newTime } : emp
    ));
  };

  // --- 3. SAVE THE FULL REGISTER TO MONGODB ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date,
          records: employees
        })
      });

      if (response.ok) {
        alert(`Success! Attendance register for ${date} has been saved securely.`);
      } else {
        alert(`Error saving register.`);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = employees.filter(e => e.status === 'Present').length;
  const absentCount = employees.filter(e => e.status === 'Absent').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                Daily Attendance 
                {isLoading && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
              </h1>
              <p className="text-slate-500 text-sm">Track yard staff presence and shifts.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Calendar className="w-5 h-5 text-slate-400 ml-2" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none rounded-lg p-2 font-semibold text-slate-700 outline-none focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
              <p className="text-2xl font-black text-slate-800">{employees.length}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-slate-200" />
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Present</p>
              <p className="text-2xl font-black text-emerald-700">{presentCount}</p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-200" />
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Absent</p>
              <p className="text-2xl font-black text-red-700">{absentCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* Register Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Employee Details</th>
                  <th className="p-4 font-semibold">Time In</th>
                  <th className="p-4 font-semibold">Daily Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-slate-500 font-medium">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading Database Records...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                   <tr>
                    <td colSpan="3" className="p-12 text-center text-slate-500 font-medium">
                      No active employees found. Please register staff in the HR module first.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => {
                    const uniqueId = emp._id || emp.employeeId;
                    return (
                      <tr key={uniqueId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.role}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium bg-slate-50 w-max px-3 py-1.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <input 
                              type="text" 
                              value={emp.timeIn} 
                              onChange={(e) => handleTimeChange(uniqueId, e.target.value)}
                              className="bg-transparent outline-none w-20 text-slate-700"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {['Present', 'Half-Day', 'Absent'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(uniqueId, status)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all shadow-sm ${
                                  emp.status === status 
                                    ? status === 'Present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200'
                                    : status === 'Absent' ? 'bg-red-500 text-white border-red-600 shadow-red-200'
                                    : 'bg-orange-500 text-white border-orange-600 shadow-orange-200'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={isSaving || employees.length === 0}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                isSaving || employees.length === 0
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                : 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-lg'
              }`}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              {isSaving ? 'Saving...' : 'Save Register'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Quick helper icon component
function UsersIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}