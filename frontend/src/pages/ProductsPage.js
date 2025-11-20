import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, ShoppingCart, User, LogOut, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get category from URL query params
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/category-names`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API}/products?published=true`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Update URL without full navigation
    if (category) {
      navigate(`/products?category=${category}`, { replace: true });
    } else {
      navigate('/products', { replace: true });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    navigate('/products', { replace: true });
  };

  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="products-page">
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
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4" data-testid="page-title">
            {selectedCategory || 'All Products'}
          </h1>
          <p className="text-xl text-gray-600">Discover our collection of premium 3D printed creations</p>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none"
                  data-testid="search-input"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory || searchQuery) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedCategory}
                  <button onClick={() => handleCategoryChange('')} className="hover:text-blue-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card group" data-testid={`product-card-${product.id}`}>
                <Link to={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 to-green-50">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      data-testid={`product-image-${product.id}`}
                    />
                    {product.badge && (
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {product.badge}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-6 space-y-3">
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                    <p className="text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600" data-testid={`product-price-${product.id}`}>
                      ${product.is_custom ? 'Starting at ' : ''}${product.price.toFixed(2)}
                    </span>
                    {product.custom_builder ? (
                      <Link to={`/products/${product.id}`}>
                        <Button
                          className="btn-secondary"
                          data-testid={`customize-${product.id}`}
                        >
                          Customize
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="btn-primary"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        Add to Cart
                      </Button>
                    )}
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-sm text-yellow-600 font-medium">Only {product.stock} left in stock!</p>
                  )}
                  {product.stock === 0 && (
                    <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
              <li><Link to="/products/nfc-stand-custom">Request a Quote</Link></li>
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

export default ProductsPage;
