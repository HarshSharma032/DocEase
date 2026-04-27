import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DoctorCard from '../components/DoctorCard';
import { Search, Filter } from 'lucide-react';
import { DoctorCardSkeleton } from '../components/Skeletons';

import APP_CONFIG from '../config';
const API_URL = APP_CONFIG.API_URL;

const DoctorListing = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [specialty, setSpecialty] = useState('All');

  const specialtiesList = ['All', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Orthopedic'];

  useEffect(() => {
    fetchDoctors();
  }, [page, specialty]); // Re-fetch on page or filter change

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors?keyword=${searchQuery}&page=${page}&limit=8&specialty=${specialty}`);
      setDoctors(data.doctors);
      setTotalPages(data.pages);
      // Ensure we don't end up on a non-existent page after filtering
      if (page > data.pages && data.pages > 0) {
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 for new searches
    fetchDoctors();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Find Doctors</h1>
            <p className="text-slate-500 mt-1">Book appointments with top specialists</p>
          </div>
          
          <div className="w-full flex md:flex-row flex-col gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white shadow-sm"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select 
                className="w-full md:w-56 pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary bg-white text-sm shadow-sm appearance-none outline-none cursor-pointer text-slate-700"
                value={specialty}
                onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
              >
                {specialtiesList.map(spec => (
                   <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <DoctorCardSkeleton key={i} />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">No doctors found matching your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
               <div className="flex justify-center items-center gap-4">
                 <button 
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                 >
                    Previous
                 </button>
                 <span className="text-slate-600 font-medium">Page {page} of {totalPages}</span>
                 <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                 >
                    Next
                 </button>
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorListing;
