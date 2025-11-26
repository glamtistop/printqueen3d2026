import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  CreditCard,
  DollarSign,
  Truck,
  Percent,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div>
      <p className="font-medium text-slate-800">{label}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
    </button>
  </div>
);

export const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    publishable_key: '',
    test_mode: true,
    currency: 'usd',
    enable_apple_pay: true,
    enable_google_pay: true,
    enable_link: true,
    tax_rate: 0,
    free_shipping_threshold: 50,
    flat_shipping_rate: 5.99
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stripe-settings`, {
        withCredentials: true
      });
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch Stripe settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/stripe-settings`, settings, {
        withCredentials: true
      });
      toast.success('Payment settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const currencies = [
    { code: 'usd', name: 'US Dollar', symbol: '$' },
    { code: 'eur', name: 'Euro', symbol: '€' },
    { code: 'gbp', name: 'British Pound', symbol: '£' },
    { code: 'cad', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'aud', name: 'Australian Dollar', symbol: 'A$' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>)}
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
          <h1 className="text-2xl font-bold text-slate-800">Payment Settings</h1>
          <p className="text-slate-500">Configure Stripe payments and checkout options</p>
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

      {/* Mode Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl flex items-center gap-3 ${settings.test_mode ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}
      >
        {settings.test_mode ? (
          <>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Test Mode Active</p>
              <p className="text-sm text-amber-600">Payments are in test mode. No real charges will be made.</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Live Mode Active</p>
              <p className="text-sm text-emerald-600">Real payments are being processed.</p>
            </div>
          </>
        )}
      </motion.div>

      {/* API Keys */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          Stripe API Configuration
        </h3>
        
        <div className="space-y-4">
          {/* Test/Live Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Payment Mode</p>
              <p className="text-sm text-slate-500">Switch between test and live payments</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${settings.test_mode ? 'text-amber-600' : 'text-slate-400'}`}>Test</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, test_mode: !prev.test_mode }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${settings.test_mode ? 'bg-amber-500' : 'bg-emerald-500'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.test_mode ? 'left-1' : 'left-6'}`} />
              </button>
              <span className={`text-sm font-medium ${!settings.test_mode ? 'text-emerald-600' : 'text-slate-400'}`}>Live</span>
            </div>
          </div>

          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Publishable Key {settings.test_mode ? '(Test)' : '(Live)'}
            </label>
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
              <Info className="h-4 w-4" />
              <span>Starts with {settings.test_mode ? 'pk_test_' : 'pk_live_'}</span>
            </div>
            <input
              type="text"
              value={settings.publishable_key || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, publishable_key: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-sm"
              placeholder={settings.test_mode ? 'pk_test_...' : 'pk_live_...'}
            />
          </div>

          {/* Stripe Dashboard Link */}
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Get API keys from Stripe Dashboard
          </a>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-purple-500" />
          Payment Methods
        </h3>
        
        <div className="space-y-3">
          <ToggleSwitch
            enabled={settings.enable_apple_pay}
            onChange={(val) => setSettings(prev => ({ ...prev, enable_apple_pay: val }))}
            label="Apple Pay"
            description="Allow customers to pay with Apple Pay on Safari and iOS"
          />
          <ToggleSwitch
            enabled={settings.enable_google_pay}
            onChange={(val) => setSettings(prev => ({ ...prev, enable_google_pay: val }))}
            label="Google Pay"
            description="Allow customers to pay with Google Pay on Chrome and Android"
          />
          <ToggleSwitch
            enabled={settings.enable_link}
            onChange={(val) => setSettings(prev => ({ ...prev, enable_link: val }))}
            label="Stripe Link"
            description="One-click checkout for returning customers"
          />
        </div>
      </div>

      {/* Currency & Pricing */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Currency & Pricing
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Percent className="h-4 w-4 inline mr-1" /> Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.tax_rate}
              onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-500" />
          Shipping Settings
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Shipping Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Free Shipping Threshold</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="50.00"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Free shipping on orders above this amount</p>
          </div>

          {/* Flat Shipping Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Flat Shipping Rate</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.flat_shipping_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, flat_shipping_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="5.99"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Shipping cost for orders below threshold</p>
          </div>
        </div>
      </div>

      {/* Webhook URL (Display Only) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-slate-500" />
          Webhook Configuration
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/api/webhook/stripe`}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/webhook/stripe`);
                toast.success('Webhook URL copied!');
              }}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Add this URL to your Stripe Dashboard under Developers → Webhooks</p>
        </div>
      </div>
    </div>
  );
};
