import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductForm } from './ProductForm';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { 
  Trash2, Edit, Eye, EyeOff, Copy, Plus, Search, 
  Package, Grid3X3, List, MoreVertical, ArrowLeft,
  Filter
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProductCard = ({ product, isSelected, onSelect, onEdit, onDuplicate, onDelete, onTogglePublish }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden group hover:shadow-lg ${
      isSelected ? 'border-blue-500 shadow-md' : 'border-slate-100 hover:border-slate-200'
    }`}
  >
    {/* Image */}
    <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100">
      {product.images && product.images[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package className="h-12 w-12 text-slate-300" />
        </div>
      )}
      
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-5 w-5 rounded-lg border-2 border-white shadow-md cursor-pointer accent-blue-500"
        />
      </div>

      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <button
          onClick={onTogglePublish}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md transition-colors ${
            product.published
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-600 text-white'
          }`}
        >
          {product.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {product.published ? 'Live' : 'Draft'}
        </button>
      </div>

      {/* Product Badge */}
      {product.badge && (
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-md">
            {product.badge}
          </span>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h3>
        <span className="text-lg font-bold text-emerald-600">${product.price.toFixed(2)}</span>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {product.category}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Made to order'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={onDuplicate}
          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

export const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/products/${productId}`, {
        withCredentials: true
      });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to delete');
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/products/bulk-delete`,
        selectedProducts,
        { withCredentials: true }
      );
      setSelectedProducts([]);
      toast.success(`${selectedProducts.length} products deleted`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      toast.error('Failed to delete products');
    }
  };

  const togglePublish = async (productId, currentStatus) => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/products/${productId}/publish`,
        null,
        {
          params: { published: !currentStatus },
          withCredentials: true
        }
      );
      toast.success(currentStatus ? 'Product unpublished' : 'Product published');
      fetchProducts();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error('Failed to update product status');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDuplicate = async (productId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/products/${productId}/duplicate`,
        null,
        { withCredentials: true }
      );
      toast.success('Product duplicated! Saved as draft.');
      fetchProducts();
    } catch (error) {
      console.error('Failed to duplicate product:', error);
      toast.error('Failed to duplicate product');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    toast.success(editingProduct ? 'Product updated!' : 'Product created!');
    fetchProducts();
  };

  const toggleSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500">{products.length} total products</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white rounded-2xl p-4 border border-slate-100">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedProducts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedProducts.length})
              </motion.button>
            )}
          </AnimatePresence>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Add your first product to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          layout
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProducts.includes(product.id)}
                onSelect={() => toggleSelection(product.id)}
                onEdit={() => handleEdit(product)}
                onDuplicate={() => handleDuplicate(product.id)}
                onDelete={() => handleDelete(product.id)}
                onTogglePublish={() => togglePublish(product.id, product.published)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
