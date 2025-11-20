import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Upload, X, Check, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ColorPicker from './ColorPicker';

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
    image: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=400',
    description: 'Complete business solution'
  }
];

const ICON_OPTIONS = [
  'Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 
  'Website', 'Email', 'Phone', 'WhatsApp', 'Venmo', 'CashApp', 
  'PayPal', 'Apple Pay', 'Google Pay', 'Menu', 'Reviews', 'Custom'
];

const BuildYourStand = ({ product }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [selectedBase, setSelectedBase] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [nfcLinks, setNfcLinks] = useState(['', '', '']);
  const [selectedIcons, setSelectedIcons] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    base: true,
    colors: false,
    logo: false,
    links: false,
    icons: false
  });

  const selectedBaseOption = BASE_OPTIONS.find(opt => opt.id === selectedBase);
  const basePrice = selectedBaseOption ? selectedBaseOption.price : 0;
  const totalPrice = basePrice;

  const maxLinks = selectedBase && selectedBase.includes('3nfc') ? 3 : 2;
  const hasNfcLinks = nfcLinks.slice(0, maxLinks).some(link => link.trim() !== '');
  const hasIcons = Object.keys(selectedIcons).length === maxLinks && 
                   Object.values(selectedIcons).every(icon => icon && icon.trim() !== '');

  const isFormComplete = selectedBase && primaryColor && secondaryColor && logoFile && hasNfcLinks && hasIcons;
  const missingRequirements = [];
  if (!selectedBase) missingRequirements.push('Base option');
  if (!primaryColor) missingRequirements.push('Primary color');
  if (!secondaryColor) missingRequirements.push('Secondary color');
  if (!logoFile) missingRequirements.push('Logo upload');
  if (!hasNfcLinks) missingRequirements.push('At least one NFC link');
  if (!hasIcons) missingRequirements.push('Icon selection for all chips');

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async () => {
    if (!isFormComplete) {
      toast.error(`Please complete all required fields: ${missingRequirements.join(', ')}`);
      return;
    }

    const filledLinks = nfcLinks.filter(link => link.trim() !== '').slice(0, maxLinks);

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('baseOption', selectedBase);
      formData.append('baseOptionName', selectedBaseOption.name);
      formData.append('primaryColor', primaryColor);
      formData.append('secondaryColor', secondaryColor);
      formData.append('nfcLinks', JSON.stringify(filledLinks));
      formData.append('selectedIcons', JSON.stringify(selectedIcons));
      formData.append('totalPrice', totalPrice);
      formData.append('userEmail', user?.email || 'guest');
      formData.append('userName', user?.name || 'Guest');

      await axios.post(`${API}/nfc-stand/order`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      toast.success('Order submitted successfully! Check your email for confirmation.');
      
      // Reset form
      setSelectedBase(null);
      setPrimaryColor('');
      setSecondaryColor('');
      setLogoFile(null);
      setLogoPreview('');
      setNfcLinks(['', '', '']);
      setSelectedIcons({});
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Customization Section Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">Build Your Stand</h2>
        <p className="text-gray-600">Customize every detail to match your brand</p>
      </div>

      {/* Main content with customizer and summary */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Customization Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Choose Base */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('base')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Your Base</h3>
                  <p className="text-sm text-gray-600">Select NFC chips and additional features</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform ${expandedSections.base ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.base && (
              <div className="p-6 grid md:grid-cols-2 gap-4">
                {BASE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedBase(option.id);
                      setNfcLinks(option.id.includes('3nfc') ? ['', '', ''] : ['', '']);
                      setSelectedIcons({});
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedBase === option.id
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">{option.name}</h4>
                      {selectedBase === option.id && <Check className="h-5 w-5 text-blue-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <p className="text-2xl font-bold text-green-600">${option.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Choose Colors */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('colors')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Colors</h3>
                  <p className="text-sm text-gray-600">Select primary and secondary colors</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform ${expandedSections.colors ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.colors && (
              <div className="p-6 space-y-6">
                <ColorPicker
                  label="Primary Color"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  dataTestId="primary-color-picker"
                  onOpenChange={(isOpen) => {
                    if (!isOpen) return;
                  }}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  dataTestId="secondary-color-picker"
                  onOpenChange={(isOpen) => {
                    if (!isOpen) return;
                  }}
                />
              </div>
            )}
          </div>

          {/* Continuing in next edit for brevity... */}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              {selectedBaseOption && (
                <div className="flex justify-between">
                  <span className="text-gray-700">{selectedBaseOption.name}</span>
                  <span className="font-semibold">${selectedBaseOption.price.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 pt-4">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-3xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting}
              className="w-full py-6 text-lg font-bold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </Button>

            {!isFormComplete && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-2">Complete these steps:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {missingRequirements.map((req, idx) => (
                    <li key={idx}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildYourStand;
