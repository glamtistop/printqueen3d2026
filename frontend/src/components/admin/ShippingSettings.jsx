import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Truck,
  Package,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  MapPin,
  Zap,
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div className="flex-1 min-w-0 pr-4">
      <p className="font-medium text-slate-800">{label}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const ShippingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [settings, setSettings] = useState({
    default_location_id: '',
    shipping_options: [],
    free_shipping_enabled: true,
    free_shipping_threshold: 50.0,
    rush_order_enabled: true,
    rush_order_price: 25.0,
    rush_order_days_min: 1,
    rush_order_days_max: 3,
    rush_order_label: 'Rush Order',
    rush_order_description: 'Expedite your order for faster processing'
  });
  const [expandedOption, setExpandedOption] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchLocations();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/shipping-settings`, {
        withCredentials: true
      });
      setSettings(prev => ({
        ...prev,
        ...response.data,
        shipping_options: response.data.shipping_options || []
      }));
    } catch (error) {
      console.error('Failed to fetch shipping settings:', error);
      toast.error('Failed to load shipping settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/pickup-locations`, {
        withCredentials: true
      });
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/shipping-settings`, settings, {
        withCredentials: true
      });
      toast.success('Shipping settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save shipping settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddShippingOption = () => {
    const newOption = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      price: 0,
      estimated_days_min: 5,
      estimated_days_max: 7,
      enabled: true,
      order: settings.shipping_options.length
    };
    setSettings(prev => ({
      ...prev,
      shipping_options: [...prev.shipping_options, newOption]
    }));
    setExpandedOption(newOption.id);
  };

  const handleRemoveShippingOption = (optionId) => {
    setSettings(prev => ({
      ...prev,
      shipping_options: prev.shipping_options.filter(opt => opt.id !== optionId)
    }));
  };

  const handleOptionChange = (optionId, field, value) => {
    setSettings(prev => ({
      ...prev,
      shipping_options: prev.shipping_options.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipping Settings</h1>
          <p className="text-slate-500">Configure shipping options and rush orders</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Settings
        </button>
      </div>

      {/* Default Shipping Location */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Default Ship-From Location
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Default Location
          </label>
          <select
            value={settings.default_location_id || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, default_location_id: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">-- Select a location --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} - {loc.city}, {loc.state}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            This location will be used as the ship-from address for all orders
          </p>
        </div>

        {locations.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">No Pickup Locations Found</p>
              <p className="text-amber-700 text-sm mt-1">
                Add pickup locations first to set a default shipping location.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rush Order Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Rush Order Option
        </h3>

        <div className="space-y-4">
          <ToggleSwitch
            enabled={settings.rush_order_enabled}
            onChange={(val) => setSettings(prev => ({ ...prev, rush_order_enabled: val }))}
            label="Enable Rush Orders"
            description="Allow customers to pay extra for expedited processing"
          />

          {settings.rush_order_enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rush Order Label
                  </label>
                  <input
                    type="text"
                    value={settings.rush_order_label}
                    onChange={(e) => setSettings(prev => ({ ...prev, rush_order_label: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                    placeholder="Rush Order"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rush Order Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.rush_order_price}
                    onChange={(e) => setSettings(prev => ({ ...prev, rush_order_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={settings.rush_order_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, rush_order_description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="Expedite your order for faster processing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Min Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.rush_order_days_min}
                    onChange={(e) => setSettings(prev => ({ ...prev, rush_order_days_min: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.rush_order_days_max}
                    onChange={(e) => setSettings(prev => ({ ...prev, rush_order_days_max: parseInt(e.target.value) || 3 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-orange-800">
                  <strong>Preview:</strong> "{settings.rush_order_label}" - +${settings.rush_order_price.toFixed(2)} ({settings.rush_order_days_min}-{settings.rush_order_days_max} business days)
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Free Shipping Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-500" />
          Free Shipping
        </h3>

        <div className="space-y-4">
          <ToggleSwitch
            enabled={settings.free_shipping_enabled}
            onChange={(val) => setSettings(prev => ({ ...prev, free_shipping_enabled: val }))}
            label="Enable Free Shipping Threshold"
            description="Offer free shipping on orders above a certain amount"
          />

          {settings.free_shipping_enabled && (
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Orders above ${settings.free_shipping_threshold.toFixed(2)} will qualify for free shipping
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Options */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              Shipping Options
            </h3>
            <p className="text-sm text-slate-500">Add different shipping methods with their prices</p>
          </div>
          <button
            onClick={handleAddShippingOption}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" /> Add Option
          </button>
        </div>

        <div className="space-y-3">
          {settings.shipping_options.map((option, index) => (
            <div
              key={option.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                option.enabled ? 'border-slate-200' : 'border-slate-100 bg-slate-50'
              }`}
            >
              {/* Option Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedOption(expandedOption === option.id ? null : option.id)}
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${option.enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                    {option.name || 'Untitled Option'}
                  </p>
                  <p className="text-sm text-slate-500">
                    ${option.price?.toFixed(2) || '0.00'} • {option.estimated_days_min}-{option.estimated_days_max} days
                  </p>
                </div>
                {option.enabled ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Active</span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">Disabled</span>
                )}
                {expandedOption === option.id ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Option Details */}
              {expandedOption === option.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 space-y-4 border-t border-slate-100"
                >
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Option Name *
                      </label>
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) => handleOptionChange(option.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                        placeholder="e.g., Standard Shipping"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={option.price}
                        onChange={(e) => handleOptionChange(option.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={option.description || ''}
                      onChange={(e) => handleOptionChange(option.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                      placeholder="e.g., 5-7 business days"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Min Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.estimated_days_min}
                        onChange={(e) => handleOptionChange(option.id, 'estimated_days_min', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Max Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.estimated_days_max}
                        onChange={(e) => handleOptionChange(option.id, 'estimated_days_max', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.enabled}
                        onChange={(e) => handleOptionChange(option.id, 'enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Enabled</span>
                    </label>
                    <button
                      onClick={() => handleRemoveShippingOption(option.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {settings.shipping_options.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No shipping options configured</p>
              <button
                onClick={handleAddShippingOption}
                className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
              >
                Add your first shipping option
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
