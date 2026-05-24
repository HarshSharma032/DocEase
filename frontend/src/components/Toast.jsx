import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  const Icon = icons[type] || Info;
  const themeClass = colors[type] || colors.info;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${themeClass}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setToasts(prev => [...prev, { id, message: e.detail.message, type: e.detail.type || 'info' }]);
    };
    window.addEventListener('app_notification', handler);
    return () => window.removeEventListener('app_notification', handler);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
