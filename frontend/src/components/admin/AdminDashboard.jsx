import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ title, description, icon: Icon, onClick, gradient }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all text-left w-full"
  >
    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <ArrowRight className="h-5 w-5 text-slate-400" />
  </motion.button>
);

const RecentOrderRow = ({ order }) => {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-slate-500" />
        </div>
        <div>
          <p className="font-medium text-slate-800">#{order.id.substring(0, 8)}</p>
          <p className="text-sm text-slate-500">{order.items?.length || 0} items</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-800">${order.total?.toFixed(2) || '0.00'}</p>
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}>
          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
        </span>
      </div>
    </div>
  );
};

export const AdminDashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/products`),
        axios.get(`${BACKEND_URL}/api/admin/orders`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${BACKEND_URL}/api/admin/customers`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const customers = customersRes.data || [];

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here is what is happening with your store.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Active in store"
          icon={Package}
          gradient="from-blue-500 to-blue-600"
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle="All time"
          icon={ShoppingCart}
          gradient="from-emerald-500 to-emerald-600"
          delay={0.1}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          subtitle="Registered users"
          icon={Users}
          gradient="from-purple-500 to-purple-600"
          delay={0.2}
        />
        <StatCard
          title="Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          subtitle="Total earnings"
          icon={DollarSign}
          gradient="from-amber-500 to-amber-600"
          delay={0.3}
        />
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Add New Product"
              description="Create a new product listing"
              icon={Package}
              gradient="from-blue-500 to-blue-600"
              onClick={() => onNavigate('products')}
            />
            <QuickAction
              title="View Orders"
              description="Manage customer orders"
              icon={ShoppingCart}
              gradient="from-emerald-500 to-emerald-600"
              onClick={() => onNavigate('orders')}
            />
            <QuickAction
              title="Manage Categories"
              description="Organize your products"
              icon={TrendingUp}
              gradient="from-purple-500 to-purple-600"
              onClick={() => onNavigate('categories')}
            />
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <RecentOrderRow key={order.id} order={order} />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500">No orders yet</p>
                <p className="text-sm text-slate-400">Orders will appear here</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Store Status: Active</h3>
              <p className="text-slate-500">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
            <span className="text-sm font-medium">Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
