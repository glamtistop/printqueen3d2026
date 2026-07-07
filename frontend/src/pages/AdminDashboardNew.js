import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import AdminLayout from '../components/admin/AdminLayout';
import { AdminDashboardHome } from '../components/admin/AdminDashboard';
import { ProductManager } from '../components/admin/ProductManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { CollectionManager } from '../components/admin/CollectionManager';
import { OrderManager } from '../components/admin/OrderManager';
import { InquiryManager } from '../components/admin/InquiryManager';
import { CustomerManager } from '../components/admin/CustomerManager';
import { SiteEditor } from '../components/admin/SiteEditor';
import { PaymentSettings } from '../components/admin/PaymentSettings';
import { EmailSettings } from '../components/admin/EmailSettings';
import { ShippingSettings } from '../components/admin/ShippingSettings';
import { PickupLocationManager } from '../components/admin/PickupLocationManager';
import { CustomBuilderManager } from '../components/admin/CustomBuilderManager';
import { DatabaseManager } from '../components/admin/DatabaseManager';

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
      case 'inquiries':
        return <InquiryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'locations':
        return <PickupLocationManager />;
      case 'builders':
        return <CustomBuilderManager />;
      case 'shipping':
        return <ShippingSettings />;
      case 'payments':
        return <PaymentSettings />;
      case 'email':
        return <EmailSettings />;
      case 'site-editor':
        return <SiteEditor />;
      case 'database':
        return <DatabaseManager />;
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
