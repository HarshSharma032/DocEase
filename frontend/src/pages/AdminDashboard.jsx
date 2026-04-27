import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Calendar, DollarSign,
  Clock, CheckCircle, XCircle, Loader2, Trash2,
  BarChart2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TableRowSkeleton } from '../components/Skeletons';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
    </div>
  </motion.div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-100'}`}
  >
    {children}
  </button>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/');
      return;
    }
    fetchAll();
  }, [user]);

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, doctorsRes, usersRes, apptRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics`, authHeader),
        axios.get(`${API_URL}/api/admin/doctors`, authHeader),
        axios.get(`${API_URL}/api/admin/users`, authHeader),
        axios.get(`${API_URL}/api/admin/appointments`, authHeader),
      ]);
      setAnalytics(analyticsRes.data);
      setDoctors(doctorsRes.data);
      setUsers(usersRes.data);
      setAppointments(apptRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUpdateDoctorStatus = async (doctorId, status) => {
    setActionLoading(doctorId);
    try {
      await axios.patch(`${API_URL}/api/admin/approve-doctor/${doctorId}`, { status }, authHeader);
      setDoctors(prev => prev.map(d => d._id === doctorId ? { ...d, status } : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(userId);
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, authHeader);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert('Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = {
    Pending: 'bg-amber-100 text-amber-700',
    Accepted: 'bg-green-100 text-green-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-red-100 text-red-700',
    Rejected: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Full platform management</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {['overview', 'doctors', 'users', 'appointments'].map(tab => (
              <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabButton>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Patients" value={analytics?.totalUsers} color="bg-blue-100 text-blue-600" delay={0} />
              <StatCard icon={UserCheck} label="Active Doctors" value={analytics?.totalDoctors} color="bg-green-100 text-green-600" delay={0.05} />
              <StatCard icon={Calendar} label="Appointments" value={analytics?.totalAppointments} color="bg-purple-100 text-purple-600" delay={0.1} />
              <StatCard icon={DollarSign} label="Total Revenue" value={analytics ? `₹${analytics.totalRevenue.toLocaleString()}` : null} color="bg-amber-100 text-amber-600" delay={0.15} />
            </div>

            {analytics?.pendingDoctors > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">{analytics.pendingDoctors} doctor{analytics.pendingDoctors > 1 ? 's' : ''} waiting for approval</p>
                  <p className="text-sm text-amber-700">Review and approve or reject new doctor registrations.</p>
                </div>
                <button onClick={() => setActiveTab('doctors')} className="ml-auto bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700">
                  Review Now
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-primary" /> Appointment Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {analytics?.statusBreakdown?.map(({ _id, count }) => (
                  <div key={_id} className={`rounded-xl p-3 text-center ${statusColor[_id] || 'bg-slate-100 text-slate-600'}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs font-medium mt-1">{_id}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">All Doctors ({doctors.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Specialization', 'Experience', 'Fees', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />) :
                    doctors.map(doc => (
                      <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{doc.name}</td>
                        <td className="px-6 py-4 text-slate-600">{doc.specialization}</td>
                        <td className="px-6 py-4 text-slate-600">{doc.experience} yrs</td>
                        <td className="px-6 py-4 text-slate-600">₹{doc.feesPerCunsultation}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {doc.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateDoctorStatus(doc._id, 'approved')}
                                  disabled={actionLoading === doc._id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                                >
                                  {actionLoading === doc._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateDoctorStatus(doc._id, 'rejected')}
                                  disabled={actionLoading === doc._id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {doc.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateDoctorStatus(doc._id, 'rejected')}
                                disabled={actionLoading === doc._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" /> Revoke
                              </button>
                            )}
                            {doc.status === 'rejected' && (
                              <button
                                onClick={() => handleUpdateDoctorStatus(doc._id, 'approved')}
                                disabled={actionLoading === doc._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" /> Restore
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(doc._id)}
                              disabled={actionLoading === doc._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">All Patients ({users.filter(u => u.role === 'Patient').length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Email', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={4} />) :
                    users.filter(u => u.role === 'Patient').map(u => (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 text-slate-600">{u.email}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={actionLoading === u._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                          >
                            {actionLoading === u._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">All Appointments ({appointments.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Patient', 'Doctor', 'Date', 'Time Slot', 'Status', 'Payment', 'Amount'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={7} />) :
                    appointments.map(apt => (
                      <tr key={apt._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{apt.patientId?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{apt.doctorId?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(apt.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-600">{apt.timeSlot}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[apt.status] || 'bg-slate-100 text-slate-600'}`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${apt.paymentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {apt.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">₹{apt.amount}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
