import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, ShoppingCart, ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ColorPicker, { COLORS } from '../components/ColorPicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState({});
  const [selectedColor, setSelectedColor] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      const productData = response.data;
      
      // Redirect Payment Stands products to custom builder page
      if (productData.category === 'Payment Stands') {
        navigate('/nfc-stand');
        return;
      }
      
      setProduct(productData);
      
      // Show color picker if product has color options
      if (productData.available_colors && productData.available_colors.length > 0) {
        setShowColorPicker(true);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const customization = {};
      if (selectedColor) {
        customization.color = selectedColor;
      }
      if (Object.keys(selectedVariant).length > 0) {
        Object.assign(customization, selectedVariant);
      }
      
      addToCart(product, quantity, Object.keys(customization).length > 0 ? customization : null);
      
      // Get color name from hex
      const colorObj = COLORS.find(c => c.hex === selectedColor);
      const colorText = colorObj ? ` (${colorObj.name})` : '';
      toast.success(`${quantity} x ${product.name}${colorText} added to cart!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')} className="btn-primary">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="product-detail-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" className="h-14 w-auto" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Print Queen 3D
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-blue-600 transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
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
        <Button
          onClick={() => navigate('/products')}
          variant="ghost"
          className="mb-8 flex items-center space-x-2"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Products</span>
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden h-96 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="product-main-image"
                />
              ) : (
                <Package className="h-32 w-32 text-gray-300" />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`glass-card rounded-lg overflow-hidden h-24 ${
                      selectedImage === index ? 'ring-4 ring-blue-500' : ''
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full mb-2">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="product-title">{product.name}</h1>
              <p className="text-3xl font-bold text-green-600" data-testid="product-price">${product.price.toFixed(2)}</p>
            </div>

            <p className="text-gray-600 text-lg" data-testid="product-description">{product.description}</p>

            {/* Color Picker */}
            {showColorPicker && (
              <ColorPicker 
                label="Choose Color"
                value={selectedColor}
                onChange={setSelectedColor}
                dataTestId="product-color-picker"
              />
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Options</h3>
                {product.variants.map((variant, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{variant.name}</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setSelectedVariant({ ...selectedVariant, [variant.name]: e.target.value })}
                      data-testid={`variant-${variant.name}`}
                    >
                      <option value="">Select {variant.name}</option>
                      <option value={variant.value}>
                        {variant.value}
                        {variant.price_adjustment > 0 && ` (+$${variant.price_adjustment.toFixed(2)})`}
                      </option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="decrease-quantity"
                >
                  -
                </Button>
                <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-value">{quantity}</span>
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  data-testid="increase-quantity"
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-gray-500">{product.stock} available</p>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full btn-primary text-lg py-6"
              data-testid="add-to-cart-button"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;