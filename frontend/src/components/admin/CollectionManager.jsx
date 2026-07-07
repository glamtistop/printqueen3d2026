import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, FolderOpen, X, Package, Layers, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CollectionCard = ({ collection, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-200 group"
  >
    {collection.image_url && (
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 mb-4">
        <img src={collection.image_url} alt={collection.name} className="h-full w-full object-cover" />
      </div>
    )}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
          collection.type === 'manual' 
            ? 'bg-blue-100' 
            : 'bg-purple-100'
        }`}>
          {collection.type === 'manual' 
            ? <Layers className="h-6 w-6 text-blue-600" />
            : <FolderOpen className="h-6 w-6 text-purple-600" />
          }
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{collection.name}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            collection.type === 'manual' 
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {collection.type === 'manual' ? 'Manual' : 'Automated'}
          </span>
        </div>
      </div>
    </div>
    
    {collection.description && (
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{collection.description}</p>
    )}
    
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Package className="h-4 w-4" />
        <span>{collection.product_ids?.length || 0} products</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(collection)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(collection.id)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

export const CollectionManager = () => {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    image_alt: '',
    link_url: '',
    type: 'manual',
    product_ids: [],
    rules: []
  });

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/collections`);
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await axios.put(
          `${BACKEND_URL}/api/collections/${editingCollection.id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Collection updated!');
      } else {
        await axios.post(
          `${BACKEND_URL}/api/collections`,
          formData,
          { withCredentials: true }
        );
        toast.success('Collection created!');
      }
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error('Failed to save collection:', error);
      toast.error('Failed to save collection');
    }
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      image_url: collection.image_url || collection.cover_image_url || collection.image || '',
      image_alt: collection.image_alt || '',
      link_url: collection.link_url || collection.url || '',
      type: collection.type,
      product_ids: collection.product_ids || [],
      rules: collection.rules || []
    });
    setShowForm(true);
  };

  const handleDelete = async (collectionId) => {
    if (!window.confirm('Delete this collection?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/collections/${collectionId}`, {
        withCredentials: true
      });
      toast.success('Collection deleted');
      fetchCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      image_alt: '',
      link_url: '',
      type: 'manual',
      product_ids: [],
      rules: []
    });
    setEditingCollection(null);
    setShowForm(false);
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, { field: 'category', operator: 'equals', value: '' }]
    }));
  };

  const updateRule = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Collections</h1>
          <p className="text-slate-500">{collections.length} total collections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Collection
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-[5%] sm:w-full sm:max-w-xl z-50 overflow-y-auto max-h-[90vh]"
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Form Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {editingCollection ? 'Edit Collection' : 'New Collection'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="Enter collection name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                      placeholder="Describe this collection"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <ImageIcon className="h-4 w-4 inline mr-1" /> Collection Image
                    </label>
                    {formData.image_url && (
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img src={formData.image_url} alt="Collection preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <ImageUploader
                      images={[]}
                      onUpload={(urls) => setFormData({ ...formData, image_url: urls[0] || '' })}
                      maxImages={1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Collection Image Alt Text
                    </label>
                    <input
                      type="text"
                      value={formData.image_alt || ''}
                      onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="Describe the collection image"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <LinkIcon className="h-4 w-4 inline mr-1" /> Collection Link
                    </label>
                    <input
                      type="text"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="/products?collection=..."
                    />
                    <p className="mt-1 text-xs text-slate-500">Leave blank to automatically link this collection to its products.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Collection Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'manual' })}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          formData.type === 'manual'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Layers className={`h-5 w-5 ${formData.type === 'manual' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div className="text-left">
                          <p className={`font-medium ${formData.type === 'manual' ? 'text-blue-700' : 'text-slate-700'}`}>Manual</p>
                          <p className="text-xs text-slate-500">Select products</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'automated' })}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          formData.type === 'automated'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <FolderOpen className={`h-5 w-5 ${formData.type === 'automated' ? 'text-purple-600' : 'text-slate-400'}`} />
                        <div className="text-left">
                          <p className={`font-medium ${formData.type === 'automated' ? 'text-purple-700' : 'text-slate-700'}`}>Automated</p>
                          <p className="text-xs text-slate-500">Rule-based</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {formData.type === 'manual' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Products ({formData.product_ids.length} selected)
                      </label>
                      <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                        {products.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">No products available</p>
                        ) : (
                          products.map((product) => (
                            <label
                              key={product.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                formData.product_ids.includes(product.id)
                                  ? 'bg-blue-50'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.product_ids.includes(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700">{product.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Collection Rules
                      </label>
                      <div className="space-y-3">
                        {formData.rules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2 flex-wrap">
                            <select
                              value={rule.field}
                              onChange={(e) => updateRule(index, 'field', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            >
                              <option value="category">Category</option>
                              <option value="price">Price</option>
                            </select>
                            <select
                              value={rule.operator}
                              onChange={(e) => updateRule(index, 'operator', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            >
                              <option value="equals">Equals</option>
                              <option value="less_than">Less than</option>
                              <option value="greater_than">Greater than</option>
                            </select>
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => updateRule(index, 'value', e.target.value)}
                              placeholder="Value"
                              className="flex-1 min-w-[100px] px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addRule}
                          className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                        >
                          + Add Rule
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      {editingCollection ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No collections yet</h3>
          <p className="text-slate-500 mb-6">Create collections to organize your products</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Collection
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
