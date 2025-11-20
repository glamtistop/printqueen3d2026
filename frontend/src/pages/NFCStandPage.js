import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Package, Upload, Link as LinkIcon, ShoppingCart, User, LogOut, X, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ColorPicker from '../components/ColorPicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BASE_OPTIONS = [
  {
    id: '2nfc',
    name: '2 NFC Chips',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400',
    description: 'Perfect for dual functionality'
  },
  {
    id: '3nfc',
    name: '3 NFC Chips',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1600096194735-ec70d4a4a9a8?w=400',
    description: 'Maximum versatility'
  },
  {
    id: '2nfc-card',
    name: '2 NFC + Business Card Holder',
    price: 60.00,
    image: 'https://images.unsplash.com/photo-1590872596793-49b39cb073c8?w=400',
    description: 'Professional networking solution'
  },
  {
    id: '2nfc-square',
    name: '2 NFC + Square Reader',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
    description: 'Accept payments on the go'
  },
  {
    id: '3nfc-card',
    name: '3 NFC + Business Card Holder',
    price: 70.00,
    image: 'https://images.unsplash.com/photo-1586672806791-3a7817ec0b9e?w=400',
    description: 'Ultimate business tool'
  },
  {
    id: '3nfc-square',
    name: '3 NFC + Square Reader',
    price: 75.00,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    description: 'Complete payment solution'
  }
];

const NFCStandPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedBase, setSelectedBase] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [nfcLinks, setNfcLinks] = useState(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBaseOption = BASE_OPTIONS.find(b => b.id === selectedBase);
  const totalPrice = selectedBaseOption ? selectedBaseOption.price : 0;
  const maxLinks = selectedBase?.includes('3nfc') ? 3 : 2;
  
  // Check if at least one NFC link is provided
  const hasNfcLinks = nfcLinks.some(link => link.trim() !== '');
  
  // Check if all required fields are filled
  const isFormComplete = selectedBase && primaryColor && secondaryColor && logoFile && hasNfcLinks;
  
  // Get list of missing requirements
  const missingRequirements = [];
  if (!selectedBase) missingRequirements.push('Base configuration');
  if (!primaryColor) missingRequirements.push('Primary color');
  if (!secondaryColor) missingRequirements.push('Secondary color');
  if (!logoFile) missingRequirements.push('Logo upload');
  if (!hasNfcLinks) missingRequirements.push('At least one NFC link');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...nfcLinks];
    newLinks[index] = value;
    setNfcLinks(newLinks);
  };

  const handleSubmit = async () => {
    // Comprehensive validation
    if (!isFormComplete) {
      toast.error(`Please complete all required fields: ${missingRequirements.join(', ')}`);
      return;
    }

    const filledLinks = nfcLinks.filter(link => link.trim() !== '').slice(0, maxLinks);

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('baseOption', selectedBase);
      formData.append('baseOptionName', selectedBaseOption.name);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      formData.append('nfcLinks', JSON.stringify(filledLinks));
      formData.append('totalPrice', totalPrice);
      formData.append('userEmail', user?.email || 'guest');
      formData.append('userName', user?.name || 'Guest');

      // Submit to backend
      const response = await axios.post(`${API}/nfc-stand/order`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      toast.success('Order submitted successfully! Check your email for confirmation.');
      
      // Reset form
      setSelectedBase(null);
      setPrimaryColor('');
      setSecondaryColor('');
      setLogoFile(null);
      setLogoPreview(null);
      setNfcLinks(['', '', '']);

      // Navigate to success page
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" data-testid="nfc-stand-page">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        ✨ Custom NFC Stands - Ships within 5-7 Business Days ✨
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <Package className="h-10 w-10 text-blue-600" />
              <span className="logo-text">Print Queen 3D</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Back to Shop
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      My Orders
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12 fade-in-up">
          <h1 className="section-title">Custom NFC Stand Builder</h1>
          <p className="section-subtitle">Design your perfect NFC stand with personalized colors and branding</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Configuration */}
          <div className="space-y-8">
            {/* Step 1: Base Selection */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    selectedBase ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {selectedBase ? <Check className="h-6 w-6" /> : '1'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Base</h2>
                </div>
                {selectedBase && (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {BASE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedBase(option.id)}
                    className={`relative group overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      selectedBase === option.id
                        ? 'border-blue-500 ring-4 ring-blue-100 scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:scale-102'
                    }`}
                    data-testid={`base-option-${option.id}`}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={option.image}
                        alt={option.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 bg-white">
                      <h3 className="font-bold text-sm text-gray-900 mb-1">{option.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                      <p className="text-lg font-bold text-green-600">${option.price.toFixed(2)}</p>
                    </div>
                    {selectedBase === option.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Colors */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    (primaryColor && secondaryColor) ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  }`}>
                    {(primaryColor && secondaryColor) ? <Check className="h-6 w-6" /> : '2'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Colors</h2>
                </div>
                {(primaryColor && secondaryColor) && (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                )}
              </div>
              
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  dataTestId="primary-color-picker"
                />
                <ColorPicker
                  label="Secondary Color"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  dataTestId="secondary-color-picker"
                />
              </div>

              {/* Color Preview */}
              {primaryColor && secondaryColor && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Color Preview:</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-24 rounded-lg shadow-md" style={{ backgroundColor: primaryColor }} />
                    <div className="flex-1 h-24 rounded-lg shadow-md" style={{ backgroundColor: secondaryColor }} />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Logo Upload */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    logoFile ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'
                  }`}>
                    {logoFile ? <Check className="h-6 w-6" /> : '3'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload Logo</h2>
                </div>
                {logoFile && (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  data-testid="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:border-blue-400"
                >
                  {logoPreview ? (
                    <div className="relative w-full h-full p-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG (MAX. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Step 4: NFC Links */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add NFC Links</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Provide up to {maxLinks} links to program into your NFC chips
              </p>

              <div className="space-y-3">
                {Array.from({ length: maxLinks }).map((_, index) => (
                  <div key={index} className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={nfcLinks[index]}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      placeholder={`Link ${index + 1} (e.g., https://your-website.com)`}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                      data-testid={`nfc-link-${index}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="product-card p-8 space-y-6 animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {selectedBaseOption && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <span className="text-gray-600">Base Configuration:</span>
                    <span className="font-semibold text-gray-900">{selectedBaseOption.name}</span>
                  </div>

                  {primaryColor && (
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Primary Color:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{ backgroundColor: primaryColor }} />
                      </div>
                    </div>
                  )}

                  {secondaryColor && (
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Secondary Color:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" style={{ backgroundColor: secondaryColor }} />
                      </div>
                    </div>
                  )}

                  {logoFile && (
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Logo:</span>
                      <span className="text-green-600 font-medium flex items-center space-x-2">
                        <Check className="h-4 w-4" />
                        <span>Uploaded</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-2xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-green-600" data-testid="total-price">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  {!isFormComplete && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4 animate-in fade-in duration-300">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Complete these steps to place your order:</p>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {!selectedBase && <li className="flex items-center space-x-2"><span>❌</span><span>Select a base configuration</span></li>}
                        {!primaryColor && <li className="flex items-center space-x-2"><span>❌</span><span>Choose primary color</span></li>}
                        {!secondaryColor && <li className="flex items-center space-x-2"><span>❌</span><span>Choose secondary color</span></li>}
                        {!logoFile && <li className="flex items-center space-x-2"><span>❌</span><span>Upload your logo</span></li>}
                        {!hasNfcLinks && <li className="flex items-center space-x-2"><span>❌</span><span>Add at least one NFC link</span></li>}
                      </ul>
                    </div>
                  )}

                  {isFormComplete && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4 animate-in fade-in duration-300">
                      <p className="text-sm font-semibold text-green-800 flex items-center space-x-2">
                        <span>✅</span>
                        <span>All options selected! Ready to place your custom order.</span>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!isFormComplete || isSubmitting}
                    className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6 transition-all duration-300"
                    data-testid="submit-order-button"
                  >
                    {isSubmitting ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        <span>{isFormComplete ? 'Place Custom Order' : 'Complete All Options First'}</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    By placing this order, you'll receive an email confirmation with your custom specifications.
                  </p>
                </div>
              )}

              {!selectedBaseOption && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a base option to see pricing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFCStandPage;