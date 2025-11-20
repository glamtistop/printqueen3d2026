import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, ShoppingCart, ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ColorPicker, { COLORS } from '../components/ColorPicker';
import BuildYourStand from '../components/BuildYourStand';
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
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      const productData = response.data;
      
      setProduct(productData);
      
      // Show color picker if product has color options
      if (productData.available_colors && productData.available_colors.length > 0) {
        setShowColorPicker(true);
      }

      // Fetch related products from same category
      fetchRelatedProducts(productData.category, productData.id);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category, currentProductId) => {
    try {
      const response = await axios.get(`${API}/products?category=${category}`);
      // Filter out current product and limit to 4
      const filtered = response.data
        .filter(p => p.id !== currentProductId && p.published)
        .slice(0, 4);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('Error fetching related products:', error);
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
            <Link to="/" className="flex items-center">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" className="h-14 w-auto" />
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

            {/* Material Details (if available) */}
            {product.material_details && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Material Details</h3>
                </div>
                <p className="text-sm text-gray-700">{product.material_details}</p>
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

            {/* Product Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {/* Production Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Production Time</h3>
                </div>
                <p className="text-sm text-gray-700">1-3 days</p>
              </div>

              {/* Shipping Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Shipping</h3>
                </div>
                <p className="text-sm text-gray-700">Ships after print is made and passes quality checks</p>
              </div>
            </div>

            {/* Material Details (if available) */}
            {product.material_details && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Material Details</h3>
                </div>
                <p className="text-sm text-gray-700">{product.material_details}</p>
              </div>
            )}

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

            {/* Quantity - Only show for non-custom products */}
            {!product.custom_builder && (
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
            )}

            {/* Add to Cart or Customize Button */}
            {product.custom_builder ? (
              <Button
                onClick={() => {
                  const builderElement = document.getElementById('custom-builder-section');
                  if (builderElement) {
                    builderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full btn-primary text-lg py-6"
                data-testid="customize-button"
              >
                Customize Your Stand
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full btn-primary text-lg py-6"
                data-testid="add-to-cart-button"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            )}
          </div>
        </div>

        {/* Custom Builder Component */}
        {product.custom_builder === 'nfc-stand-builder' && (
          <div id="custom-builder-section" className="mt-12 scroll-mt-24">
            <BuildYourStand product={product} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="group product-card rounded-xl overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                    <img
                      src={relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : 'https://via.placeholder.com/400'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {relatedProduct.badge && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {relatedProduct.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <p className="text-lg font-bold text-green-600">${relatedProduct.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;