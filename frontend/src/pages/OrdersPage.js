import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  Package, 
  Calendar, 
  Truck, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  Palette,
  Image,
  Link as LinkIcon,
  ShoppingBag,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import { Skeleton } from '../components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Status configuration
const statusConfig = {
  pending: { label: 'Order Placed', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  processing: { label: 'Processing', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  fulfilled: { label: 'Ready', color: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  shipped: { label: 'Shipped', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
  picked_up: { label: 'Picked Up', color: 'bg-teal-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50' },
  completed: { label: 'Completed', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' }
};

// Shipping order steps
const SHIPPING_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'completed', label: 'Delivered', icon: CheckCircle },
];

// Pickup order steps
const PICKUP_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'processing', label: 'Preparing', icon: Package },
  { id: 'fulfilled', label: 'Ready for Pickup', icon: CheckCircle },
  { id: 'picked_up', label: 'Picked Up', icon: MapPin },
];

// Format time for display (24hr to 12hr)
const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${minutes} ${suffix}`;
};

// Enhanced Timeline Component
const OrderTimeline = ({ order }) => {
  const isPickup = order.fulfillment_type === 'pickup';
  const steps = isPickup ? PICKUP_STEPS : SHIPPING_STEPS;
  
  // Determine current step index based on status
  const getStepIndex = () => {
    const status = order.status;
    if (status === 'cancelled') return -1;
    
    const index = steps.findIndex(step => step.id === status);
    if (index !== -1) return index;
    
    // Handle edge cases
    if (status === 'completed' && !isPickup) return 3;
    if (status === 'picked_up' && isPickup) return 3;
    if (status === 'fulfilled') return 2;
    
    return 0;
  };
  
  const currentStepIndex = getStepIndex();
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="w-full py-4">
      {isCancelled ? (
        <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-3 rounded-lg">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">Order Cancelled</span>
        </div>
      ) : (
        <div className="relative">
          {/* Mobile: Vertical Timeline */}
          <div className="sm:hidden space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${isCompleted 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCompleted && index > 0 && (
                      <p className="text-xs text-gray-500">
                        {index === 1 && order.created_at && 'Started'}
                        {index === 2 && (isPickup ? 'Ready' : order.shipped_at && new Date(order.shipped_at).toLocaleDateString())}
                        {index === 3 && (isPickup ? order.picked_up_at && new Date(order.picked_up_at).toLocaleDateString() : order.completed_at && new Date(order.completed_at).toLocaleDateString())}
                      </p>
                    )}
                  </div>
                  {isCompleted && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                </div>
              );
            })}
          </div>
          
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden sm:block">
            <div className="relative flex items-center justify-between w-full">
              {/* Progress Bar Background */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
              
              {/* Active Progress Bar */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 rounded-full"
                style={{ zIndex: 1 }}
              />

              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-white
                        ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'}
                        ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium text-center ${isCompleted ? 'text-blue-700' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tracking Info Component
const TrackingInfo = ({ order }) => {
  if (!order.tracking_number) return null;
  
  const trackingUrl = order.shipping_carrier === 'USPS' 
    ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`
    : order.shipping_carrier === 'UPS'
    ? `https://www.ups.com/track?tracknum=${order.tracking_number}`
    : order.shipping_carrier === 'FedEx'
    ? `https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`
    : null;
  
  return (
    <div className="bg-purple-50 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-5 w-5 text-purple-600" />
        <span className="font-medium text-purple-900">Tracking Information</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div>
          <span className="text-sm text-purple-700">Tracking #: </span>
          <span className="font-mono text-purple-900">{order.tracking_number}</span>
        </div>
        {order.shipping_carrier && (
          <div>
            <span className="text-sm text-purple-700">Carrier: </span>
            <span className="text-purple-900">{order.shipping_carrier}</span>
          </div>
        )}
        {trackingUrl && (
          <a 
            href={trackingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-900"
          >
            Track Package <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
};

// Pickup Info Component
const PickupInfo = ({ order }) => {
  if (!order.pickup_details) return null;
  
  return (
    <div className="bg-emerald-50 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-emerald-600" />
        <span className="font-medium text-emerald-900">Pickup Information</span>
      </div>
      <div className="space-y-2">
        <p className="font-medium text-emerald-900">{order.pickup_details.location_name}</p>
        <p className="text-sm text-emerald-700">{order.pickup_details.location_address}</p>
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-emerald-200 mt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-800">
              {new Date(order.pickup_details.pickup_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-800">
              {formatTime(order.pickup_details.pickup_time)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customization Details Component
const CustomizationDetails = ({ customization }) => {
  if (!customization || Object.keys(customization).length === 0) return null;
  
  return (
    <div className="bg-amber-50 rounded-lg p-3 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">Customization</span>
      </div>
      <div className="grid gap-2 text-sm">
        {customization.primaryColor && (
          <div className="flex items-center gap-2">
            <span className="text-amber-700">Primary:</span>
            <div 
              className="h-4 w-4 rounded border border-amber-300" 
              style={{ backgroundColor: customization.primaryColor }} 
            />
            <span className="text-amber-800 font-mono text-xs">{customization.primaryColor}</span>
          </div>
        )}
        {customization.secondaryColor && (
          <div className="flex items-center gap-2">
            <span className="text-amber-700">Secondary:</span>
            <div 
              className="h-4 w-4 rounded border border-amber-300" 
              style={{ backgroundColor: customization.secondaryColor }} 
            />
            <span className="text-amber-800 font-mono text-xs">{customization.secondaryColor}</span>
          </div>
        )}
        {customization.baseOptionName && (
          <div className="flex items-center gap-2">
            <span className="text-amber-700">Style:</span>
            <span className="text-amber-800">{customization.baseOptionName}</span>
          </div>
        )}
        {customization.nfcLinks && customization.nfcLinks.length > 0 && (
          <div className="flex items-start gap-2">
            <LinkIcon className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <span className="text-amber-700">{customization.nfcLinks.length} NFC link(s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isPickup = order.fulfillment_type === 'pickup';
  const status = statusConfig[order.status] || statusConfig.pending;
  
  // Check if any item has customization
  const hasCustomization = order.items?.some(item => item.customization && Object.keys(item.customization).length > 0);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Order Header */}
      <div className="p-4 sm:p-6 border-b border-gray-50 bg-gray-50/50">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2 sm:p-2.5 rounded-xl ${isPickup ? 'bg-emerald-100' : 'bg-blue-100'}`}>
              {isPickup ? (
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              ) : (
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fulfillment Type Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${isPickup ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {isPickup ? <MapPin className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
              {isPickup ? 'Pickup' : 'Shipping'}
            </span>
            {/* Custom Badge */}
            {hasCustomization && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                <Palette className="h-3 w-3" />
                Custom
              </span>
            )}
            {/* Status Badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
              {status.label}
            </span>
            {/* Live Update Indicator */}
            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'picked_up' && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Live
                <span className="ml-1 flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="p-4 sm:p-6">
        {/* Items Preview */}
        <div className="space-y-3 mb-4">
          {order.items?.slice(0, expanded ? undefined : 2).map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 group">
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                {item.product_image ? (
                  <img src={item.product_image} alt="" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <ShoppingBag className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                {expanded && item.customization && (
                  <CustomizationDetails customization={item.customization} />
                )}
              </div>
              <p className="font-medium text-gray-900 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          {!expanded && order.items?.length > 2 && (
            <button 
              onClick={() => setExpanded(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              +{order.items.length - 2} more item(s)
            </button>
          )}
        </div>

        {/* Timeline */}
        <OrderTimeline order={order} />

        {/* Tracking Info (for shipped orders) */}
        {!isPickup && order.tracking_number && <TrackingInfo order={order} />}
        
        {/* Pickup Info (for pickup orders) */}
        {isPickup && order.pickup_details && <PickupInfo order={order} />}

        {/* Order Summary (expanded) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  {order.subtotal && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">${order.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax</span>
                      <span className="text-gray-700">${order.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-700">${order.shipping_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.fulfillment_type === 'pickup' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-emerald-600 font-medium">FREE (Pickup)</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {expanded ? (
              <>Show Less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View Details <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
          <div className="text-right">
            <span className="text-sm text-gray-500 mr-2">Total</span>
            <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const OrdersPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    fetchOrders();
    // Poll for updates every 30 seconds for live feel
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        withCredentials: true
      });
      // Sort by date desc
      const sortedOrders = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return !['completed', 'picked_up', 'cancelled'].includes(order.status);
    }
    if (filter === 'completed') {
      return ['completed', 'picked_up'].includes(order.status);
    }
    return true;
  });

  // Stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => !['completed', 'picked_up', 'cancelled'].includes(o.status)).length,
    completed: orders.filter(o => ['completed', 'picked_up'].includes(o.status)).length
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="orders-page">
      <Navbar />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Track your orders in real-time</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'active' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'completed' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100"
          >
            <Package className="h-16 sm:h-24 w-16 sm:w-24 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 sm:mb-8">Start your collection today!</p>
            <Button onClick={() => navigate('/products')} className="btn-primary px-6 sm:px-8">
              Start Shopping
            </Button>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          /* No Results for Filter */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"
          >
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {filter} orders found</p>
          </motion.div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
