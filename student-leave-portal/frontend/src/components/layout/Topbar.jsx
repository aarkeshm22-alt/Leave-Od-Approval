import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, Sun, Moon, Menu, LogOut, UserCheck, Trash2 } from 'lucide-react'; 
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { AnimatePresence } from 'framer-motion';

const Topbar = ({ onMenuToggle }) => {
  const { user, logout, deleteAccount, loading } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const userName = user?.firstName || user?.lastName 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
    : "Loading Identity...";

  // Standardize the role value coming from your auth payload
  const userRole = user?.role || "HOD";

  // DYNAMIC ROUTING ENGINE: Safely maps the profile route to match folder hierarchy (hod, mentor, student)
  const getProfileRoute = () => {
    const roleKey = userRole.toLowerCase().trim();
    if (roleKey === 'mentor') return '/mentor/profile';
    if (roleKey === 'student') return '/student/profile';
    return '/hod/profile'; // Default safe fallback
  };

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : "Ω";

  const handleTerminateSession = async () => {
    setShowDropdown(false);
    logout();
    navigate('/login');
  };

  const handleDeleteAccountSession = async () => {
    const userConfirmed = window.confirm(
      "CRITICAL ACTION REQUIRED:\n\nAre you absolutely sure you want to permanently delete your account? This will erase your credentials from the database and cannot be undone."
    );

    if (userConfirmed) {
      try {
        setShowDropdown(false);
        await deleteAccount();
        alert("Account records successfully deleted.");
        navigate('/login');
      } catch (error) {
        console.error("Failed to execute database profile deletion:", error);
        alert("Error removing record variables. Please try again.");
      }
    }
  };

  return (
    <header className="h-16 md:h-20 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
      
      <button onClick={onMenuToggle} className="lg:hidden p-2 text-slate-600 hover:text-slate-900 border border-slate-200/60 rounded-xl mr-2">
        <Menu size={18} />
      </button>

      <div className="w-64 xl:w-80 relative hidden lg:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input type="text" placeholder="Global institutional search..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none" />
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button onClick={toggleTheme} className="p-2 md:p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 shadow-3xs">
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative p-2 md:p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer shadow-3xs">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-4 ring-white" />
        </div>

        <div className="relative ml-1 md:ml-2">
          <button 
            onClick={() => !loading && setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 md:gap-3 border rounded-xl p-1 md:p-1.5 pr-2 md:pr-4 shadow-3xs transition-all ${showDropdown ? 'bg-slate-100' : 'bg-slate-50'}`}
          >
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-950 flex items-center justify-center text-[11px] md:text-xs font-black text-white uppercase shrink-0">
              {userInitials}
            </div>
            
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-slate-950 tracking-tight leading-none mb-1 max-w-[120px] truncate">
                {userName}
              </p>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-700 block">
                {userRole} Node
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="z-50 absolute right-0 mt-2.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5">
                  
                  {/* 🔄 UPDATED: Routes to /hod/profile, /mentor/profile, or /student/profile dynamically */}
                  <Link 
                    to={getProfileRoute()} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs"
                  >
                    <UserCheck size={14} className="text-slate-400" />
                    <span>View Institutional Profile</span>
                  </Link>
                  
                  <div className="h-px bg-slate-100 my-1 w-full" />

                  <button onClick={handleTerminateSession} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-slate-700 hover:bg-slate-50 font-bold text-xs">
                    <LogOut size={14} className="text-slate-400" />
                    <span>Terminate Secure Session</span>
                  </button>

                  <button onClick={handleDeleteAccountSession} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-red-600 hover:bg-red-50/60 font-bold text-xs">
                    <Trash2 size={14} className="text-red-400" />
                    <span>Delete Account Permanently</span>
                  </button>

                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;