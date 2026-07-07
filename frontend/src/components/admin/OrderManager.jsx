import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  Zap,
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Palette,
  Image,
  Link,
  ShoppingBag,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Status configuration with new statuses
const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Package },
  fulfilled: { label: 'Fulfilled', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
  picked_up: { label: 'Picked Up', color: 'bg-teal-100 text-teal-700', icon: MapPin },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

// Fulfillment type badges
const fulfillmentBadge = {
  shipping: { label: 'Shipping', icon: Truck, color: 'bg-blue-50 text-blue-600' },
  pickup: { label: 'Pickup', icon: MapPin, color: 'bg-emerald-50 text-emerald-600' }
};

// Format time for display
const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${minutes} ${suffix}`;
};

// Order Details Modal
const OrderDetailsModal = ({ order, onClose, onFulfill, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('details');
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const fulfillment = fulfillmentBadge[order.fulfillment_type] || fulfillmentBadge.shipping;
  const FulfillmentIcon = fulfillment.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">Order #{order.id.substring(0, 8)}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {['details', 'items', 'fulfillment'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Fulfillment Type Badge */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${fulfillment.color}`}>
                  <FulfillmentIcon className="h-4 w-4" />
                  {fulfillment.label} Order
                </span>
                {order.rush_order && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-600">
                    <Zap className="h-4 w-4" />
                    Expedited Manufacturing & Delivery{Number(order.rush_order_amount) > 0 ? ` (+$${Number(order.rush_order_amount).toFixed(2)})` : ''}
                  </span>
                )}
              </div>

              {/* Customer Info */}
              {order.customer_info && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{order.customer_info.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${order.customer_info.email}`} className="text-blue-600 hover:underline">
                        {order.customer_info.email}
                      </a>
                    </div>
                    {order.customer_info.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <a href={`tel:${order.customer_info.phone}`} className="text-blue-600 hover:underline">
                          {order.customer_info.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Address (for shipping orders) */}
              {order.fulfillment_type === 'shipping' && order.shipping_address && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-slate-600">
                    <p>{order.shipping_address.street}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </div>
              )}

              {/* Pickup Details (for pickup orders) */}
              {order.fulfillment_type === 'pickup' && order.pickup_details && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Pickup Information
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-emerald-800">{order.pickup_details.location_name}</p>
                    <p className="text-sm text-emerald-700">{order.pickup_details.location_address}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800">
                          {new Date(order.pickup_details.pickup_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800">
                          {formatTime(order.pickup_details.pickup_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {order.subtotal && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-700">${order.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span className="text-slate-700">${order.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shipping</span>
                      <span className="text-slate-700">${order.shipping_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold">
                    <span className="text-slate-700">Total</span>
                    <span className="text-slate-800">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(order.notes || order.admin_notes) && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-700 mb-2">Notes</h3>
                  {order.notes && <p className="text-sm text-amber-800 mb-2">{order.notes}</p>}
                  {order.admin_notes && (
                    <p className="text-sm text-amber-700 italic">Admin: {order.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-slate-200 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-slate-400" />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{item.product_name}</h4>
                      <p className="text-sm text-slate-500">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>

                      {/* Variants */}
                      {item.variant && Object.keys(item.variant).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(item.variant).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-slate-600"
                            >
                              <span className="font-medium">{key}:</span> {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customization Details */}
                  {item.customization && Object.keys(item.customization).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Customization Details
                      </h5>
                      <div className="grid gap-2">
                        {/* Colors */}
                        {item.customization.primaryColor && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Primary Color:</span>
                            <div
                              className="h-5 w-5 rounded border border-slate-300"
                              style={{ backgroundColor: item.customization.primaryColor }}
                            />
                            <span className="text-slate-700">{item.customization.primaryColor}</span>
                          </div>
                        )}
                        {item.customization.secondaryColor && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Secondary Color:</span>
                            <div
                              className="h-5 w-5 rounded border border-slate-300"
                              style={{ backgroundColor: item.customization.secondaryColor }}
                            />
                            <span className="text-slate-700">{item.customization.secondaryColor}</span>
                          </div>
                        )}

                        {/* Logo */}
                        {item.customization.logo && (
                          <div className="flex items-start gap-2 text-sm">
                            <Image className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div>
                              <span className="text-slate-500">Custom Logo:</span>
                              {item.customization.logo.startsWith('data:') ? (
                                <img
                                  src={item.customization.logo}
                                  alt="Custom logo"
                                  className="mt-2 max-h-24 rounded-lg border border-slate-200"
                                />
                              ) : (
                                <a
                                  href={item.customization.logo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline ml-1"
                                >
                                  View Logo
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* NFC Links */}
                        {item.customization.nfcLinks && item.customization.nfcLinks.length > 0 && (
                          <div className="text-sm">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Link className="h-4 w-4" />
                              NFC Links:
                            </span>
                            <ul className="mt-1 space-y-1 ml-5">
                              {item.customization.nfcLinks.map((link, i) => (
                                <li key={i}>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs break-all"
                                  >
                                    {link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Base Option */}
                        {item.customization.baseOption && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Base Style:</span>
                            <span className="text-slate-700">{item.customization.baseOptionName || item.customization.baseOption}</span>
                          </div>
                        )}

                        {/* Custom Text */}
                        {item.customization.customText && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Custom Text:</span>
                            <span className="text-slate-700 font-medium">&ldquo;{item.customization.customText}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'fulfillment' && (
            <div className="space-y-4">
              {/* Tracking Info (if shipped) */}
              {order.tracking_number && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tracking Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-purple-600">Tracking #:</span>
                      <span className="font-mono text-purple-800">{order.tracking_number}</span>
                    </div>
                    {order.shipping_carrier && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-600">Carrier:</span>
                        <span className="text-purple-800">{order.shipping_carrier}</span>
                      </div>
                    )}
                    {order.shipped_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-600">Shipped:</span>
                        <span className="text-purple-800">
                          {new Date(order.shipped_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Order Timeline</h3>
                <div className="space-y-3">
                  {[
                    { key: 'created_at', label: 'Order Placed', icon: ShoppingBag },
                    { key: 'fulfilled_at', label: 'Fulfilled', icon: CheckCircle },
                    order.fulfillment_type === 'shipping'
                      ? { key: 'shipped_at', label: 'Shipped', icon: Truck }
                      : { key: 'picked_up_at', label: 'Picked Up', icon: MapPin },
                    { key: 'completed_at', label: 'Completed', icon: CheckCircle }
                  ].map((step, index) => {
                    const timestamp = order[step.key];
                    const isCompleted = !!timestamp;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          {timestamp && (
                            <p className="text-xs text-slate-500">
                              {new Date(timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(order.id, 'processing')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        Start Processing
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'processing') && (
                      <button
                        onClick={() => onFulfill(order)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        {order.fulfillment_type === 'pickup' ? 'Mark Ready for Pickup' : 'Ship Order'}
                      </button>
                    )}
                    {(order.status === 'shipped' || order.status === 'picked_up') && (
                      <button
                        onClick={() => onStatusChange(order.id, 'completed')}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                    <button
                      onClick={() => onStatusChange(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Order Card Component
const OrderCard = ({ order, onView, onStatusChange, onFulfill }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const fulfillment = fulfillmentBadge[order.fulfillment_type] || fulfillmentBadge.shipping;
  const FulfillmentIcon = fulfillment.icon;

  // Check if order has customizations
  const hasCustomization = order.items?.some(item => item.customization && Object.keys(item.customization).length > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all"
    >
      {/* Main Row */}
      <div className="p-4 sm:p-5">
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${fulfillment.color}`}>
                  <FulfillmentIcon className="h-3 w-3" />
                  {fulfillment.label}
                </span>
                {order.rush_order && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-600">
                    <Zap className="h-3 w-3" />
                    Expedited
                  </span>
                )}
                {hasCustomization && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                    <Palette className="h-3 w-3" />
                    Custom
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {order.items?.length || 0} items • {new Date(order.created_at).toLocaleDateString()}
                {order.customer_info?.name && (
                  <span className="ml-2">• {order.customer_info.name}</span>
                )}
              </p>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <p className="text-xl font-bold text-slate-800">${order.total?.toFixed(2) || '0.00'}</p>
            
            <div className="flex items-center gap-2">
              {/* View Details */}
              <button
                onClick={() => onView(order)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View</span>
              </button>

              {/* Fulfill Button */}
              {order.status !== 'shipped' && order.status !== 'picked_up' && order.status !== 'completed' && order.status !== 'cancelled' && (
                <button
                  onClick={() => onFulfill(order)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {order.fulfillment_type === 'pickup' ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {order.fulfillment_type === 'pickup' ? 'Ready' : 'Ship'}
                  </span>
                </button>
              )}

              {/* Expand/Collapse */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-slate-100">
              {/* Quick Preview of Items */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Items</h4>
                {order.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.product_name}</p>
                      <p className="text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-slate-700">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <p className="text-sm text-slate-500">+{order.items.length - 3} more items</p>
                )}
              </div>

              {/* Pickup/Shipping Quick Info */}
              {order.fulfillment_type === 'pickup' && order.pickup_details && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{order.pickup_details.location_name}</span>
                    <span>•</span>
                    <Calendar className="h-4 w-4" />
                    <span>{order.pickup_details.pickup_date}</span>
                    <span>@</span>
                    <span>{formatTime(order.pickup_details.pickup_time)}</span>
                  </div>
                </div>
              )}

              {order.tracking_number && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Truck className="h-4 w-4" />
                    <span>Tracking: {order.tracking_number}</span>
                    {order.shipping_carrier && <span>via {order.shipping_carrier}</span>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Fulfill Modal
const FulfillModal = ({ order, onClose, onSubmit }) => {
  const [fulfillmentAction, setFulfillmentAction] = useState(
    order.fulfillment_type === 'pickup' ? 'pickup' : 'ship'
  );
  const [formData, setFormData] = useState({
    tracking_number: '',
    shipping_carrier: '',
    admin_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      fulfillment_action: fulfillmentAction,
      ...formData
    });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Fulfill Order</h3>
            <p className="text-sm text-slate-500">#{order.id.substring(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Fulfillment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Fulfillment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentAction('ship')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  fulfillmentAction === 'ship'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Truck className="h-5 w-5" />
                <span className="font-medium">Ship</span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentAction('pickup')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  fulfillmentAction === 'pickup'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Pickup</span>
              </button>
            </div>
          </div>

          {/* Shipping Details (only for ship) */}
          {fulfillmentAction === 'ship' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="1Z999AA10123456784"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Shipping Carrier
                </label>
                <select
                  value={formData.shipping_carrier}
                  onChange={(e) => setFormData({ ...formData, shipping_carrier: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                >
                  <option value="">Select carrier</option>
                  <option value="USPS">USPS</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Pickup Confirmation */}
          {fulfillmentAction === 'pickup' && order.pickup_details && (
            <div className="bg-emerald-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-emerald-700 mb-2">Pickup Details</h4>
              <p className="text-sm text-emerald-800">{order.pickup_details.location_name}</p>
              <p className="text-sm text-emerald-700">{order.pickup_details.location_address}</p>
              <p className="text-sm text-emerald-700 mt-2">
                Scheduled: {order.pickup_details.pickup_date} @ {formatTime(order.pickup_details.pickup_time)}
              </p>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Notes (optional)
            </label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              placeholder="Internal notes..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Processing...' : fulfillmentAction === 'pickup' ? 'Mark as Picked Up' : 'Mark as Shipped'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main OrderManager Component
export const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/orders`, {
        withCredentials: true
      });
      // Sort by created_at desc
      const sorted = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
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
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const fulfillOrder = async (fulfillmentData) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/orders/${selectedOrder.id}/fulfill`,
        fulfillmentData,
        { withCredentials: true }
      );
      const action = fulfillmentData.fulfillment_action === 'pickup' ? 'marked as picked up' : 'shipped';
      toast.success(`Order ${action} successfully!`);
      setShowFulfillModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to fulfill order:', error);
      toast.error('Failed to fulfill order');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_info?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Fulfillment type filter
    const matchesFulfillment = fulfillmentFilter === 'all' || order.fulfillment_type === fulfillmentFilter;
    
    return matchesSearch && matchesStatus && matchesFulfillment;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    pickup: orders.filter(o => o.fulfillment_type === 'pickup').length
  };

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
          <p className="text-slate-500">{stats.total} total orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm text-slate-500">Total Orders</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-sm text-amber-600">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
          <p className="text-sm text-purple-600">Shipped</p>
          <p className="text-2xl font-bold text-purple-700">{stats.shipped}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <p className="text-sm text-emerald-600">For Pickup</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.pickup}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white appearance-none"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* Fulfillment Filter */}
        <select
          value={fulfillmentFilter}
          onChange={(e) => setFulfillmentFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
        >
          <option value="all">All Types</option>
          <option value="shipping">Shipping</option>
          <option value="pickup">Pickup</option>
        </select>
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
            {searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-slate-500">
            {searchTerm || statusFilter !== 'all' ? 'Try different filters' : 'Orders will appear here when customers make purchases'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={(order) => {
                  setSelectedOrder(order);
                  setShowDetailsModal(true);
                }}
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedOrder(null);
            }}
            onFulfill={(order) => {
              setShowDetailsModal(false);
              setShowFulfillModal(true);
            }}
            onStatusChange={updateOrderStatus}
          />
        )}
      </AnimatePresence>

      {/* Fulfill Modal */}
      <AnimatePresence>
        {showFulfillModal && selectedOrder && (
          <FulfillModal
            order={selectedOrder}
            onClose={() => {
              setShowFulfillModal(false);
              setSelectedOrder(null);
            }}
            onSubmit={fulfillOrder}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManager;
