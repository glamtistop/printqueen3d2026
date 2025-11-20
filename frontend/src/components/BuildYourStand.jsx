import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Upload, X, Check, ChevronDown, Link as LinkIcon } from 'lucide-react';
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
    description: 'Perfect for dual functionality'
  },
  {
    id: '3nfc',
    name: '3 NFC Chips',
    price: 55.00,
    description: 'Maximum versatility'
  },
  {
    id: '2nfc-card',
    name: '2 NFC + Business Card Holder',
    price: 60.00,
    description: 'Professional networking solution'
  },
  {
    id: '2nfc-square',
    name: '2 NFC + Square Reader',
    price: 65.00,
    description: 'Accept payments on the go'
  },
  {
    id: '3nfc-card',
    name: '3 NFC + Business Card Holder',
    price: 70.00,
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
  const [customIcons, setCustomIcons] = useState({});
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

  // Check completion status for each step
  const isStep1Complete = !!selectedBase;
  const isStep2Complete = !!primaryColor && !!secondaryColor;
  const isStep3Complete = !!logoFile;
  const isStep4Complete = hasNfcLinks;
  const isStep5Complete = hasIcons;

  // Auto-collapse and open next step when current step is completed
  const handleStepCompletion = (completedStep, nextStep) => {
    // Close current step with smooth animation
    setExpandedSections(prev => ({
      ...prev,
      [completedStep]: false
    }));
    
    // Wait for collapse animation to finish, then open next step
    setTimeout(() => {
      setExpandedSections(prev => ({
        ...prev,
        [nextStep]: true
      }));
      
      // Scroll to next step after it starts opening
      setTimeout(() => {
        const nextElement = document.getElementById(`step-${nextStep}`);
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }, 400);
  };

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
      // Auto-collapse and move to next step
      handleStepCompletion('logo', 'links');
    }
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...nfcLinks];
    newLinks[index] = value;
    setNfcLinks(newLinks);
    
    // Check if at least one link is filled
    const hasAnyLink = newLinks.slice(0, maxLinks).some(link => link.trim() !== '');
    if (hasAnyLink) {
      // Auto-collapse and move to next step
      handleStepCompletion('links', 'icons');
    }
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
      setCustomIcons({});
      
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
          <div id="step-base" className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
            <button
              onClick={() => toggleSection('base')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  selectedBase ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {selectedBase ? <Check className="h-6 w-6" /> : '1'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Your Base</h3>
                  <p className="text-sm text-gray-600">Select NFC chips and additional features</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.base ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.base && (
              <div className="p-6 grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                {BASE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedBase(option.id);
                      setNfcLinks(option.id.includes('3nfc') ? ['', '', ''] : ['', '']);
                      setSelectedIcons({});
                      // Auto-collapse and move to next step
                      handleStepCompletion('base', 'colors');
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
          <div id="step-colors" className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
            <button
              onClick={() => toggleSection('colors')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  primaryColor && secondaryColor ? 'bg-green-600' : 'bg-purple-600'
                }`}>
                  {primaryColor && secondaryColor ? <Check className="h-6 w-6" /> : '2'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Choose Colors</h3>
                  <p className="text-sm text-gray-600">Select primary and secondary colors</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.colors ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.colors && (
              <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <ColorPicker
                  label="Primary Color"
                  value={primaryColor}
                  onChange={(color) => {
                    setPrimaryColor(color);
                    // If secondary color is already selected, move to next step
                    if (secondaryColor) {
                      handleStepCompletion('colors', 'logo');
                    }
                  }}
                  dataTestId="primary-color-picker"
                />
                <ColorPicker
                  label="Secondary Color"
                  value={secondaryColor}
                  onChange={(color) => {
                    setSecondaryColor(color);
                    // If primary color is already selected, move to next step
                    if (primaryColor) {
                      handleStepCompletion('colors', 'logo');
                    }
                  }}
                  dataTestId="secondary-color-picker"
                />
              </div>
            )}
          </div>

          {/* Step 3: Upload Logo */}
          <div id="step-logo" className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
            <button
              onClick={() => toggleSection('logo')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-orange-50 to-white hover:from-orange-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  logoFile ? 'bg-green-600' : 'bg-orange-600'
                }`}>
                  {logoFile ? <Check className="h-6 w-6" /> : '3'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload Logo</h3>
                  <p className="text-sm text-gray-600">Add your brand logo</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.logo ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.logo && (
              <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
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
                          setLogoPreview('');
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
            )}
          </div>

          {/* Step 4: NFC Links */}
          <div id="step-links" className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
            <button
              onClick={() => toggleSection('links')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-green-50 to-white hover:from-green-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  hasNfcLinks ? 'bg-green-600' : 'bg-green-500'
                }`}>
                  {hasNfcLinks ? <Check className="h-6 w-6" /> : '4'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add NFC Links</h3>
                  <p className="text-sm text-gray-600">Program your NFC chips</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.links ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.links && (
              <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-500">
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Icon Selection */}
          <div id="step-icons" className="glass-card rounded-2xl overflow-hidden scroll-mt-24">
            <button
              onClick={() => toggleSection('icons')}
              className="w-full flex items-center justify-between p-6 text-left bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  hasIcons ? 'bg-green-600' : 'bg-indigo-600'
                }`}>
                  {hasIcons ? <Check className="h-6 w-6" /> : '5'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Select Icons</h3>
                  <p className="text-sm text-gray-600">Choose icons for each chip</p>
                </div>
              </div>
              <ChevronDown className={`h-6 w-6 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.icons ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections.icons && (
              <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <p className="text-sm text-gray-600 mb-4">
                  Choose an icon for each NFC chip ({maxLinks} total)
                </p>

                <div className="space-y-4">
                  {Array.from({ length: maxLinks }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Icon for Chip {index + 1}
                      </label>
                      <select
                        value={selectedIcons[index] || ''}
                        onChange={(e) => {
                          const newIcons = {...selectedIcons};
                          newIcons[index] = e.target.value;
                          setSelectedIcons(newIcons);
                          // Clear custom text if not custom
                          if (e.target.value !== 'Custom') {
                            const newCustom = {...customIcons};
                            newCustom[index] = '';
                            setCustomIcons(newCustom);
                          }
                          
                          // Check if all icons are selected
                          const allIconsSelected = Object.keys(newIcons).length === maxLinks && 
                                                   Object.values(newIcons).every(icon => icon && icon.trim() !== '');
                          if (allIconsSelected && e.target.value !== 'Custom') {
                            // Auto-collapse this section - all done!
                            setTimeout(() => {
                              setExpandedSections(prev => ({
                                ...prev,
                                icons: false
                              }));
                            }, 500);
                          }
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                      >
                        <option value="">Select an icon...</option>
                        {ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      
                      {/* Custom icon text field */}
                      {selectedIcons[index] === 'Custom' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={customIcons[index] || ''}
                            onChange={(e) => {
                              const newCustom = {...customIcons};
                              newCustom[index] = e.target.value;
                              setCustomIcons(newCustom);
                            }}
                            placeholder="Enter custom icon text"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
