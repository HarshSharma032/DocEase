import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Star, MapPin, Clock, IndianRupee, Loader2, Award, Calendar, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookingForm = ({ doctor, onBookingSuccess }) => {
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dynamic slots based on selected date
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (selectedDate && doctor.availableDays) {
      const dateObj = new Date(selectedDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = days[dateObj.getDay()];
      const dayData = doctor.availableDays.find(d => d.day === dayName);
      setAvailableSlots(dayData ? dayData.slots.map(s => s.startTime) : []);
      setSelectedTimeSlot(''); // Reset slot when date changes
    }
  }, [selectedDate, doctor.availableDays]);

  const handlePayment = async (appointmentId) => {
    const res = await loadRazorpayScript();
    if (!res) {
      setError('Razorpay SDK failed to load. Are you online?');
      return;
    }

    try {
      const { data: orderData } = await axios.post(`${API_URL}/api/appointments/${appointmentId}/razorpay-order`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!orderData || !orderData.id) {
        throw new Error('Could not generate payment order. Please use "Simulate Payment" instead.');
      }

      const options = {
        key: APP_CONFIG.RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DocBook SaaS',
        description: `Booking with Dr. ${doctor.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/822/822159.png',
        order_id: orderData.id,
        handler: async (response) => {
          setPaymentLoading(true);
          try {
            const { data } = await axios.post(`${API_URL}/api/appointments/verify-payment`, {
              ...response,
              appointmentId
            }, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            
            if (data.success) {
               // Fetch full appointment details for the success page
               const { data: fullAppointment } = await axios.get(`${API_URL}/api/appointments/my`, {
                 headers: { Authorization: `Bearer ${user.token}` }
               });
               const latest = fullAppointment.find(a => a._id === appointmentId);
               onBookingSuccess(latest || { _id: appointmentId, amount: doctor.feesPerCunsultation, date: selectedDate, timeSlot: selectedTimeSlot, doctorId: doctor });
            } else {
               navigate('/payment-failed', { state: { error: data.message, appointmentId: doctor._id } });
            }
          } catch (err) {
            const errMsg = err.response?.data?.message || 'Payment verification failed.';
            navigate('/payment-failed', { state: { error: errMsg, appointmentId: doctor._id } });
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
             setPaymentLoading(false);
             // Optionally show a failure page or just let them stay on the profile
             // Let's stay on profile but show error if they closed it after some progress
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#0ea5e9' },
      };

      if (window.Razorpay) {
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } else {
        throw new Error('Razorpay SDK not loaded correctly.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to book an appointment');
      return;
    }
    setBookingLoading(true);
    setError('');

    try {
      const { data: appointment } = await axios.post(`${API_URL}/api/appointments`, {
        doctorId: doctor._id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        reason
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      console.log(`[Booking] Appointment ${appointment._id} created, initiating payment...`);
      await handlePayment(appointment._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
        <input
          type="date"
          required
          min={new Date().toISOString().split('T')[0]}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary text-sm outline-none bg-slate-50 focus:bg-white transition-all"
        />
      </div>

      <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {availableSlots.length > 0 ? availableSlots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTimeSlot(slot)}
                className={`px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  selectedTimeSlot === slot 
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {slot}
              </button>
            )) : <p className="col-span-full text-xs text-slate-400 italic py-2">No slots available for this day.</p>}
          </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary text-sm outline-none bg-slate-50 focus:bg-white transition-all resize-none"
          placeholder="Symptoms..."
          rows="1"
        />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4 text-slate-700 font-medium text-sm">
          <span>Consultation Fee</span>
          <span className="text-lg text-slate-900 font-bold flex items-center">
            <IndianRupee className="w-4 h-4 mr-0.5" />
            {doctor.feesPerCunsultation}
          </span>
        </div>
        
        <div className="space-y-3">
          <button
            type="submit"
            disabled={bookingLoading || paymentLoading || !selectedDate || !selectedTimeSlot}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
          >
            {bookingLoading || paymentLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay & Book
              </>
            )}
          </button>
        </div>
        
        <p className="text-[10px] text-center text-slate-400 mt-4 font-medium uppercase tracking-wider italic">Secure payment powered by Razorpay</p>
      </div>
    </form>
  );
};

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    fetchDoctorData();
  }, [id]);

  const fetchDoctorData = async () => {
    try {
      const [docRes, reviewRes] = await Promise.all([
        axios.get(`${API_URL}/api/doctors/${id}`),
        axios.get(`${API_URL}/api/doctors/${id}/reviews`)
      ]);
      setDoctor(docRes.data);
      setReviews(reviewRes.data);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Login to submit review');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/doctors/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewText
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchDoctorData();
      setReviewText('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleBookingSuccess = (appointmentData) => {
    setSuccess(true);
    setTimeout(() => navigate('/payment-success', { state: { appointment: appointmentData } }), 1500);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );
  if (!doctor) return <div className="text-center py-20 font-bold text-slate-500">Doctor not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-primary h-48 rounded-t-3xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={doctor.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg text-primary">
                    {doctor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{doctor.name}</h1>
                  <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    {doctor.specialization}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Experience</span>
                  <span className="text-lg font-bold text-slate-900">{doctor.experience}+ Yr</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Rating</span>
                  <div className="flex items-center justify-center font-bold text-slate-900 text-lg">
                    <Star className="w-4 h-4 text-amber-400 mr-1 fill-current" />
                    {doctor.ratings?.toFixed(1) || '0.0'}
                  </div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Patients</span>
                  <span className="text-lg font-bold text-slate-900">500+</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Fees</span>
                  <span className="text-lg font-bold text-slate-900 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />{doctor.feesPerCunsultation}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Doctor Info Sections */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">About Doctor</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{doctor.about || 'Dr. ' + doctor.name + ' is a highly skilled specialist committed to providing exceptional care.'}</p>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Qualification</h3>
                <p className="text-slate-600 text-sm">{doctor.education || 'MBBS, MD ' + doctor.specialization}</p>
              </div>
            </motion.div>

            {/* Reviews Section */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 font-display">Patient Reviews</h3>
              {user && user.role === 'Patient' && (
                <form onSubmit={submitReview} className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-bold mb-3 text-slate-800">Share your experience</h4>
                  <div className="flex items-center gap-2 mb-4">
                    {[1,2,3,4,5].map(v => (
                       <Star 
                         key={v} 
                         className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${v <= reviewRating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} 
                         onClick={() => setReviewRating(v)}
                       />
                    ))}
                  </div>
                  <textarea 
                    className="w-full p-4 rounded-xl border border-slate-200 resize-none text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all bg-white" 
                    placeholder="Was the doctor helpful?..." 
                    rows="3" 
                    value={reviewText} 
                    onChange={e => setReviewText(e.target.value)}
                    required
                  ></textarea>
                  <button type="submit" className="mt-4 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md shadow-primary/20">Post Review</button>
                </form>
              )}
              <div className="space-y-4">
                 {reviews.length === 0 ? <p className="text-slate-400 text-sm italic">No reviews yet. Be the first to review!</p> : reviews.map(rev => (
                    <div key={rev._id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                       <div className="flex items-center justify-between mb-1">
                         <span className="font-bold text-slate-900 text-sm">{rev.patientId?.name || 'Anonymous Patient'}</span>
                         <span className="flex text-amber-400 text-[10px]">
                           {[...Array(rev.rating)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-current"/>)}
                         </span>
                       </div>
                       <p className="text-slate-500 text-xs leading-relaxed">{rev.comment}</p>
                    </div>
                 ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center font-display">
              <Calendar className="w-6 h-6 mr-2 text-primary"/> Book Appointment
            </h3>

            {success ? (
               <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center font-bold border border-green-200 shadow-sm animate-bounce">
                 <div className="mb-2 text-2xl">🎉</div>
                 Payment Successful!<br/> Appointment Confirmed.
               </div>
            ) : user ? (
              <BookingForm doctor={doctor} onBookingSuccess={handleBookingSuccess} />
            ) : (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Award className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="text-slate-600 mb-6 text-sm font-medium">Please sign in as a Patient to book your consultation.</p>
                  <button onClick={() => navigate('/login')} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Sign in to Book</button>
                </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
