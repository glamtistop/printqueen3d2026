import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mail,
  Key,
  Send,
  User,
  AtSign,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  TestTube,
  Bell,
  BellOff,
  ShoppingBag,
  UserPlus,
  Package
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ToggleSwitch = ({ enabled, onChange, label, description, icon: Icon }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
      {Icon && <Icon className={`h-5 w-5 flex-shrink-0 ${enabled ? 'text-emerald-500' : 'text-slate-400'}`} />}
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
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

export const EmailSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [settings, setSettings] = useState({
    provider: 'resend',
    api_key: '',
    sender_email: 'noreply@example.com',
    sender_name: 'Print Queen 3D',
    enabled: false,
    send_order_confirmation: true,
    send_status_updates: true,
    send_welcome_emails: true,
    admin_email: ''
  });
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/email-settings`, {
        withCredentials: true
      });
      const data = response.data;
      setSettings(prev => ({
        ...prev,
        provider: data.provider || 'resend',
        api_key: '', // Don't populate the raw key
        sender_email: data.sender_email || 'noreply@example.com',
        sender_name: data.sender_name || 'Print Queen 3D',
        enabled: data.enabled || false,
        send_order_confirmation: data.send_order_confirmation !== false,
        send_status_updates: data.send_status_updates !== false,
        send_welcome_emails: data.send_welcome_emails !== false,
        admin_email: data.admin_email || ''
      }));
      setApiKeyMasked(data.api_key_masked || '');
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only include api_key if it was changed (not empty)
      const updateData = { ...settings };
      if (!settings.api_key) {
        delete updateData.api_key;
      }
      
      await axios.put(`${BACKEND_URL}/api/admin/email-settings`, updateData, {
        withCredentials: true
      });
      toast.success('Email settings saved!');
      // Refresh to get new masked key if key was updated
      if (settings.api_key) {
        await fetchSettings();
        setSettings(prev => ({ ...prev, api_key: '' }));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    
    setTesting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/email-settings/test`, {
        recipient_email: testEmail
      }, {
        withCredentials: true
      });
      toast.success(response.data.message || 'Test email sent!');
    } catch (error) {
      console.error('Failed to send test email:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to send test email';
      toast.error(errorMsg);
    } finally {
      setTesting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Email Settings</h1>
          <p className="text-slate-500">Configure email notifications for your store</p>
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

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl flex items-center gap-3 ${settings.enabled ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100 border border-slate-200'}`}
      >
        {settings.enabled ? (
          <>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Email Notifications Enabled</p>
              <p className="text-sm text-emerald-600">Customers will receive email notifications</p>
            </div>
          </>
        ) : (
          <>
            <BellOff className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium text-slate-700">Email Notifications Disabled</p>
              <p className="text-sm text-slate-500">Configure your API key and enable to start sending emails</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Master Toggle */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          Email Notifications
        </h3>
        
        <ToggleSwitch
          enabled={settings.enabled}
          onChange={(val) => setSettings(prev => ({ ...prev, enabled: val }))}
          label="Enable Email Notifications"
          description="Turn on to start sending automated emails to customers"
          icon={Mail}
        />
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-purple-500" />
          Resend API Configuration
        </h3>
        
        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key
            </label>
            {apiKeyMasked && (
              <div className="flex items-center gap-2 mb-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span>Current key: {apiKeyMasked}</span>
              </div>
            )}
            <input
              type={showApiKey ? "text" : "password"}
              value={settings.api_key}
              onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-sm"
              placeholder={apiKeyMasked ? "Enter new key to update..." : "re_xxxxxxxxxx..."}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                {showApiKey ? 'Hide' : 'Show'} input
              </button>
            </div>
          </div>

          {/* Resend Dashboard Link */}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Get API key from Resend Dashboard
          </a>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Important: Verify Your Domain</p>
                <p className="text-amber-700 text-sm mt-1">
                  For production use, verify your domain in Resend to send from your own email address.
                  Without verification, emails are sent from Resend&apos;s test domain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Configuration */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-emerald-500" />
          Sender Information
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sender Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="h-4 w-4 inline mr-1" /> Sender Name
            </label>
            <input
              type="text"
              value={settings.sender_name}
              onChange={(e) => setSettings(prev => ({ ...prev, sender_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Your Store Name"
            />
            <p className="text-xs text-slate-500 mt-1">Appears as the &quot;From&quot; name in emails</p>
          </div>

          {/* Sender Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <AtSign className="h-4 w-4 inline mr-1" /> Sender Email
            </label>
            <input
              type="email"
              value={settings.sender_email}
              onChange={(e) => setSettings(prev => ({ ...prev, sender_email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="orders@yourdomain.com"
            />
            <p className="text-xs text-slate-500 mt-1">Must be verified in Resend for production</p>
          </div>

          {/* Admin Email */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" /> Admin Notification Email (Optional)
            </label>
            <input
              type="email"
              value={settings.admin_email}
              onChange={(e) => setSettings(prev => ({ ...prev, admin_email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="admin@yourdomain.com"
            />
            <p className="text-xs text-slate-500 mt-1">Custom quote requests are sent directly to printqueen3d@gmail.com.</p>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-500" />
          Notification Types
        </h3>
        
        <div className="space-y-3">
          <ToggleSwitch
            enabled={settings.send_order_confirmation}
            onChange={(val) => setSettings(prev => ({ ...prev, send_order_confirmation: val }))}
            label="Order Confirmations"
            description="Send confirmation emails when customers place orders"
            icon={ShoppingBag}
          />
          <ToggleSwitch
            enabled={settings.send_status_updates}
            onChange={(val) => setSettings(prev => ({ ...prev, send_status_updates: val }))}
            label="Order Status Updates"
            description="Notify customers when order status changes (shipped, ready for pickup, etc.)"
            icon={Package}
          />
          <ToggleSwitch
            enabled={settings.send_welcome_emails}
            onChange={(val) => setSettings(prev => ({ ...prev, send_welcome_emails: val }))}
            label="Welcome Emails"
            description="Send welcome emails to new customers when they create an account"
            icon={UserPlus}
          />
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5 text-orange-500" />
          Test Configuration
        </h3>
        
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Send a test email to verify your configuration is working correctly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Enter email address..."
            />
            <button
              onClick={handleSendTestEmail}
              disabled={testing || !settings.enabled}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Send Test
            </button>
          </div>
          
          {!settings.enabled && (
            <p className="text-amber-600 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Enable email notifications above to send test emails
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
