import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Truck, CheckCircle, Clock, Search, 
  AlertCircle, FileText, MapPin, ChevronRight, RefreshCw
} from 'lucide-react';

export default function OrderDispatchBoard() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchQty, setDispatchQty] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);

  // --- 1. FETCH LIVE ORDERS AND FLEET ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, fleetRes] = await Promise.all([
        fetch('http://localhost:5000/api/sales-orders'),
        fetch('http://localhost:5000/api/fleet') // Pulling from Master Data!
      ]);
      
      if (ordersRes.ok && fleetRes.ok) {
        setOrders(await ordersRes.json());
        const fleetData = await fleetRes.json();
        // Format fleet for the dropdown
        setFleet(fleetData.filter(f => f.type === 'Truck').map(f => `${f.plate} (${f.make})`));
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

  const getProgress = (delivered, total) => Math.min(Math.round((delivered / total) * 100), 100);

  // --- 2. SEND DISPATCH REQUEST TO MONGODB ---
  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    const qty = parseInt(dispatchQty);
    
    if (!qty || qty <= 0 || qty > (selectedOrder.totalQty - selectedOrder.deliveredQty)) {
      alert("Invalid dispatch quantity. Check remaining balance.");
      return;
    }

    setIsDispatching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/sales-orders/${selectedOrder._id}/dispatch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchQty: qty, truckNo: selectedTruck })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        // Update local state without needing a full refetch
        setOrders(orders.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        setDispatchQty('');
        setSelectedTruck('');
        setShowDispatchModal(false);
      }
    } catch (error) {
      console.error("Error dispatching:", error);
    } finally {
      setIsDispatching(false);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Completed');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-indigo-600" /> Order Fulfillment & Dispatch
            </h1>
            <p className="text-slate-500 mt-1">Track active sales orders and manage partial truck deliveries to sites.</p>
          </div>
          <button onClick={fetchData} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition flex items-center gap-2 font-bold">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                  Active Orders ({activeOrders.length})
                </button>
                <button 
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'completed' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                  Completed ({completedOrders.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search orders, clients..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                Loading Sales Orders...
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'active' ? activeOrders : completedOrders).length === 0 && (
                  <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 italic">
                    No orders found in this category.
                  </div>
                )}
                {(activeTab === 'active' ? activeOrders : completedOrders).map(order => {
                  const progress = getProgress(order.deliveredQty, order.totalQty);
                  const isSelected = selectedOrder?._id === order._id;

                  return (
                    <div 
                      key={order._id} 
                      onClick={() => {
                         setSelectedOrder(order);
                         setShowDispatchModal(false);
                      }}
                      className={`bg-white rounded-xl p-5 cursor-pointer transition-all border-2 ${isSelected ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 ring-opacity-50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-800">{order.orderId}</h3>
                          {order.priority === 'High' && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> URGENT
                            </span>
                          )}
                          {order.status === 'Completed' && (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> FULFILLED
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-500 font-medium">{new Date(order.date).toLocaleDateString()}</span>
                      </div>

                      <div className="mb-4">
                        <p className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-slate-400"/> {order.customerName}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400"/> {order.siteAddress}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <p className="text-sm font-bold text-slate-800 mb-1">{order.item}</p>
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span>{order.deliveredQty.toLocaleString()} Delivered</span>
                          <span>{order.totalQty.toLocaleString()} Total Ordered</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                        
                        {order.status !== 'Completed' && (
                           <span className="text-indigo-600 font-bold text-sm flex items-center gap-1 group">
                             Manage Deliveries <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                           </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {!selectedOrder ? (
              <div className="bg-slate-200/50 rounded-xl p-8 text-center border border-slate-200 border-dashed h-full flex flex-col items-center justify-center min-h-[400px]">
                <Truck className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600">Select an Order</h3>
                <p className="text-sm text-slate-500 mt-2">Click on any active order from the list to manage dispatching and view delivery history.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden sticky top-8">
                <div className="bg-indigo-900 p-5 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Order Management</span>
                    <button onClick={() => setSelectedOrder(null)} className="text-indigo-300 hover:text-white text-sm">Close</button>
                  </div>
                  <h2 className="text-xl font-black">{selectedOrder.orderId}</h2>
                  <p className="text-sm text-indigo-200 mt-1 truncate">{selectedOrder.customerName}</p>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Balance</p>
                       <p className="text-2xl font-black text-orange-600">{(selectedOrder.totalQty - selectedOrder.deliveredQty).toLocaleString()}</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivered</p>
                       <p className="text-2xl font-black text-green-600">{selectedOrder.deliveredQty.toLocaleString()}</p>
                     </div>
                  </div>

                  {selectedOrder.status !== 'Completed' ? (
                    <>
                      {!showDispatchModal ? (
                        <button 
                          onClick={() => setShowDispatchModal(true)}
                          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition flex items-center justify-center gap-2 mb-6"
                        >
                          <Truck className="w-5 h-5" /> Schedule New Truck
                        </button>
                      ) : (
                        <form onSubmit={handleCreateDispatch} className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-6">
                          <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <Truck className="w-4 h-4"/> Load Truck
                          </h3>
                          
                          <div className="space-y-3 mb-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity to Load</label>
                              <input 
                                type="number" required min="1" 
                                max={selectedOrder.totalQty - selectedOrder.deliveredQty}
                                className="w-full border border-slate-300 rounded p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={`Max: ${(selectedOrder.totalQty - selectedOrder.deliveredQty)}`}
                                value={dispatchQty}
                                onChange={(e) => setDispatchQty(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Fleet (From Master Data)</label>
                              <select 
                                required
                                className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedTruck}
                                onChange={(e) => setSelectedTruck(e.target.value)}
                              >
                                <option value="" disabled>Select vehicle...</option>
                                {fleet.length === 0 && <option disabled>No active trucks found.</option>}
                                {fleet.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowDispatchModal(false)} className="flex-1 bg-white text-slate-600 border border-slate-300 font-semibold py-2 rounded hover:bg-slate-50 text-sm">Cancel</button>
                            <button type="submit" disabled={isDispatching} className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 shadow-sm text-sm flex justify-center items-center">
                              {isDispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate DC'}
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  ) : (
                     <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 mb-6 text-center">
                       <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                       <p className="font-bold">Order Fully Delivered</p>
                       <p className="text-xs mt-1">All {selectedOrder.totalQty.toLocaleString()} units have been dispatched.</p>
                     </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Delivery History</h3>
                    <p className="text-sm text-slate-400 italic text-center py-4">Delivery history is dynamically tracked in the system.</p>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}