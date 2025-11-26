import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Phone,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Building2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Day names for schedule
const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

// Generate time slots from start to end hour
const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({
      start_time: `${hour.toString().padStart(2, '0')}:00`,
      end_time: `${(hour + 1).toString().padStart(2, '0')}:00`
    });
  }
  return slots;
};

// Default schedule generator
const generateDefaultSchedule = () => {
  return DAYS.map(day => ({
    day: day.key,
    enabled: day.key !== 'sunday',
    time_slots: day.key !== 'sunday' ? generateTimeSlots(10, 21) : []
  }));
};

// Format time for display (24hr to 12hr)
const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${minutes} ${suffix}`;
};

// Schedule Editor Component
const ScheduleEditor = ({ schedule, onChange }) => {
  const [expandedDay, setExpandedDay] = useState(null);

  const handleDayToggle = (dayKey) => {
    const newSchedule = schedule.map(day => 
      day.day === dayKey ? { ...day, enabled: !day.enabled } : day
    );
    onChange(newSchedule);
  };

  const handleQuickSetup = (dayKey, startHour, endHour) => {
    const newSchedule = schedule.map(day => {
      if (day.day === dayKey) {
        return {
          ...day,
          enabled: true,
          time_slots: generateTimeSlots(startHour, endHour)
        };
      }
      return day;
    });
    onChange(newSchedule);
  };

  const handleAddTimeSlot = (dayKey) => {
    const newSchedule = schedule.map(day => {
      if (day.day === dayKey) {
        const lastSlot = day.time_slots[day.time_slots.length - 1];
        const lastEndHour = lastSlot ? parseInt(lastSlot.end_time.split(':')[0]) : 9;
        const newStartHour = lastEndHour;
        const newEndHour = Math.min(newStartHour + 1, 23);
        
        if (newStartHour >= 23) return day;
        
        return {
          ...day,
          time_slots: [...day.time_slots, {
            start_time: `${newStartHour.toString().padStart(2, '0')}:00`,
            end_time: `${newEndHour.toString().padStart(2, '0')}:00`
          }]
        };
      }
      return day;
    });
    onChange(newSchedule);
  };

  const handleRemoveTimeSlot = (dayKey, slotIndex) => {
    const newSchedule = schedule.map(day => {
      if (day.day === dayKey) {
        return {
          ...day,
          time_slots: day.time_slots.filter((_, i) => i !== slotIndex)
        };
      }
      return day;
    });
    onChange(newSchedule);
  };

  const handleTimeSlotChange = (dayKey, slotIndex, field, value) => {
    const newSchedule = schedule.map(day => {
      if (day.day === dayKey) {
        const newSlots = [...day.time_slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...day, time_slots: newSlots };
      }
      return day;
    });
    onChange(newSchedule);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 mb-2">Pickup Schedule</label>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {DAYS.map((dayInfo) => {
          const daySchedule = schedule.find(s => s.day === dayInfo.key) || { day: dayInfo.key, enabled: false, time_slots: [] };
          const isExpanded = expandedDay === dayInfo.key;

          return (
            <div key={dayInfo.key} className="border-b border-slate-100 last:border-b-0">
              {/* Day Header */}
              <div 
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  daySchedule.enabled ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
                onClick={() => setExpandedDay(isExpanded ? null : dayInfo.key)}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayToggle(dayInfo.key);
                    }}
                    className="p-1"
                  >
                    {daySchedule.enabled ? (
                      <ToggleRight className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-300" />
                    )}
                  </button>
                  <span className={`font-medium ${daySchedule.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {daySchedule.enabled && daySchedule.time_slots.length > 0 && (
                    <span className="text-sm text-slate-500">
                      {daySchedule.time_slots.length} slot{daySchedule.time_slots.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Day Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                      {/* Quick Setup Buttons */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => handleQuickSetup(dayInfo.key, 9, 17)}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          9AM-5PM
                        </button>
                        <button
                          onClick={() => handleQuickSetup(dayInfo.key, 10, 21)}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          10AM-9PM
                        </button>
                        <button
                          onClick={() => handleQuickSetup(dayInfo.key, 8, 20)}
                          className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          8AM-8PM
                        </button>
                      </div>

                      {/* Time Slots */}
                      {daySchedule.enabled && (
                        <div className="space-y-2">
                          {daySchedule.time_slots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <select
                                value={slot.start_time}
                                onChange={(e) => handleTimeSlotChange(dayInfo.key, index, 'start_time', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Array.from({ length: 24 }, (_, h) => (
                                  <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                                    {formatTime(`${h.toString().padStart(2, '0')}:00`)}
                                  </option>
                                ))}
                              </select>
                              <span className="text-slate-400">to</span>
                              <select
                                value={slot.end_time}
                                onChange={(e) => handleTimeSlotChange(dayInfo.key, index, 'end_time', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Array.from({ length: 24 }, (_, h) => (
                                  <option key={h + 1} value={`${(h + 1).toString().padStart(2, '0')}:00`}>
                                    {formatTime(`${(h + 1).toString().padStart(2, '0')}:00`)}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemoveTimeSlot(dayInfo.key, index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddTimeSlot(dayInfo.key)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Add Time Slot
                          </button>
                        </div>
                      )}

                      {!daySchedule.enabled && (
                        <p className="text-sm text-slate-400 italic">
                          Enable this day to add pickup time slots
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Location Form Modal
const LocationForm = ({ location, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zip_code: location?.zip_code || '',
    phone: location?.phone || '',
    hours_display: location?.hours_display || '',
    notes: location?.notes || '',
    enabled: location?.enabled ?? true,
    schedule: location?.schedule || generateDefaultSchedule()
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {location ? 'Edit Pickup Location' : 'Add Pickup Location'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Print Queen HQ"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="1360 S Figueroa St"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Los Angeles"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="90015"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(213) 555-0123"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hours Display */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hours Display Text
            </label>
            <input
              type="text"
              value={formData.hours_display}
              onChange={(e) => setFormData({ ...formData, hours_display: e.target.value })}
              placeholder="Mon-Sat 10am-9pm"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is shown to customers as a quick reference
            </p>
          </div>

          {/* Schedule Editor */}
          <ScheduleEditor
            schedule={formData.schedule}
            onChange={(schedule) => setFormData({ ...formData, schedule })}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pickup Notes / Instructions
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Parking available in the rear. Enter through the main lobby."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800">Location Active</p>
              <p className="text-sm text-slate-500">Customers can select this location for pickup</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className="p-1"
            >
              {formData.enabled ? (
                <ToggleRight className="h-8 w-8 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-300" />
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {location ? 'Update Location' : 'Add Location'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Location Card Component
const LocationCard = ({ location, onEdit, onDelete, onToggle }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this pickup location?')) return;
    setDeleting(true);
    await onDelete(location.id);
    setDeleting(false);
  };

  // Count active days
  const activeDays = (location.schedule || []).filter(s => s.enabled).length;
  const totalSlots = (location.schedule || []).reduce((sum, day) => 
    sum + (day.enabled ? day.time_slots?.length || 0 : 0), 0
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
        location.enabled ? 'border-slate-200' : 'border-slate-200 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${location.enabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <MapPin className={`h-5 w-5 ${location.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{location.name}</h3>
              <p className="text-sm text-slate-500">
                {location.address}, {location.city}, {location.state} {location.zip_code}
              </p>
            </div>
          </div>
          <button
            onClick={() => onToggle(location.id)}
            className="p-1"
            title={location.enabled ? 'Disable location' : 'Enable location'}
          >
            {location.enabled ? (
              <ToggleRight className="h-7 w-7 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-7 w-7 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {location.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{location.phone}</span>
          </div>
        )}
        
        {location.hours_display && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>{location.hours_display}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            <CheckCircle className="h-3.5 w-3.5" />
            {activeDays} active days
          </span>
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <Clock className="h-3.5 w-3.5" />
            {totalSlots} time slots
          </span>
        </div>

        {location.notes && (
          <p className="text-sm text-slate-500 italic bg-slate-50 p-2 rounded-lg">
            {location.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => onEdit(location)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <div className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Main Component
export const PickupLocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pickup-locations`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      showToast('Failed to load pickup locations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Create location
  const handleCreate = async (formData) => {
    const response = await fetch(`${API_URL}/api/admin/pickup-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create location');
    }
    
    await fetchLocations();
    showToast('Pickup location created successfully');
  };

  // Update location
  const handleUpdate = async (formData) => {
    const response = await fetch(`${API_URL}/api/admin/pickup-locations/${editingLocation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update location');
    }
    
    await fetchLocations();
    showToast('Pickup location updated successfully');
  };

  // Delete location
  const handleDelete = async (locationId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pickup-locations/${locationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete location');
      
      await fetchLocations();
      showToast('Pickup location deleted');
    } catch (error) {
      showToast('Failed to delete location', 'error');
    }
  };

  // Toggle location
  const handleToggle = async (locationId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pickup-locations/${locationId}/toggle`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to toggle location');
      
      const result = await response.json();
      await fetchLocations();
      showToast(result.message);
    } catch (error) {
      showToast('Failed to toggle location', 'error');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLocation(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pickup Locations</h1>
          <p className="text-slate-500 mt-1">
            Manage locations where customers can pick up their orders
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Location
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No Pickup Locations</h3>
          <p className="text-slate-500 mb-4">
            Add your first pickup location to allow customers to pick up orders
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add First Location
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <LocationForm
            location={editingLocation}
            onSave={editingLocation ? handleUpdate : handleCreate}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg z-50 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PickupLocationManager;
