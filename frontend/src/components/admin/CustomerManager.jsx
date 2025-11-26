import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Users, Search, Mail, Calendar, ShoppingBag, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CustomerCard = ({ customer }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:shadow-md transition-all"
  >
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Avatar & Info */}
      <div className="flex items-center gap-4 flex-1">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {customer.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800">{customer.name || 'Unknown'}</h3>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{customer.email}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 sm:gap-8 pl-0 sm:pl-4 border-l-0 sm:border-l border-slate-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-slate-800">{customer.total_orders || 0}</p>
          <p className="text-xs text-slate-500">Orders</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold text-emerald-600">${(customer.total_spent || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500">Spent</p>
        </div>
        <div className="text-center hidden sm:block">
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-slate-800">
            {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
          </p>
          <p className="text-xs text-slate-500">Joined</p>
        </div>
      </div>
    </div>
  </motion.div>
);

export const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/customers`, {
        withCredentials: true
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary stats
  const totalCustomers = customers.length;
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-48"></div>
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
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">{customers.length} total customers</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Customers</p>
              <p className="text-2xl font-bold text-slate-800">{totalCustomers}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
        />
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-slate-500">
            {searchTerm ? 'Try a different search term' : 'Customers will appear here when they sign up'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
