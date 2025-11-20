import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Package, Upload, Link as LinkIcon, ShoppingCart, User, LogOut, X, Check, ChevronDown } from 'lucide-react';
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

const ICON_OPTIONS = [
  'Instagram', 'Cash App', 'Apple Pay', 'Zelle', 'Venmo', 'Twitter "X"', 'Tiktok', 'Custom'
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
  const [selectedIcons, setSelectedIcons] = useState(['', '', '']);
  const [customIcons, setCustomIcons] = useState(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    base: false,
    colors: false,
    logo: false,
    links: false,
    icons: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const selectedBaseOption = BASE_OPTIONS.find(b => b.id === selectedBase);
  const totalPrice = selectedBaseOption ? selectedBaseOption.price : 0;
  const maxLinks = selectedBase?.includes('3nfc') ? 3 : 2;
  
  // Check if at least one NFC link is provided
  const hasNfcLinks = nfcLinks.some(link => link.trim() !== '');
  
  // Check if icons are selected for each chip
  const hasIcons = selectedIcons.slice(0, maxLinks).every((icon, index) => {
    if (!icon) return false;
    if (icon === 'Custom') {
      return customIcons[index] && customIcons[index].trim() !== '';
    }
    return true;
  });
  
  // Check if all required fields are filled
  const isFormComplete = selectedBase && primaryColor && secondaryColor && logoFile && hasNfcLinks && hasIcons;
  
  // Get list of missing requirements
  const missingRequirements = [];
  if (!selectedBase) missingRequirements.push('Base configuration');
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

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" data-testid="nfc-stand-page">
      {/* Announcement Bar */}
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" className="h-14 w-auto" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Product Header Section - Matching Product Detail Page Layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Product Image - Left Side */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden h-96 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
              <img
                src="https://printqueen3d-storefront1.vercel.app/paymentstands.PNG"
                alt="Custom NFC Payment Stand"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your Colors</h3>
                  <p className="text-gray-600">Choose from 32 premium colors for primary and secondary accents</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">NFC Programmed</h3>
                  <p className="text-gray-600">Up to 3 NFC chips programmed with your custom links</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏷️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your Branding</h3>
                  <p className="text-gray-600">Upload your logo for a professional, branded appearance</p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200">
                <p className="text-center text-gray-700 font-semibold">
                  ⚡ Starting at <span className="text-3xl font-bold text-green-600">$45.00</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Build Your Stand</h2>
          <p className="text-lg text-gray-600">Complete all 4 steps to create your perfect NFC stand</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Configuration */}
          <div className="space-y-6 lg:space-y-8">
            {/* Step 1: Base Selection */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                onClick={() => toggleSection('base')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    selectedBase ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {selectedBase ? <Check className="h-6 w-6" /> : '1'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Base</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedBase && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSections.base ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedSections.base && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {BASE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedBase(option.id)}
                    className={`relative group overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                      selectedBase === option.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    data-testid={`base-option-${option.id}`}
                  >
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                      <img
                        src={option.image}
                        alt={option.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2 bg-white">
                      <h3 className="font-semibold text-xs text-gray-900 leading-tight mb-1">{option.name}</h3>
                      <p className="text-lg font-bold text-green-600">${option.price.toFixed(2)}</p>
                    </div>
                    {selectedBase === option.id && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-500 rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* Step 2: Colors */}
            <div className={`product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-100 transition-all duration-300 ${
              isColorDropdownOpen ? 'pb-96' : ''
            }`}>
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                onClick={() => toggleSection('colors')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    (primaryColor && secondaryColor) ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  }`}>
                    {(primaryColor && secondaryColor) ? <Check className="h-6 w-6" /> : '2'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Colors</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {(primaryColor && secondaryColor) && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSections.colors ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedSections.colors && (
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  dataTestId="primary-color-picker"
                  onOpenChange={setIsColorDropdownOpen}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  dataTestId="secondary-color-picker"
                  onOpenChange={setIsColorDropdownOpen}
                />

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
              )}
            </div>

            {/* Step 3: Logo Upload */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-200">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                onClick={() => toggleSection('logo')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    logoFile ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'
                  }`}>
                    {logoFile ? <Check className="h-6 w-6" /> : '3'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload Logo</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {logoFile && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSections.logo ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedSections.logo && (
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
              )}
            </div>

            {/* Step 4: NFC Links */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-300">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                onClick={() => toggleSection('links')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    hasNfcLinks ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {hasNfcLinks ? <Check className="h-6 w-6" /> : '4'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Add NFC Links</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {hasNfcLinks && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSections.links ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedSections.links && (
              <>
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
              </>
              )}
            </div>

            {/* Step 5: Icon Selection */}
            <div className="product-card p-6 space-y-4 animate-in fade-in slide-in-from-left duration-500 delay-400">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded-lg transition-colors"
                onClick={() => toggleSection('icons')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                    hasIcons ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                  }`}>
                    {hasIcons ? <Check className="h-6 w-6" /> : '5'}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Icons</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {hasIcons && (
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Complete</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedSections.icons ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedSections.icons && (
              <>
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
                      value={selectedIcons[index]}
                      onChange={(e) => {
                        const newIcons = [...selectedIcons];
                        newIcons[index] = e.target.value;
                        setSelectedIcons(newIcons);
                        // Clear custom text if not custom
                        if (e.target.value !== 'Custom') {
                          const newCustom = [...customIcons];
                          newCustom[index] = '';
                          setCustomIcons(newCustom);
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
                          value={customIcons[index]}
                          onChange={(e) => {
                            const newCustom = [...customIcons];
                            newCustom[index] = e.target.value;
                            setCustomIcons(newCustom);
                          }}
                          placeholder="Enter custom icon(s), separate multiple with commas"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: LinkedIn, GitHub, Website
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </>
              )}
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

                  {/* Icon Selections */}
                  {selectedIcons.some(icon => icon) && (
                    <div className="pb-4 border-b border-gray-200">
                      <span className="text-gray-600 block mb-2">Selected Icons:</span>
                      <div className="space-y-2">
                        {selectedIcons.slice(0, maxLinks).map((icon, index) => (
                          icon && (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Chip {index + 1}:</span>
                              <span className="font-medium text-gray-900">
                                {icon === 'Custom' ? customIcons[index] || 'Custom' : icon}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
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

      {/* Footer */}
      <footer className="site-footer mt-20">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <img 
              src="/printqueen-logo.png" 
              alt="Print Queen 3D" 
              className="h-16 w-auto mb-4"
            />
            <p className="text-gray-300 font-semibold mb-2">
              Precision in Every Layer. Style in Every Print.<br />
              Built in LA. Made for Everywhere.<br />
              If You Can Dream It, We Can Print It.
            </p>
            <p className="text-gray-400 text-sm mb-4">
              <strong>Local Pickup Available In These Cities:</strong><br />
              Los Angeles, Altadena, Long Beach, Hawthorne, West Covina<br />
              <strong>Shipping Everywhere</strong>
            </p>
            <p className="text-gray-300">
              <a href="tel:8004956227" className="hover:text-blue-400">800-495-6227</a><br />
              <a href="mailto:Printqueen3d@gmail.com" className="hover:text-blue-400">Printqueen3d@gmail.com</a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/products">Shop Products</Link></li>
              <li><Link to="/nfc-stand">Request a Quote</Link></li>
              {user && <li><Link to="/orders">My Account</Link></li>}
            </ul>
          </div>

          {/* Connect & Collaborate */}
          <div className="footer-section">
            <h3>Connect & Collaborate</h3>
            <ul className="footer-links">
              <li><a href="mailto:Printqueen3d@gmail.com">Partner With Us</a></li>
              <li><a href="#">Product Care</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Refund Policy</a></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Print Queen 3D. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">Made to order in Los Angeles · Fast, reliable shipping · Local pickup available</p>
        </div>
      </footer>
    </div>
  );
};

export default NFCStandPage;