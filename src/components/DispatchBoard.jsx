import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, MapPin, Phone, 
  RefreshCw, X, CheckCircle2, Navigation, User
} from 'lucide-react';

export default function DispatchBoard() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State matching our Enterprise MongoDB Schema
  const initialForm = {
    orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, // Auto-generate random ID
    customerName: '',
    customerPhone: '',
    siteAddress: '',
    totalOrderValue: '',
    advancePaid: '0',
    truckNumber: '',
    driverName: '',
    dispatchStatus: 'Pending'
  };
  const [formData, setFormData] = useState(initialForm);

  // --- 1. FETCH DATA FROM MONGODB ---
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 2. ADD NEW ORDER TO MONGODB ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalOrderValue: Number(formData.totalOrderValue),
          advancePaid: Number(formData.advancePaid),
          // We will send a dummy item array for now just to satisfy the database schema
          items: [{
            itemCode: "BLK-MIX",
            itemName: "Mixed Block Assortment",
            quantityOrdered: 1,
            unitPrice: Number(formData.totalOrderValue),
            totalPrice: Number(formData.totalOrderValue)
          }]
        })
      });

      if (response.ok) {
        setFormData({ ...initialForm, orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}` });
        setIsAddingMode(false);
        fetchOrders(); // Refresh the board
      }
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  // --- 3. UPDATE DISPATCH STATUS ---
  const advanceStatus = async (id, currentStatus) => {
    const statusFlow = ['Pending', 'Loading', 'Dispatched', 'Delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dispatchStatus: nextStatus })
        });

        if (response.ok) {
          fetchOrders(); // Refresh to show new status
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter and format
  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Loading': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dispatched': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Navigation className="text-blue-600" /> Order & Dispatch Board
          </h1>
          <p className="text-slate-500 text-sm mt-1">Live tracking for Conmix delivery trucks</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setIsAddingMode(!isAddingMode)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200">
            {isAddingMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAddingMode ? 'Cancel' : 'New Dispatch Ticket'}
          </button>
        </div>
      </div>

      {/* Add New Dispatch Ticket Form */}
      {isAddingMode && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Create Dispatch Ticket</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Order Number *</label>
                <input required type="text" name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-slate-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name *</label>
                <input required type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="e.g., Al-Madina Builders" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Phone</label>
                <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} placeholder="0300-1234567" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Site Address *</label>
                <input required type="text" name="siteAddress" value={formData.siteAddress} onChange={handleInputChange} placeholder="e.g., Plot 45, Phase 2, DHA" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Order Value (Rs.) *</label>
                <input required type="number" name="totalOrderValue" value={formData.totalOrderValue} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Truck Registration No.</label>
                <input type="text" name="truckNumber" value={formData.truckNumber} onChange={handleInputChange} placeholder="e.g., K-1234" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                <input type="text" name="driverName" value={formData.driverName} onChange={handleInputChange} placeholder="e.g., Tariq Khan" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Save Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispatch Board Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" placeholder="Search orders or clients..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          Loading Live Orders...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.length === 0 ? (
             <div className="col-span-2 p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
               No active dispatches found.
             </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                  <div>
                    <h3 className="font-black text-lg text-slate-800">{order.customerName}</h3>
                    <p className="text-xs font-mono text-slate-500">{order.orderNumber}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.dispatchStatus)}`}>
                    {order.dispatchStatus}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                      <span>{order.siteAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{order.customerPhone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Truck className="w-4 h-4 text-blue-500" />
                        {order.truckNumber || 'Unassigned'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <User className="w-3 h-3" />
                        {order.driverName || 'No driver'}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Value</p>
                      <p className="font-black text-slate-800">Rs. {order.totalOrderValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                {order.dispatchStatus !== 'Delivered' && (
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <button 
                      onClick={() => advanceStatus(order._id, order.dispatchStatus)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Update Status to {
                        order.dispatchStatus === 'Pending' ? 'Loading' : 
                        order.dispatchStatus === 'Loading' ? 'Dispatched' : 'Delivered'
                      } <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}