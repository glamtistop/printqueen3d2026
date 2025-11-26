import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CreditCard,
  Truck,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  Home,
  Check,
  AlertCircle,
  Palette,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import { COLORS } from '../components/ColorPicker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to get color name from hex
const getColorName = (hex) => {
  if (!hex) return null;
  const color = COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return color ? color.name : hex;
};

// Format time for display (24hr to 12hr)
const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${minutes} ${suffix}`;
};

// Get available dates for pickup (next 14 days)
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    });
  }
  
  return dates;
};

// Step indicator component
const StepIndicator = ({ steps, currentStep }) => (
  <div className="flex items-center justify-center mb-8">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${currentStep > index 
              ? 'bg-emerald-500 text-white' 
              : currentStep === index 
                ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                : 'bg-gray-200 text-gray-500'}
          `}>
            {currentStep > index ? <Check className="h-5 w-5" /> : index + 1}
          </div>
          <span className={`ml-2 text-sm font-medium hidden sm:block ${currentStep >= index ? 'text-gray-900' : 'text-gray-400'}`}>
            {step.label}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${currentStep > index ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Order Item Card
const OrderItemCard = ({ item }) => {
  const hasCustomization = item.customization && Object.keys(item.customization).length > 0;
  
  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
        <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
        
        {/* Variants */}
        {item.variant && Object.keys(item.variant).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(item.variant).map(([key, value]) => {
              const isColorHex = typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
              return (
                <span key={key} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-0.5 rounded">
                  {key}: 
                  {isColorHex ? (
                    <>
                      <span className="w-3 h-3 rounded border" style={{ backgroundColor: value }} />
                      {getColorName(value)}
                    </>
                  ) : value}
                </span>
              );
            })}
          </div>
        )}
        
        {/* Customization indicator */}
        {hasCustomization && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
            <Palette className="h-3 w-3" /> Custom Order
          </span>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
};

