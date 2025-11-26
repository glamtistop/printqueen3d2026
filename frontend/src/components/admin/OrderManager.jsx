import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Package, Truck, Search, X, Clock, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

const OrderCard = ({ order, onStatusChange, onFulfill }) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:shadow-md transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Order Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800">#{order.id.substring(0, 8)}</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {order.items?.length || 0} items • {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <p className="text-xl font-bold text-slate-800">${order.total?.toFixed(2) || '0.00'}</p>
          
          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors"
              >
                Status
                <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          onStatusChange(order.id, key);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                          order.status === key ? 'bg-slate-50 font-medium' : ''
                        }`}
                      >
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fulfill Button */}
            {order.status !== 'shipped' && order.status !== 'completed' && (
              <button
                onClick={() => onFulfill(order)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Fulfill</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Info */}
      {order.tracking_number && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-600">Tracking:</span>
            <span className="font-medium text-slate-800">{order.tracking_number}</span>
            {order.shipping_carrier && (
              <span className="text-slate-500">via {order.shipping_carrier}</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fulfillmentData, setFulfillmentData] = useState({
    tracking_number: '',
    shipping_carrier: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/orders`, {
        withCredentials: true
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/orders/${orderId}/status`,
        null,
        {
          params: { status },
          withCredentials: true
        }
      );
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const fulfillOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/orders/${selectedOrder.id}/fulfill`,
        fulfillmentData,
        { withCredentials: true }
      );
      toast.success('Order fulfilled! Customer will be notified.');
      setShowFulfillModal(false);
      setFulfillmentData({ tracking_number: '', shipping_carrier: '', notes: '' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to fulfill order:', error);
      toast.error('Failed to fulfill order');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-slate-500">{orders.length} total orders</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-slate-500">
            {searchTerm ? 'Try a different search term' : 'Orders will appear here when customers make purchases'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
                onFulfill={(order) => {
                  setSelectedOrder(order);
                  setShowFulfillModal(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Fulfill Modal */}
      <AnimatePresence>
        {showFulfillModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFulfillModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Fulfill Order</h3>
                    <p className="text-sm text-slate-500">#{selectedOrder?.id.substring(0, 8)}</p>
                  </div>
                  <button
                    onClick={() => setShowFulfillModal(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={fulfillOrder} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={fulfillmentData.tracking_number}
                      onChange={(e) => setFulfillmentData({ ...fulfillmentData, tracking_number: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="1Z999AA10123456784"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Shipping Carrier
                    </label>
                    <select
                      value={fulfillmentData.shipping_carrier}
                      onChange={(e) => setFulfillmentData({ ...fulfillmentData, shipping_carrier: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                    >
                      <option value="">Select carrier</option>
                      <option value="USPS">USPS</option>
                      <option value="UPS">UPS</option>
                      <option value="FedEx">FedEx</option>
                      <option value="DHL">DHL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={fulfillmentData.notes}
                      onChange={(e) => setFulfillmentData({ ...fulfillmentData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowFulfillModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Mark as Shipped
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
