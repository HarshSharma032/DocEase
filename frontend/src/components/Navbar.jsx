import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                DocBook
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {!user.isDoctor && user.role !== 'Admin' && (
                  <Link to="/doctors" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors text-sm font-medium">
                    Find Doctors
                  </Link>
                )}
                <Link 
                  to={user.role === 'Admin' ? "/admin-dashboard" : (user.isDoctor ? "/doctor-dashboard" : "/patient-dashboard")} 
                  className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors text-sm font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="flex items-center gap-2 group p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 hidden lg:inline">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
