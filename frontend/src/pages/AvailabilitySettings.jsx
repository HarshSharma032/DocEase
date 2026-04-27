import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Clock, Plus, Trash2, Save, 
  ChevronRight, AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilitySettings = () => {
  const { user } = useAuth();
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors/profile/me`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAvailableDays(data.availableDays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = (day) => {
    if (availableDays.find(d => d.day === day)) return;
    setAvailableDays([...availableDays, { day, slots: [{ startTime: '09:00', endTime: '10:00' }] }]);
  };

  const handleRemoveDay = (day) => {
    setAvailableDays(availableDays.filter(d => d.day !== day));
  };

  const handleAddSlot = (dayIndex) => {
    const newDays = [...availableDays];
    newDays[dayIndex].slots.push({ startTime: '10:00', endTime: '11:00' });
    setAvailableDays(newDays);
  };

  const handleRemoveSlot = (dayIndex, slotIndex) => {
    const newDays = [...availableDays];
    newDays[dayIndex].slots.splice(slotIndex, 1);
    if (newDays[dayIndex].slots.length === 0) {
      newDays.splice(dayIndex, 1);
    }
    setAvailableDays(newDays);
  };

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    const newDays = [...availableDays];
    newDays[dayIndex].slots[slotIndex][field] = value;
    setAvailableDays(newDays);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(`${API_URL}/api/doctors/availability`, { availableDays }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage({ type: 'success', text: 'Availability updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update availability.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Availability</h1>
            <p className="text-slate-500 mt-1">Set your weekly schedule and consultation hours</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Day Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Active Days
              </h2>
              <div className="space-y-2">
                {DAYS.map(day => {
                  const isActive = availableDays.some(d => d.day === day);
                  return (
                    <button
                      key={day}
                      onClick={() => isActive ? handleRemoveDay(day) : handleAddDay(day)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                        ? 'bg-primary/5 text-primary border border-primary/20' 
                        : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {day}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slots Manager */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {availableDays.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center"
                >
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">Select days from the left to start setting slots.</p>
                </motion.div>
              ) : (
                availableDays.map((dayData, dIndex) => (
                  <motion.div
                    key={dayData.day}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                  >
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">{dayData.day}</h3>
                      <button 
                        onClick={() => handleAddSlot(dIndex)}
                        className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Plus className="w-4 h-4" /> Add Slot
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {dayData.slots.map((slot, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-4 group">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-slate-400" />
                              </div>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'startTime', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Clock className="w-4 h-4 text-slate-400" />
                              </div>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'endTime', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSlot(dIndex, sIndex)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
