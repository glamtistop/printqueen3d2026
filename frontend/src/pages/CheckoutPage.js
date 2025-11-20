import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const { user } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  // Redirect if no user
  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Create order first
      const orderItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant
      }));

      const orderResponse = await axios.post(
        `${API}/orders`,
        {
          items: orderItems,
          total: total
        },
        { withCredentials: true }
      );

      const orderId = orderResponse.data.id;

      // Create checkout session
      const originUrl = window.location.origin;
      const checkoutResponse = await axios.post(
        `${API}/checkout/session`,
        {
          order_id: orderId,
          origin_url: originUrl
        },
        { withCredentials: true }
      );

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="checkout-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-2">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" className="h-20 w-auto" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Print Queen 3D
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="space-y-6">
          {/* User Info */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p className="text-gray-700"><strong>Name:</strong> {user.name}</p>
              <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-0">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-green-600">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
            </div>
            <div className="flex justify-between text-2xl font-bold text-gray-900 mt-4">
              <span>Total</span>
              <span data-testid="checkout-total">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full btn-primary text-lg py-6 flex items-center justify-center space-x-2"
            data-testid="pay-button"
          >
            <CreditCard className="h-5 w-5" />
            <span>{processing ? 'Processing...' : 'Pay with Stripe'}</span>
          </Button>

          <p className="text-center text-sm text-gray-500">
            You will be redirected to Stripe to complete your payment securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;