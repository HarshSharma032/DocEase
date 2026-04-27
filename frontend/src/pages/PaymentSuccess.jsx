import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment } = location.state || {};

  useEffect(() => {
    if (!appointment) {
      const timer = setTimeout(() => {
        navigate('/patient-dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [appointment, navigate]);

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 mb-6">Redirecting you to your dashboard...</p>
          <button 
            onClick={() => navigate('/patient-dashboard')}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100"
        >
          <div className="bg-green-500 p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_30%,#fff_0%,transparent_50%)]"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-green-50 font-medium tracking-wide">Your payment was processed successfully</p>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Appointment with</p>
                  <h2 className="text-xl font-bold text-slate-900">Dr. {appointment.doctorId?.name || 'Your Doctor'}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fee Paid</p>
                  <p className="text-xl font-bold text-primary flex items-center justify-end">
                    <IndianRupee className="w-4 h-4 mr-0.5" />
                    {appointment.amount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                    <p className="text-sm font-bold text-slate-700">{appointment.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Slot</p>
                    <p className="text-sm font-bold text-slate-700">{appointment.timeSlot}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Clinic Address</p>
                  <p className="text-sm text-slate-600 font-medium">
                    {appointment.doctorId?.clinicAddress || 'Address details available in your dashboard.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/patient-dashboard')}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                View My Appointments
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/')}
                className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all border border-slate-200"
              >
                Back to Home
              </button>
            </div>

            <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              A confirmation email has been sent to your registered address.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
