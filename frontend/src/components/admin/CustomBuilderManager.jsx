import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  GripVertical,
  Type,
  Hash,
  List,
  Palette,
  Image,
  CheckSquare,
  ToggleLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Layers,
  Package,
  RefreshCw,
  Link as LinkIcon,
  Wand2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Field type definitions
const FIELD_TYPES = [
  { id: 'text', label: 'Text Input', icon: Type, description: 'Single line text' },
  { id: 'textarea', label: 'Text Area', icon: Type, description: 'Multi-line text' },
  { id: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { id: 'select', label: 'Dropdown', icon: List, description: 'Select from options' },
  { id: 'radio', label: 'Radio Buttons', icon: ToggleLeft, description: 'Single choice' },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Multiple choices' },
  { id: 'color', label: 'Color Picker', icon: Palette, description: 'Single color' },
  { id: 'color_dual', label: 'Dual Color Picker', icon: Palette, description: 'Primary & secondary' },
  { id: 'image', label: 'Image Upload', icon: Image, description: 'File upload' },
  { id: 'icon_select', label: 'Icon Selector', icon: Wand2, description: 'Choose icons' },
];

// Sortable Field Item
const SortableFieldItem = ({ field, onEdit, onDelete, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldType = FIELD_TYPES.find(t => t.id === field.type);
  const Icon = fieldType?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${isDragging ? 'border-blue-500 shadow-lg z-50' : 'border-slate-200'} p-4`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-2 rounded-lg hover:bg-slate-100 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>
        
        <div className={`p-2 rounded-lg ${field.required ? 'bg-blue-100' : 'bg-slate-100'}`}>
          <Icon className={`h-4 w-4 ${field.required ? 'text-blue-600' : 'text-slate-500'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{field.label}</p>
          <p className="text-xs text-slate-500">{fieldType?.label} • {field.name}</p>
        </div>
        
        {field.required && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Required</span>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(field)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(field)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(field.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Field Editor Modal
const FieldEditorModal = ({ field, onSave, onClose }) => {
  const [editedField, setEditedField] = useState(field || {
    id: crypto.randomUUID(),
    type: 'text',
    label: '',
    name: '',
    placeholder: '',
    description: '',
    required: false,
    order: 0,
    options: [],
    color_options: [],
    allow_custom_color: true,
    min_value: null,
    max_value: null,
    default_value: ''
  });

  const handleAddOption = () => {
    setEditedField(prev => ({
      ...prev,
      options: [...prev.options, { 
        id: crypto.randomUUID(), 
        label: '', 
        value: '', 
        price_adjustment: 0,
        description: ''
      }]
    }));
  };

  const handleRemoveOption = (index) => {
    setEditedField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index, key, value) => {
    setEditedField(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [key]: value } : opt)
    }));
  };

  const handleAddColor = () => {
    setEditedField(prev => ({
      ...prev,
      color_options: [...(prev.color_options || []), '#000000']
    }));
  };

  const handleRemoveColor = (index) => {
    setEditedField(prev => ({
      ...prev,
      color_options: prev.color_options.filter((_, i) => i !== index)
    }));
  };

  const handleColorChange = (index, value) => {
    setEditedField(prev => ({
      ...prev,
      color_options: prev.color_options.map((c, i) => i === index ? value : c)
    }));
  };

  const needsOptions = ['select', 'radio', 'checkbox', 'icon_select'].includes(editedField.type);
  const needsColors = ['color', 'color_dual'].includes(editedField.type);
  const needsMinMax = editedField.type === 'number';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {field ? 'Edit Field' : 'Add New Field'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Field Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIELD_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setEditedField(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editedField.type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-1 ${editedField.type === type.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${editedField.type === type.id ? 'text-blue-700' : 'text-slate-700'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Label *</label>
              <input
                type="text"
                value={editedField.label}
                onChange={(e) => setEditedField(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="e.g., Your Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Field Name *</label>
              <input
                type="text"
                value={editedField.name}
                onChange={(e) => setEditedField(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                placeholder="e.g., customer_name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={editedField.placeholder || ''}
              onChange={(e) => setEditedField(prev => ({ ...prev, placeholder: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
              placeholder="e.g., Enter your name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={editedField.description || ''}
              onChange={(e) => setEditedField(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
              placeholder="Help text shown below the field"
            />
          </div>

          {/* Required Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditedField(prev => ({ ...prev, required: !prev.required }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editedField.required ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editedField.required ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-slate-700">Required field</span>
          </div>

          {/* Number min/max */}
          {needsMinMax && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Value</label>
                <input
                  type="number"
                  value={editedField.min_value || ''}
                  onChange={(e) => setEditedField(prev => ({ ...prev, min_value: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Value</label>
                <input
                  type="number"
                  value={editedField.max_value || ''}
                  onChange={(e) => setEditedField(prev => ({ ...prev, max_value: e.target.value ? parseFloat(e.target.value) : null }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Options for select/radio/checkbox */}
          {needsOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Options</label>
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-sm hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" /> Add Option
                </button>
              </div>
              <div className="space-y-2">
                {editedField.options.map((opt, index) => (
                  <div key={opt.id || index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                      className="flex-1 px-2 py-1 rounded border border-slate-200 text-sm"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                      className="w-24 px-2 py-1 rounded border border-slate-200 text-sm font-mono"
                      placeholder="value"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={opt.price_adjustment || 0}
                        onChange={(e) => handleOptionChange(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 rounded border border-slate-200 text-sm"
                        placeholder="+/-"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {editedField.options.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No options added yet</p>
                )}
              </div>
            </div>
          )}

          {/* Color options */}
          {needsColors && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Preset Colors</label>
                <button
                  onClick={handleAddColor}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-sm hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" /> Add Color
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editedField.color_options || []).map((color, index) => (
                  <div key={index} className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => handleRemoveColor(index)}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => setEditedField(prev => ({ ...prev, allow_custom_color: !prev.allow_custom_color }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editedField.allow_custom_color ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editedField.allow_custom_color ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-700">Allow custom color input</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedField)}
            disabled={!editedField.label || !editedField.name}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {field ? 'Save Changes' : 'Add Field'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Base Option Editor
const BaseOptionEditor = ({ options, onChange }) => {
  const handleAdd = () => {
    onChange([...options, {
      id: crypto.randomUUID(),
      label: '',
      value: '',
      price_adjustment: 0,
      description: '',
      image_url: ''
    }]);
  };

  const handleRemove = (index) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleChange = (index, key, value) => {
    onChange(options.map((opt, i) => i === index ? { ...opt, [key]: value } : opt));
  };

  return (
    <div className="space-y-3">
      {options.map((opt, index) => (
        <div key={opt.id || index} className="p-4 bg-slate-50 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Option {index + 1}</span>
            <button
              onClick={() => handleRemove(index)}
              className="p-1 rounded hover:bg-red-100 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={opt.label}
              onChange={(e) => handleChange(index, 'label', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
              placeholder="Label (e.g., 2 NFC Chips)"
            />
            <input
              type="text"
              value={opt.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
              placeholder="Value (e.g., 2nfc)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={opt.price_adjustment || 0}
                onChange={(e) => handleChange(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder="Price"
              />
            </div>
            <input
              type="text"
              value={opt.description || ''}
              onChange={(e) => handleChange(index, 'description', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
              placeholder="Description"
            />
          </div>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add Base Option
      </button>
    </div>
  );
};

// Main Component
export const CustomBuilderManager = () => {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilder, setSelectedBuilder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [activeSection, setActiveSection] = useState('fields');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchBuilders();
  }, []);

  const fetchBuilders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/custom-builders`, { withCredentials: true });
      setBuilders(response.data);
    } catch (error) {
      console.error('Failed to fetch builders:', error);
      toast.error('Failed to load custom builders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedBuilder({
      id: null,
      name: '',
      slug: '',
      description: '',
      fields: [],
      base_options: [],
      base_option_label: 'Select Your Option',
      show_base_options: true,
      accent_color: '#3B82F6',
      enabled: true,
      show_price_calculator: true,
      submit_button_text: 'Add to Cart',
      success_message: 'Your custom product has been added!'
    });
    setIsEditing(true);
  };

  const handleEdit = (builder) => {
    setSelectedBuilder({ ...builder });
    setIsEditing(true);
  };

  const handleDelete = async (builderId) => {
    if (!window.confirm('Are you sure you want to delete this builder?')) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/custom-builders/${builderId}`, { withCredentials: true });
      toast.success('Builder deleted');
      fetchBuilders();
    } catch (error) {
      toast.error('Failed to delete builder');
    }
  };

  const handleSave = async () => {
    if (!selectedBuilder.name || !selectedBuilder.slug) {
      toast.error('Name and slug are required');
      return;
    }

    setSaving(true);
    try {
      if (selectedBuilder.id) {
        await axios.put(
          `${BACKEND_URL}/api/admin/custom-builders/${selectedBuilder.id}`,
          selectedBuilder,
          { withCredentials: true }
        );
        toast.success('Builder updated');
      } else {
        await axios.post(
          `${BACKEND_URL}/api/admin/custom-builders`,
          selectedBuilder,
          { withCredentials: true }
        );
        toast.success('Builder created');
      }
      setIsEditing(false);
      setSelectedBuilder(null);
      fetchBuilders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save builder');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSelectedBuilder(prev => {
        const oldIndex = prev.fields.findIndex(f => f.id === active.id);
        const newIndex = prev.fields.findIndex(f => f.id === over.id);
        const newFields = arrayMove(prev.fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
        return { ...prev, fields: newFields };
      });
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setShowFieldModal(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setShowFieldModal(true);
  };

  const handleSaveField = (field) => {
    setSelectedBuilder(prev => {
      const existingIndex = prev.fields.findIndex(f => f.id === field.id);
      if (existingIndex >= 0) {
        const newFields = [...prev.fields];
        newFields[existingIndex] = field;
        return { ...prev, fields: newFields };
      } else {
        return { ...prev, fields: [...prev.fields, { ...field, order: prev.fields.length }] };
      }
    });
    setShowFieldModal(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId) => {
    setSelectedBuilder(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleDuplicateField = (field) => {
    const newField = { ...field, id: crypto.randomUUID(), label: `${field.label} (Copy)` };
    setSelectedBuilder(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Builder Editor View
  if (isEditing && selectedBuilder) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsEditing(false); setSelectedBuilder(null); }}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {selectedBuilder.id ? 'Edit Builder' : 'Create New Builder'}
              </h1>
              <p className="text-slate-500">Configure your custom product builder</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Builder
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'base', label: 'Base Options', icon: Package },
            { id: 'fields', label: 'Fields', icon: Layers },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Builder Name *</label>
                <input
                  type="text"
                  value={selectedBuilder.name}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                  placeholder="e.g., NFC Stand Builder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={selectedBuilder.slug}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                  placeholder="e.g., nfc-stand-builder"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={selectedBuilder.description || ''}
                onChange={(e) => setSelectedBuilder(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none"
                rows={2}
                placeholder="Brief description of this builder"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Submit Button Text</label>
                <input
                  type="text"
                  value={selectedBuilder.submit_button_text}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, submit_button_text: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedBuilder.accent_color}
                    onChange={(e) => setSelectedBuilder(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedBuilder.accent_color}
                    onChange={(e) => setSelectedBuilder(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBuilder.enabled}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Enabled</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBuilder.show_price_calculator}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, show_price_calculator: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Show Price Calculator</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBuilder.show_base_options}
                  onChange={(e) => setSelectedBuilder(prev => ({ ...prev, show_base_options: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Show Base Options</span>
              </label>
            </div>
          </div>
        )}

        {/* Base Options Section */}
        {activeSection === 'base' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Base Options</h3>
                <p className="text-sm text-slate-500">Product variants with different prices</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Base Option Label</label>
              <input
                type="text"
                value={selectedBuilder.base_option_label}
                onChange={(e) => setSelectedBuilder(prev => ({ ...prev, base_option_label: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="e.g., Select Your Base"
              />
            </div>

            <BaseOptionEditor
              options={selectedBuilder.base_options}
              onChange={(options) => setSelectedBuilder(prev => ({ ...prev, base_options: options }))}
            />
          </div>
        )}

        {/* Fields Section */}
        {activeSection === 'fields' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Builder Fields</h3>
                <p className="text-sm text-slate-500">Drag to reorder, click to edit</p>
              </div>
              <button
                onClick={handleAddField}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" /> Add Field
              </button>
            </div>

            {selectedBuilder.fields.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
                <SortableContext items={selectedBuilder.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {selectedBuilder.fields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onEdit={handleEditField}
                        onDelete={handleDeleteField}
                        onDuplicate={handleDuplicateField}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No fields added yet</p>
                <button
                  onClick={handleAddField}
                  className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                >
                  Add your first field
                </button>
              </div>
            )}
          </div>
        )}

        {/* Field Editor Modal */}
        <AnimatePresence>
          {showFieldModal && (
            <FieldEditorModal
              field={editingField}
              onSave={handleSaveField}
              onClose={() => { setShowFieldModal(false); setEditingField(null); }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Builder List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Custom Builders</h1>
          <p className="text-slate-500">Create and manage product customization builders</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Create Builder
        </button>
      </div>

      {/* Builder Grid */}
      {builders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {builders.map((builder) => (
            <motion.div
              key={builder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${builder.accent_color}20` }}
                >
                  <Wand2 className="h-5 w-5" style={{ color: builder.accent_color }} />
                </div>
                <div className="flex items-center gap-1">
                  {builder.enabled ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Disabled
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-slate-800 mb-1">{builder.name}</h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{builder.description || 'No description'}</p>

              <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  {builder.fields?.length || 0} fields
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {builder.base_options?.length || 0} options
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(builder)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(builder.id)}
                  className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Wand2 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Custom Builders Yet</h3>
          <p className="text-slate-500 mb-6">Create your first custom product builder to get started</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" /> Create Your First Builder
          </button>
        </div>
      )}
    </div>
  );
};