// Pickup Location Card
const PickupLocationCard = ({ location, selected, onSelect }) => (
  <button
    onClick={() => onSelect(location)}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
      selected 
        ? 'border-emerald-500 bg-emerald-50' 
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${selected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
        <MapPin className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{location.name}</h4>
        <p className="text-sm text-gray-600">{location.address}</p>
        <p className="text-sm text-gray-600">{location.city}, {location.state} {location.zip_code}</p>
        {location.hours_display && (
          <p className="text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            {location.hours_display}
          </p>
        )}
      </div>
      {selected && <Check className="h-5 w-5 text-emerald-500" />}
    </div>
  </button>
);

const CheckoutPage = () => {
  const { user } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState('shipping');
  const [pickupLocations, setPickupLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  // Pickup availability state
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [unavailableProducts, setUnavailableProducts] = useState([]);
  
  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US'
  });

  const steps = [
    { id: 'fulfillment', label: 'Fulfillment' },
    { id: 'details', label: 'Details' },
    { id: 'review', label: 'Review' }
  ];

  const availableDates = getAvailableDates();
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.0925; // 9.25% CA tax
  const taxAmount = subtotal * taxRate;
  const shippingAmount = fulfillmentType === 'shipping' ? (subtotal >= 50 ? 0 : 5.99) : 0;
  const total = subtotal + taxAmount + shippingAmount;

  // Redirect if no user or empty cart
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (cart.length === 0) {
      navigate('/cart');
    }
  }, [user, cart, navigate]);

  // Fetch pickup locations based on cart items
  useEffect(() => {
    const fetchLocations = async () => {
      if (cart.length === 0) return;
      
      setLoadingLocations(true);
      try {
        // Use the new cart-based location filtering API
        const cartItems = cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }));
        
        const response = await axios.post(`${API}/checkout/available-locations`, cartItems);
        
        setPickupLocations(response.data.locations || []);
        setPickupAvailable(response.data.pickup_available);
        setShippingAvailable(response.data.shipping_available);
        setUnavailableProducts(response.data.unavailable_products || []);
        
        // If shipping is not available (pickup only products), default to pickup
        if (!response.data.shipping_available && response.data.pickup_available) {
          setFulfillmentType('pickup');
        }
        // If pickup is not available, default to shipping
        if (!response.data.pickup_available && response.data.shipping_available) {
          setFulfillmentType('shipping');
        }
      } catch (error) {
        console.error('Error fetching available locations:', error);
        // Fallback to regular pickup locations endpoint
        try {
          const fallbackResponse = await axios.get(`${API}/pickup-locations`);
          setPickupLocations(fallbackResponse.data);
        } catch (fallbackError) {
          console.error('Error fetching fallback locations:', fallbackError);
        }
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [cart]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedLocation, selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedLocation || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const response = await axios.get(
        `${API}/pickup-locations/${selectedLocation.id}/available-slots?date=${selectedDate}`
      );
      setAvailableSlots(response.data.available_slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const canProceedToStep2 = () => {
    if (fulfillmentType === 'pickup') {
      return selectedLocation && selectedDate && selectedTime;
    }
    return true;
  };

  const canProceedToStep3 = () => {
    if (!customerInfo.name || !customerInfo.email) return false;
    
    if (fulfillmentType === 'shipping') {
      return shippingAddress.street && shippingAddress.city && 
             shippingAddress.state && shippingAddress.zip_code;
    }
    return true;
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // Prepare order items with customization
      const orderItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant,
        customization: item.customization || null,
        product_image: item.image
      }));

      // Build order data
      const orderData = {
        items: orderItems,
        total: parseFloat(total.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        shipping_amount: parseFloat(shippingAmount.toFixed(2)),
        fulfillment_type: fulfillmentType,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || null
        }
      };

      // Add fulfillment-specific data
      if (fulfillmentType === 'pickup') {
        orderData.pickup_details = {
          location_id: selectedLocation.id,
          location_name: selectedLocation.name,
          location_address: `${selectedLocation.address}, ${selectedLocation.city}, ${selectedLocation.state} ${selectedLocation.zip_code}`,
          pickup_date: selectedDate,
          pickup_time: selectedTime
        };
      } else {
        orderData.shipping_address = shippingAddress;
      }

      // Create order
      const orderResponse = await axios.post(
        `${API}/orders`,
        orderData,
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

      // Clear cart before redirect
      clearCart();

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate checkout');
      setProcessing(false);
    }
  };

  if (!user || cart.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-testid="checkout-page">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Fulfillment Selection */}
              {currentStep === 0 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Loading State */}
                  {loadingLocations ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                      <p className="text-gray-500">Checking product availability...</p>
                    </div>
                  ) : (
                    <>
                      {/* Unavailable Products Warning */}
                      {unavailableProducts.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                              <h3 className="font-semibold text-amber-800">Some items not available for pickup</h3>
                              <ul className="mt-2 space-y-1">
                                {unavailableProducts.map((item, idx) => (
                                  <li key={idx} className="text-sm text-amber-700">
                                    • {item.name}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-sm text-amber-600 mt-2">
                                These items must be shipped. Choose shipping or remove them from your cart.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fulfillment Type Selection */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">How would you like to receive your order?</h2>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Shipping Option */}
                          <button
                            onClick={() => shippingAvailable && setFulfillmentType('shipping')}
                            disabled={!shippingAvailable}
                            className={`p-5 rounded-xl border-2 text-left transition-all ${
                              !shippingAvailable
                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                : fulfillmentType === 'shipping'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${
                                !shippingAvailable 
                                  ? 'bg-gray-200 text-gray-400' 
                                  : fulfillmentType === 'shipping' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 text-gray-500'
                              }`}>
                                <Truck className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className={`font-semibold ${!shippingAvailable ? 'text-gray-400' : 'text-gray-900'}`}>Ship to Me</h3>
                                <p className={`text-sm ${!shippingAvailable ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {!shippingAvailable 
                                    ? 'Not available for these items' 
                                    : subtotal >= 50 
                                      ? 'FREE shipping' 
                                      : '$5.99 shipping'
                                  }
                                </p>
                              </div>
                              {shippingAvailable && fulfillmentType === 'shipping' && <Check className="h-5 w-5 text-blue-500 ml-auto" />}
                            </div>
                            {shippingAvailable && <p className="text-xs text-gray-500">Delivery in 5-7 business days</p>}
                          </button>

                          {/* Pickup Option */}
                          <button
                            onClick={() => pickupAvailable && setFulfillmentType('pickup')}
                            disabled={!pickupAvailable}
                            className={`p-5 rounded-xl border-2 text-left transition-all ${
                              !pickupAvailable
                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                : fulfillmentType === 'pickup'
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${
                                !pickupAvailable 
                                  ? 'bg-gray-200 text-gray-400' 
                                  : fulfillmentType === 'pickup' 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-gray-100 text-gray-500'
                              }`}>
                                <MapPin className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className={`font-semibold ${!pickupAvailable ? 'text-gray-400' : 'text-gray-900'}`}>Pickup In-Store</h3>
                                <p className={`text-sm font-medium ${!pickupAvailable ? 'text-gray-400' : 'text-emerald-600'}`}>
                                  {!pickupAvailable ? 'Not available' : 'FREE'}
                                </p>
                              </div>
                              {pickupAvailable && fulfillmentType === 'pickup' && <Check className="h-5 w-5 text-emerald-500 ml-auto" />}
                            </div>
                            <p className="text-xs text-gray-500">
                              {!pickupAvailable 
                                ? unavailableProducts.length > 0 
                                  ? 'Some items cannot be picked up'
                                  : 'No pickup locations available'
                                : `${pickupLocations.length} location${pickupLocations.length > 1 ? 's' : ''} available`
                              }
                            </p>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pickup Location Selection */}
                  {fulfillmentType === 'pickup' && pickupLocations.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Pickup Location</h2>
                      <div className="space-y-3">
                        {pickupLocations.map(location => (
                          <PickupLocationCard
                            key={location.id}
                            location={location}
                            selected={selectedLocation?.id === location.id}
                            onSelect={setSelectedLocation}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date & Time Selection */}
                  {fulfillmentType === 'pickup' && selectedLocation && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Pickup Date & Time</h2>
                      
                      {/* Date Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Pickup Date
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {availableDates.slice(0, 8).map(date => (
                            <button
                              key={date.value}
                              onClick={() => {
                                setSelectedDate(date.value);
                                setSelectedTime('');
                              }}
                              className={`p-3 rounded-lg text-sm font-medium border transition-all ${
                                selectedDate === date.value
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {date.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Selection */}
                      {selectedDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Pickup Time
                          </label>
                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
                              <AlertCircle className="h-5 w-5" />
                              <span>No pickup slots available on this day. Please select another date.</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {availableSlots.map((slot, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTime(slot.start_time)}
                                  className={`p-2 rounded-lg text-sm font-medium border transition-all ${
                                    selectedTime === slot.start_time
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {formatTime(slot.start_time)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Continue Button */}
                  <Button
                    onClick={() => setCurrentStep(1)}
                    disabled={!canProceedToStep2()}
                    className="w-full btn-primary py-4 text-lg"
                  >
                    Continue to Details
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Customer & Shipping Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Customer Information */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address (only for shipping) */}
                  {fulfillmentType === 'shipping' && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Shipping Address
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                          <input
                            type="text"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            placeholder="123 Main St"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              placeholder="Los Angeles"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <input
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                            <input
                              type="text"
                              value={shippingAddress.zip_code}
                              onChange={(e) => setShippingAddress({...shippingAddress, zip_code: e.target.value})}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              placeholder="90001"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pickup Confirmation (for pickup) */}
                  {fulfillmentType === 'pickup' && selectedLocation && (
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                      <h2 className="text-lg font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Pickup Details
                      </h2>
                      <div className="space-y-2 text-emerald-800">
                        <p className="font-medium">{selectedLocation.name}</p>
                        <p className="text-sm">{selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state} {selectedLocation.zip_code}</p>
                        <div className="flex items-center gap-4 pt-2 border-t border-emerald-200 mt-2">
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4" />
                            {formatTime(selectedTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                      className="flex-1 py-4"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep3()}
                      className="flex-1 btn-primary py-4"
                    >
                      Review Order
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Pay */}
              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Review Summary */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Your Order</h2>
                    
                    {/* Customer Info */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
                      <p className="font-medium">{customerInfo.name}</p>
                      <p className="text-sm text-gray-600">{customerInfo.email}</p>
                      {customerInfo.phone && <p className="text-sm text-gray-600">{customerInfo.phone}</p>}
                    </div>

                    {/* Fulfillment Info */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        {fulfillmentType === 'pickup' ? 'Pickup' : 'Shipping'}
                      </h3>
                      {fulfillmentType === 'pickup' ? (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600 mt-1" />
                          <div>
                            <p className="font-medium">{selectedLocation.name}</p>
                            <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                            <p className="text-sm text-emerald-600 mt-1">
                              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {formatTime(selectedTime)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Truck className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            <p className="text-gray-800">{shippingAddress.street}</p>
                            <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Items ({cart.length})</h3>
                      <div className="space-y-3">
                        {cart.map((item, index) => (
                          <OrderItemCard key={index} item={item} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-4"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      disabled={processing}
                      className="flex-1 btn-primary py-4 text-lg"
                      data-testid="pay-button"
                    >
                      {processing ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay ${total.toFixed(2)}
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Items Preview */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100 max-h-48 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (9.25%)</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${shippingAmount === 0 ? 'text-emerald-600' : ''}`}>
                    {shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span data-testid="checkout-total">${total.toFixed(2)}</span>
              </div>

              {/* Fulfillment Badge */}
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                fulfillmentType === 'pickup' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-blue-50 text-blue-700'
              }`}>
                <div className="flex items-center gap-2">
                  {fulfillmentType === 'pickup' ? (
                    <><MapPin className="h-4 w-4" /> In-Store Pickup</>
                  ) : (
                    <><Truck className="h-4 w-4" /> Shipping</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
