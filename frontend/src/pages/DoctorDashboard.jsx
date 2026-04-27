import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, Check, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Doctor') {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [user, navigate]);

  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/appointments/doctor`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchAppointments();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your patient appointments and schedule</p>
          </div>
          <button 
            onClick={() => navigate('/availability-settings')}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all hover:border-primary/30"
          >
            <Clock className="w-5 h-5 text-primary" />
            Manage Availability
          </button>
        </div>
        
        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500">No appointments scheduled yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{apt.patientId?.name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-2">
                      <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5" /> {apt.date}</span>
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {apt.timeSlot}</span>
                    </div>
                    {apt.reason && (
                      <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                        "{apt.reason}"
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    apt.status === 'Accepted' ? 'text-green-600 bg-green-50 border-green-200' :
                    apt.status === 'Pending' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                    apt.status === 'Completed' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                    'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {apt.status}
                  </span>
                  
                  {apt.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(apt._id, 'Accepted')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Accept"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(apt._id, 'Rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {apt.status === 'Accepted' && (
                     <button 
                       onClick={() => handleUpdateStatus(apt._id, 'Completed')}
                       className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                     >
                       Mark Completed
                     </button>
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

export default DoctorDashboard;
