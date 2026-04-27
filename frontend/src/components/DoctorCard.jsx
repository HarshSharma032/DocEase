import { Star, MapPin, Clock, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
          {doctor.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
          <p className="text-primary font-medium text-sm">{doctor.specialization}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-6 flex-grow">
        <div className="flex items-center text-sm text-slate-600">
          <Star className="w-4 h-4 text-amber-400 mr-2 fill-current" />
          <span className="font-medium text-slate-700 mr-1">{doctor.ratings?.toFixed(1) || '0.0'}</span>
          <span>({doctor.numOfReviews} reviews)</span>
        </div>
        <div className="flex items-center text-sm text-slate-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{doctor.experience} Years Experience</span>
        </div>
        <div className="flex items-center text-sm text-slate-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{doctor.clinicAddress || 'Location not provided'}</span>
        </div>
        <div className="flex items-center text-sm text-slate-600">
          <IndianRupee className="w-4 h-4 mr-2" />
          <span>₹{doctor.feesPerCunsultation} Consultation Fee</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex gap-3 mt-auto">
        <Link 
          to={`/book/${doctor._id}`}
          className="flex-1 bg-primary text-white text-center py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Book Visit
        </Link>
        <Link 
          to={`/doctor/${doctor._id}`}
          className="flex-1 bg-slate-50 text-slate-700 text-center py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          Profile
        </Link>
      </div>
    </motion.div>
  );
};

export default DoctorCard;
