import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { ShoppingCart, Package, Filter, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? `${API}/products`
        : `${API}/products?category=${selectedCategory}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen" data-testid="products-page">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        ✨ Free Shipping on Orders Over $75 | Use Code: FREESHIP75 ✨
      </div>
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" className="h-14 w-auto" />
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link to="/cart" className="relative" data-testid="cart-icon">
                <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-blue-600 transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
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
                    <DropdownMenuItem onClick={() => window.location.href = '/orders'}>
                      My Orders
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
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
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-xl text-gray-600">Discover amazing 3D printed creations</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64" data-testid="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20" data-testid="no-products">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Check back later for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card glass-card rounded-2xl overflow-hidden" data-testid={`product-card-${product.id}`}>
                <Link to={product.is_custom ? product.custom_page_url : `/products/${product.id}`}>
                  <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        data-testid={`product-image-${product.id}`}
                      />
                    ) : (
                      <Package className="h-24 w-24 text-gray-300" />
                    )}
                  </div>
                </Link>
                <div className="p-6 space-y-4">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full mb-2">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                    <p className="text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600" data-testid={`product-price-${product.id}`}>
                      ${product.is_custom ? 'Starting at ' : ''}${product.price.toFixed(2)}
                    </span>
                    {product.is_custom ? (
                      <Link to={product.custom_page_url}>
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
                    <p className="text-sm text-red-600 font-medium">Out of stock</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;