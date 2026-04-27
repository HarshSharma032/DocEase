import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, Stethoscope, User } from 'lucide-react';
import { motion } from 'framer-motion';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const doctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  specialization: z.string().min(2, 'Specialization is required'),
  experience: z.coerce.number().int().positive('Experience must be positive'),
  feesPerCunsultation: z.coerce.number().positive('Fees must be positive'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;
const SPECIALIZATIONS = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Orthopedic', 'General Physician', 'Psychiatrist', 'ENT Specialist'];

const Signup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('Patient');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const schema = role === 'Patient' ? patientSchema : doctorSchema;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const switchRole = (newRole) => {
    setRole(newRole);
    reset();
    setServerError('');
  };

  const onSubmit = async (data) => {
    setServerError('');
    const endpoint = role === 'Patient' ? '/api/auth/register-user' : '/api/auth/register-doctor';
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data, { withCredentials: true });
      login(response.data);
      navigate(role === 'Doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const inputCls = (err) => `w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white'}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1">Join DocBook today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          {/* Role Switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            {['Patient', 'Doctor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r === 'Patient' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                {r}
              </button>
            ))}
          </div>

          {serverError && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{serverError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input id="signup-name" type="text" {...register('name')} className={inputCls(errors.name)} placeholder="John Doe" />
              {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input id="signup-email" type="email" {...register('email')} className={inputCls(errors.email)} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email.message}</p>}
            </div>

            {role === 'Doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                  <select id="signup-specialization" {...register('specialization')} className={inputCls(errors.specialization)}>
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.specialization && <p className="mt-1 text-xs font-medium text-red-600">{errors.specialization.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience (Years)</label>
                    <input id="signup-experience" type="number" {...register('experience')} className={inputCls(errors.experience)} placeholder="5" />
                    {errors.experience && <p className="mt-1 text-xs font-medium text-red-600">{errors.experience.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fees (₹)</label>
                    <input id="signup-fees" type="number" {...register('feesPerCunsultation')} className={inputCls(errors.feesPerCunsultation)} placeholder="500" />
                    {errors.feesPerCunsultation && <p className="mt-1 text-xs font-medium text-red-600">{errors.feesPerCunsultation.message}</p>}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="signup-password" type={showPassword ? 'text' : 'password'} {...register('password')} className={`${inputCls(errors.password)} pr-12`} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input id="signup-confirm-password" type="password" {...register('confirmPassword')} className={inputCls(errors.confirmPassword)} placeholder="Repeat password" />
              {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {role === 'Doctor' && (
              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                ⏳ Doctor accounts require Admin approval before you can accept appointments.
              </p>
            )}

            <button
              id="signup-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : `Create ${role} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
