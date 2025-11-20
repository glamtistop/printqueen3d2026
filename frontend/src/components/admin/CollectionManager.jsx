import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Trash2, Edit } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const CollectionManager = () => {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
      } else {
        await axios.post(
          `${BACKEND_URL}/api/collections`,
          formData,
          { withCredentials: true }
        );
      }
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error('Failed to save collection:', error);
      alert('Failed to save collection');
    }
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
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
      fetchCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collections</h2>
          <p className="text-gray-600">{collections.length} collections</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {showForm ? 'Cancel' : '+ Add Collection'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCollection ? 'Edit Collection' : 'New Collection'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={formData.type === 'manual'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mr-2"
                  />
                  Manual (Select products)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="automated"
                    checked={formData.type === 'automated'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mr-2"
                  />
                  Automated (Rule-based)
                </label>
              </div>
            </div>

            {formData.type === 'manual' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Products ({formData.product_ids.length} selected)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.product_ids.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="mr-3"
                      />
                      <span className="text-sm">{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Rules
                </label>
                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(index, 'field', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="category">Category</option>
                        <option value="price">Price</option>
                      </select>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(index, 'operator', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRule}>
                    + Add Rule
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingCollection ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <div key={collection.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-900">{collection.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                collection.type === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {collection.type}
              </span>
            </div>
            {collection.description && (
              <p className="text-sm text-gray-600 mb-3">{collection.description}</p>
            )}
            <p className="text-sm text-gray-500 mb-3">
              {collection.product_ids?.length || 0} products
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(collection)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(collection.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No collections yet. Create your first collection!</p>
        </div>
      )}
    </div>
  );
};
