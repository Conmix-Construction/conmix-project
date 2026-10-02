import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, UserPlus, Key, Trash2, 
  CheckCircle, AlertCircle, Lock, Edit, Power, RefreshCw
} from 'lucide-react';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('users');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [users, setUsers] = useState([]);

  const initialForm = {
    userId: `USR-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    username: '',
    password: '',
    role: 'Yard Supervisor',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);

  const roles = [
    { name: 'Administrator', desc: 'Full access to all modules and system settings.' },
    { name: 'Yard Supervisor', desc: 'Access to Production, Raw Materials, and Wastage.' },
    { name: 'Accountant', desc: 'Access to Finance, Payroll, and Invoicing.' },
    { name: 'Logistics/Dispatch', desc: 'Access to Delivery Challans and Fleet Status.' }
  ];

  const permissionsMatrix = [
    { module: 'Sales & Quotations', admin: true, supervisor: false, accountant: true, dispatch: false },
    { module: 'Yard Production', admin: true, supervisor: true, accountant: false, dispatch: false },
    { module: 'Inventory & Wastage', admin: true, supervisor: true, accountant: false, dispatch: true },
    { module: 'Logistics & Challans', admin: true, supervisor: false, accountant: false, dispatch: true },
    { module: 'Finance & Ledgers', admin: true, supervisor: false, accountant: true, dispatch: false },
    { module: 'HR & Payroll', admin: true, supervisor: false, accountant: true, dispatch: false },
    { module: 'System Settings', admin: true, supervisor: false, accountant: false, dispatch: false },
  ];

  // --- 1. FETCH DATA FROM MONGODB ---
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. ADD NEW USER TO MONGODB ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData(initialForm);
        setShowAddForm(false);
        fetchUsers(); // Refresh the grid
      }
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. TOGGLE USER STATUS IN MONGODB ---
  const toggleUserStatus = async (user) => {
    if (user.role === 'Administrator' && user.username === 'admin') {
      alert('Security Protocol: Cannot deactivate the primary administrator account.');
      return;
    }

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers(); // Refresh the grid to show new status
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> Admin Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage system users, passwords, and module access permissions.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-300 mb-6">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-indigo-600 border-t border-l border-r border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white text-indigo-600 border-t border-l border-r border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <Lock className="w-4 h-4" /> Roles & Permissions
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left/Main Column: User List */}
              <div className={`lg:col-span-${showAddForm ? '2' : '3'} transition-all duration-300`}>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      Active System Users
                      {isLoading && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                    </h2>
                    {!showAddForm && (
                      <button 
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" /> Create New User
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-4 font-bold">User Details</th>
                          <th className="p-4 font-bold">Assigned Role</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold">Last Login</th>
                          <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length === 0 && !isLoading ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-500">No users found. Create an administrator to begin.</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user._id} className="hover:bg-slate-50 transition">
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">@{user.username} • {user.userId}</p>
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold border border-indigo-100">
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
                                  <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  {user.status}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-slate-600">
                                {user.lastLogin}
                              </td>
                              <td className="p-4 flex items-center justify-end gap-2">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition tooltip" title="Edit User">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Reset Password">
                                  <Key className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => toggleUserStatus(user)}
                                  className={`p-2 rounded-lg transition ${user.status === 'Active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} 
                                  title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Add User Form (Slide-in) */}
              {showAddForm && (
                <div className="lg:col-span-1 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" /> New Account
                      </h3>
                      <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
                    </div>

                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                        <input type="text" required name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Ali Khan" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Login Username</label>
                        <input type="text" required name="username" value={formData.username} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 lowercase" placeholder="e.g. ali_khan" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Temporary Password</label>
                        <input type="text" required name="password" value={formData.password} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Min. 8 characters" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Role</label>
                        <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                          {roles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>

                      <button 
                        type="submit" disabled={isSubmitting}
                        className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                      >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create User Account'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLES & PERMISSIONS TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-900">
                  <strong>Role-Based Access Control (RBAC):</strong> The matrix below defines what modules each role can access. If an employee tries to access a module they don't have permission for, the system will block them. <em>Contact IT support to modify this hardcoded security matrix.</em>
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-4 font-bold text-sm">System Module</th>
                        <th className="p-4 font-bold text-sm text-center border-l border-slate-700">Administrator</th>
                        <th className="p-4 font-bold text-sm text-center border-l border-slate-700">Yard Supervisor</th>
                        <th className="p-4 font-bold text-sm text-center border-l border-slate-700">Accountant</th>
                        <th className="p-4 font-bold text-sm text-center border-l border-slate-700">Logistics/Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {permissionsMatrix.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-semibold text-slate-800">{row.module}</td>
                          <td className="p-4 text-center border-l border-slate-200 bg-slate-50/50">
                            {row.admin ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-2 h-2 rounded-full bg-slate-300 mx-auto"></div>}
                          </td>
                          <td className="p-4 text-center border-l border-slate-200">
                            {row.supervisor ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-2 h-2 rounded-full bg-slate-300 mx-auto"></div>}
                          </td>
                          <td className="p-4 text-center border-l border-slate-200 bg-slate-50/50">
                            {row.accountant ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-2 h-2 rounded-full bg-slate-300 mx-auto"></div>}
                          </td>
                          <td className="p-4 text-center border-l border-slate-200">
                            {row.dispatch ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-2 h-2 rounded-full bg-slate-300 mx-auto"></div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}