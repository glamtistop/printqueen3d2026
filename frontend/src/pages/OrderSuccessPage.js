import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setStatus('error');
      toast.error('No session ID found');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId, attemptNum = 0) => {
    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        clearCart();
        toast.success('Payment successful!');
      } else if (response.data.status === 'expired') {
        setStatus('error');
        toast.error('Payment session expired');
      } else if (attemptNum < maxAttempts) {
        // Continue polling
        setAttempts(attemptNum + 1);
        setTimeout(() => checkPaymentStatus(sessionId, attemptNum + 1), 2000);
      } else {
        setStatus('error');
        toast.error('Payment verification timeout');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (attemptNum < maxAttempts) {
        setAttempts(attemptNum + 1);
        setTimeout(() => checkPaymentStatus(sessionId, attemptNum + 1), 2000);
      } else {
        setStatus('error');
        toast.error('Failed to verify payment');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="order-success-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Print Queen 3D
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="glass-card rounded-2xl p-12 text-center space-y-6">
          {status === 'checking' && (
            <>
              <Loader2 className="h-24 w-24 text-blue-600 mx-auto animate-spin" data-testid="loading-spinner" />
              <h1 className="text-3xl font-bold text-gray-900">Verifying Payment...</h1>
              <p className="text-gray-600">Please wait while we confirm your payment.</p>
              <p className="text-sm text-gray-500">Attempt {attempts + 1} of {maxAttempts}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-24 w-24 text-green-600 mx-auto" data-testid="success-icon" />
              <h1 className="text-3xl font-bold text-gray-900">Order Successful!</h1>
              <p className="text-gray-600">
                Thank you for your purchase! Your order has been confirmed and will be processed shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate('/orders')}
                  className="btn-primary"
                  data-testid="view-orders-button"
                >
                  View My Orders
                </Button>
                <Button
                  onClick={() => navigate('/products')}
                  variant="outline"
                  data-testid="continue-shopping-button"
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-24 w-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Package className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Verification Failed</h1>
              <p className="text-gray-600">
                We couldn't verify your payment. Please contact support or check your orders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate('/orders')}
                  className="btn-primary"
                >
                  View My Orders
                </Button>
                <Button
                  onClick={() => navigate('/products')}
                  variant="outline"
                >
                  Back to Products
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;