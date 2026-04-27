import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, appointmentId } = location.state || {};

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100"
        >
          <div className="bg-red-500 p-8 text-center text-white relative">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
            >
              <XCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-1">Payment Failed</h1>
            <p className="text-red-50 text-sm font-medium opacity-90">We couldn't process your transaction</p>
          </div>

          <div className="p-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Reason for failure</p>
              <p className="text-sm border-t border-slate-200/50 pt-2 text-slate-600 font-medium text-center italic">
                {error || "The transaction was declined by your bank or cancelled."}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigate(appointmentId ? `/doctor/${appointmentId}` : '/doctors')}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Try Again
              </button>
              
              <button 
                onClick={() => navigate('/patient-dashboard')}
                className="w-full py-4 bg-white text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Dashboard
              </button>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-center gap-2 text-slate-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Need help? Contact support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFailed;
