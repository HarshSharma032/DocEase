import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-white pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block xl:inline">Find the right doctor, </span>
                <span className="block text-primary xl:inline">book an appointment.</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Discover top specialists, read patient reviews, and book appointments instantly with zero hassle. Health care made simple.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 max-w-xl mx-auto sm:flex justify-center"
            >
              <form onSubmit={handleSearch} className="w-full relative flex items-center bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
                <div className="flex-grow flex items-center pl-4">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full py-3 pl-3 pr-4 text-slate-900 placeholder-slate-400 bg-transparent outline-none focus:ring-0 sm:text-sm"
                    placeholder="Search doctors, specialties, clinics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Find Doctors near you', desc: 'Locate the best healthcare professionals in your area instantly.' },
              { icon: Star, title: 'Read Verified Reviews', desc: 'Make informed decisions by reading reviews from real patients.' },
              { icon: CalendarIcon, title: 'Book Instantly', desc: 'No more waiting on calls. Pick a time and book instantly.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center"
              >
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Are you a medical professional?
          </h2>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            Join thousands of doctors who use DocBook to manage their appointments, reach new patients, and grow their practice.
          </p>
          <div className="mt-8">
            <Link to="/doctor-signup" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-primary bg-white hover:bg-slate-50 transition-colors shadow-sm">
              List your practice <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
