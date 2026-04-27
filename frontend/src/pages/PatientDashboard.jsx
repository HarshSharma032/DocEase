import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, User, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;

const RescheduleModal = ({ appointment, onClose, onRefresh }) => {
  const [date, setDate] = useState(appointment.date);
  const [slot, setSlot] = useState(appointment.timeSlot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleReschedule = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.put(`${API_URL}/api/appointments/${appointment._id}/reschedule`, { date, timeSlot: slot }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      window.dispatchEvent(new CustomEvent('app_notification', { detail: { message: 'Appointment rescheduled successfully!', type: 'success' } }));
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Rescheduling failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Reschedule Appointment</h3>
        
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Slot</label>
            <input 
              type="text" 
              value={slot} 
              onChange={e => setSlot(e.target.value)}
              placeholder="e.g. 10:00 AM"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">*Consult your doctor for preferred slots</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
          <button 
            onClick={handleReschedule} 
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Change'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleData, setRescheduleData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [user, navigate]);

  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/appointments/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await axios.put(`${API_URL}/api/appointments/${id}/status`, { status: 'Cancelled' }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      window.dispatchEvent(new CustomEvent('app_notification', { detail: { message: 'Appointment cancelled.', type: 'info' } }));
      fetchAppointments();
    } catch (error) {
       window.dispatchEvent(new CustomEvent('app_notification', { detail: { message: 'Failed to cancel.', type: 'error' } }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-50 border-green-200';
      case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Rejected':
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'Completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 font-display">My Appointments</h1>
          <button 
            onClick={() => navigate('/doctors')}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20 text-sm"
          >
            Find Doctor
          </button>
        </div>
        
        {loading ? (
          <p className="text-slate-500">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 mb-4 font-medium">You have no appointments yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Dr. {apt.doctorId?.name}</h3>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{apt.doctorId?.specialization}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-primary" /> 
                        {(() => {
                          const d = new Date(apt.date);
                          if (isNaN(d.getTime()) || d.getFullYear() > 2050) return apt.date; // Fallback to raw if weird
                          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                        })()}
                      </span>
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-primary" /> {apt.timeSlot}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-4 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                  {(apt.status === 'Pending' || apt.status === 'Accepted') && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setRescheduleData(apt)}
                        className="text-primary hover:underline text-sm font-semibold"
                      >
                         Reschedule
                      </button>
                      <button 
                        onClick={() => handleCancel(apt._id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center"
                      >
                         Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rescheduleData && (
          <RescheduleModal 
            appointment={rescheduleData} 
            onClose={() => setRescheduleData(null)} 
            onRefresh={fetchAppointments} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientDashboard;
