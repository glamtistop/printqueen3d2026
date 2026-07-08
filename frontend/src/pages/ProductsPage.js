import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Package, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';
import { Skeleton } from '../components/ui/skeleton';
import { ROUTE_META, setPageMeta } from '../lib/seo';
import { fetchSiteConfig } from '../lib/siteConfig';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productRequestRef = useRef(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(() => new URLSearchParams(window.location.search).get('category') || '');
  const [selectedCollection, setSelectedCollection] = useState(() => new URLSearchParams(window.location.search).get('collection') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get category from URL query params
    const categoryFromUrl = searchParams.get('category');
    const collectionFromUrl = searchParams.get('collection');
    setSelectedCategory(categoryFromUrl || '');
    setSelectedCollection(collectionFromUrl || '');
  }, [searchParams]);

  // Static content (categories, collections, featured, site-config) loads once.
  useEffect(() => {
    fetchCategories();
    fetchShopContent();
  }, []);

  // Products refetch when the category/collection filter changes.
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCollection]);

  // Search is debounced so typing does not fire a request per keystroke.
  const didMountSearch = useRef(false);
  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchShopContent = async () => {
    try {
      const [collectionsResponse, featuredResponse, siteData] = await Promise.all([
        axios.get(`${API}/collections`),
        axios.get(`${API}/products/featured/list?limit=6`),
        fetchSiteConfig()
      ]);
      setCollections(collectionsResponse.data);
      setFeaturedProducts(featuredResponse.data);
      setSiteConfig(siteData);
    } catch (error) {
      console.error('Error fetching shop content:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/category-names`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    const requestId = productRequestRef.current + 1;
    productRequestRef.current = requestId;
    setLoading(true);
    try {
      const params = new URLSearchParams({ published: 'true' });
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      if (selectedCollection) {
        params.set('collection', selectedCollection);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      const response = await axios.get(`${API}/products?${params.toString()}`);
      if (requestId !== productRequestRef.current) return;
      setProducts(response.data);
    } catch (error) {
      if (requestId !== productRequestRef.current) return;
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      if (requestId === productRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedCollection('');
    // Update URL without full navigation
    if (category) {
      navigate(`/products?category=${category}`, { replace: true });
    } else {
      navigate('/products', { replace: true });
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCollection('');
    setSearchQuery('');
    navigate('/products', { replace: true });
  };

  const getCollectionImage = (collection) => (
    collection.image_url || collection.cover_image_url || collection.image || ''
  );

  const normalizeCollectionKey = (value = '') => String(value)
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const selectedCollectionData = collections.find((collection) => collection.id === selectedCollection);
  const selectedCollectionName = selectedCollectionData?.name;
  const selectedCollectionKey = normalizeCollectionKey(selectedCollection);
  const selectedCollectionNameKey = normalizeCollectionKey(selectedCollectionName);
  const isDesignYourOwnCollection = selectedCollectionKey === 'design your own' || selectedCollectionNameKey === 'design your own';
  const isCollectionView = Boolean(selectedCollection);
  const isCollectionOrCategoryView = Boolean(selectedCollection || selectedCategory);
  const selectedCollectionText = `${selectedCollectionName || ''} ${selectedCollectionData?.description || ''}`.toLowerCase();
  const normalizedCollectionText = selectedCollectionText.replace('decor', 'décor');
  const isNfcStandCollection = selectedCollectionText.includes('nfc') && (selectedCollectionText.includes('stand') || selectedCollectionText.includes('payment'));
  const isHomeDecorCollection = normalizedCollectionText.includes('home décor') || normalizedCollectionText.includes('lithophane');
  const isToysFidgetsCollection = selectedCollectionText.includes('toy') || selectedCollectionText.includes('fidget');
  const firstNfcStandProduct = products.find((product) => {
    const text = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
    return text.includes('nfc') && (text.includes('stand') || text.includes('display') || text.includes('payment'));
  });
  const collectionCtaText = isNfcStandCollection
    ? 'Customize My Stand'
    : isHomeDecorCollection
      ? 'Customize My Own'
      : isToysFidgetsCollection
        ? 'Build Your Own'
        : 'Start Custom Project';
  const collectionCtaLink = isNfcStandCollection
    ? `/products/${firstNfcStandProduct?.id || 'nfc-connect-duo'}`
    : '/design-your-own';

  useEffect(() => {
    if (isDesignYourOwnCollection) {
      navigate('/design-your-own', { replace: true });
    }
  }, [isDesignYourOwnCollection, navigate]);

  // Collection-specific SEO title/description; falls back to the shop default.
  useEffect(() => {
    if (selectedCollectionData) {
      const cleanName = (selectedCollectionData.name || '')
        .replace(/[^\p{L}\p{N} &'-]+/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
      setPageMeta({
        title: `${cleanName} – Custom 3D Printed | Print Queen 3D`,
        description: (selectedCollectionData.description || '').slice(0, 155).trim() || ROUTE_META['/shop'].description,
        path: '/shop'
      });
    } else {
      setPageMeta({ ...ROUTE_META['/shop'], path: '/shop' });
    }
  }, [selectedCollectionData]);

  const filteredProducts = products;

  const isCustomProduct = (product) => {
    const customTerms = ['custom', 'personal', 'name', 'nfc', 'lithophane', 'photo', 'qr', 'keychain', 'logo', 'wedding', 'memorial'];
    const text = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
    return Boolean(product?.is_custom || product?.custom_builder || customTerms.some((term) => text.includes(term)));
  };

  const formatPrice = (price, prefix = '') => {
    const amount = Number(price || 0).toFixed(2);
    return `${prefix ? `${prefix} ` : ''}$${amount}`;
  };

  const ProductPrice = ({ product, size = 'lg' }) => {
    const hasComparePrice = Number(product?.compare_at_price) > Number(product?.price || 0);
    const saleClass = size === 'sm' ? 'text-xl' : 'text-2xl';
    return (
      <div className="flex flex-col">
        {hasComparePrice && (
          <span className="text-sm font-semibold text-gray-400 line-through">
            {formatPrice(product.compare_at_price, product.compare_at_price_prefix)}
          </span>
        )}
        <span className={`${saleClass} font-bold text-green-600`} data-testid={`product-price-${product.id}`}>
          {formatPrice(product.price, product.price_prefix || (product.custom_builder ? 'Starting at' : ''))}
        </span>
      </div>
    );
  };

  const ProductBadge = ({ product, className = '' }) => {
    if (!product?.badge || product.sale_badge_enabled === false) return null;
    return (
      <div
        className={`absolute text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${className}`}
        style={{ backgroundColor: product.badge_color || '#dc2626' }}
      >
        {product.badge}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="products-page">
      <Navbar />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4" data-testid="page-title">
            {selectedCategory || selectedCollectionName || (selectedCollection ? 'Collection Products' : 'Shop')}
          </h1>
          <p className="text-xl text-gray-600">Discover professionally 3D printed creations made to personalize, gift, and use every day.</p>
        </div>

        {selectedCollectionData && (
          <section className="mb-12 rounded-2xl border border-blue-100 bg-white p-5 md:p-8 shadow-sm">
            <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-6 items-center">
              {getCollectionImage(selectedCollectionData) && (
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-green-50">
                  <img src={getCollectionImage(selectedCollectionData)} alt={selectedCollectionData.image_alt || selectedCollectionName} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="text-center md:text-left">
                <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 mb-4">Collection</span>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedCollectionName}</h2>
                {selectedCollectionData.description && (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{selectedCollectionData.description}</p>
                )}
                <p className="mt-5 text-sm font-semibold text-blue-700">
                  Choose a product or sample below to personalize it. If you need something completely custom, use Design Your Own.
                </p>
                <div className={(isNfcStandCollection || isHomeDecorCollection || isToysFidgetsCollection) ? 'flex justify-center mt-7' : 'mt-5'}>
                  <Link
                    to={collectionCtaLink}
                    className={`inline-flex rounded-full bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all ${
                      isNfcStandCollection || isHomeDecorCollection || isToysFidgetsCollection
                        ? 'px-9 py-4 text-lg'
                        : 'px-6 py-3 text-sm'
                    }`}
                  >
                  {collectionCtaText}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {collections.length > 0 && !isCollectionOrCategoryView && (
          <section className="mb-12">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">All Collections</h2>
                <p className="text-gray-600">Browse collection groups from the admin.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map((collection) => {
                const image = getCollectionImage(collection);
                return (
                  <Link key={collection.id} to={(collection.name || '').trim().toLowerCase() === 'design your own' ? '/design-your-own' : `/shop?collection=${encodeURIComponent(collection.id)}`} className="group product-card rounded-xl overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                      {image ? (
                        <img src={image} alt={collection.name} loading="lazy" decoding="async" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-blue-200">{collection.name?.charAt(0) || 'C'}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{collection.name}</h3>
                      {collection.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{collection.description}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && !selectedCategory && !selectedCollection && !searchQuery && (
          <section className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
              <p className="text-gray-600">Popular ready-to-order and customizable favorites.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="group product-card rounded-xl overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                    <ProductBadge product={product} className="top-3 right-3" />
                    <img src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400'} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <ProductPrice product={product} size="sm" />
                      <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                        {isCustomProduct(product) ? 'Customize Now' : 'View'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        {!isCollectionOrCategoryView && (
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
        )}

        {/* Products Grid */}
        {!isDesignYourOwnCollection && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isCollectionOrCategoryView ? 'Choose a Product to Personalize' : 'New Arrivals & Ready-to-Order Items'}
            </h2>
            <p className="text-gray-600 mt-2">Shop finished products and custom-ready designs.</p>
            {isCollectionOrCategoryView && (
              <button onClick={clearFilters} className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-900">
                View all collections
              </button>
            )}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isDesignYourOwnCollection ? null : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters, or start a custom request and tell us what you need.</p>
            {selectedCollection && (
              <Link to="/design-your-own" className="inline-flex mt-5 rounded-full bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">
                Request This Collection Custom
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {filteredProducts.map((product) => {
              const customProduct = isCustomProduct(product);
              return (
              <Link key={product.id} to={`/products/${product.id}`} className="product-card group block" data-testid={`product-card-${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 to-green-50">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      data-testid={`product-image-${product.id}`}
                    />
                    <ProductBadge product={product} className="top-4 right-4" />
                  </div>
                <div className="p-6 space-y-3">
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {product.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                    {product.subtitle && <p className="text-sm font-bold text-blue-700">{product.subtitle}</p>}
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                    {customProduct && (
                      <p className="text-sm text-blue-700 font-medium">
                        Personalize with names, logos, colors, photos, QR codes, NFC links, or custom text.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <ProductPrice product={product} />
                    <span
                      className="btn-primary inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                      data-testid={`view-details-${product.id}`}
                    >
                      {customProduct ? 'Customize Now' : 'View Details'}
                    </span>
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-sm text-yellow-600 font-medium">Only {product.stock} left in stock!</p>
                  )}
                  {product.stock === 0 && (
                    <p className={`text-sm font-medium ${customProduct ? 'text-blue-700' : 'text-red-600'}`}>
                      {customProduct ? 'Made to order' : 'Out of Stock'}
                    </p>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter siteConfig={siteConfig} />
    </div>
  );
};

export default ProductsPage;
