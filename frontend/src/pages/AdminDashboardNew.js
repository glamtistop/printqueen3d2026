import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import AdminLayout from '../components/admin/AdminLayout';
import { AdminDashboardHome } from '../components/admin/AdminDashboard';
import { ProductManager } from '../components/admin/ProductManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { CollectionManager } from '../components/admin/CollectionManager';
import { OrderManager } from '../components/admin/OrderManager';
import { CustomerManager } from '../components/admin/CustomerManager';
import { SiteEditor } from '../components/admin/SiteEditor';
import { PaymentSettings } from '../components/admin/PaymentSettings';

const AdminDashboardNew = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user?.is_admin) {
    navigate('/');
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardHome onNavigate={setActiveTab} />;
      case 'products':
        return <ProductManager />;
      case 'categories':
        return <CategoryManager />;
      case 'collections':
        return <CollectionManager />;
      case 'orders':
        return <OrderManager />;
      case 'customers':
        return <CustomerManager />;
      case 'payments':
        return <PaymentSettings />;
      case 'site-editor':
        return <SiteEditor />;
      default:
        return <AdminDashboardHome onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboardNew;
