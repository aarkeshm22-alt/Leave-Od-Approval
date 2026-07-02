import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AnimatePresence } from 'framer-motion';

const Topbar = ({ onMenuToggle }) => {
  const { user, logout, deleteAccount, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Derive profile name
  const profileName = user?.firstName || user?.lastName
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user?.name || "Verified Identity";

  // First letter of first name + first letter of last name (or fallback)
   const userInitials = profileName
    ? profileName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profileName.slice(0, 2).toUpperCase();

  const userRole = user?.role || "HOD";

  const getProfileRoute = () => {
    const roleKey = userRole.toLowerCase().trim();
    if (roleKey === 'mentor') return '/mentor/profile';
    if (roleKey === 'student') return '/student/profile';
    return '/hod/profile';
  };

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
        alert("Account was successfully deleted.");
        navigate('/login');
      } catch (error) {
        console.error("Failed to execute database profile deletion:", error);
        alert("Error removing record variables. Please try again.");
      }
    }
  };

  return (
    <header className="h-16 md:h-20 w-full border-b border-gray-300 bg-white/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-sans">
      
      {/* Mobile menu toggle */}
      <button 
        onClick={onMenuToggle} 
        className="lg:hidden p-2 text-blue-900 hover:text-amber-500 border border-gray-300 rounded-xl mr-2"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        
        {/* User profile dropdown */}
        <div className="relative ml-1 md:ml-2">
          <button 
            onClick={() => !loading && setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 md:gap-3 border rounded-xl p-1 md:p-1.5 pr-2 md:pr-4 shadow-sm transition-all ${
              showDropdown ? 'bg-gray-100' : 'bg-gray-50'
            }`}
          >
            {/* Avatar with navy background, white text */}
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-900 flex items-center justify-center text-[11px] md:text-xs font-black text-white uppercase shrink-0">
              {userInitials}
            </div>
            
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-blue-900 tracking-tight leading-none mb-1 max-w-[120px] truncate">
                {profileName}
              </p>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 block">
                {userRole}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="z-50 absolute right-0 mt-2.5 w-56 bg-white border border-gray-300 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5">
                  
                  <Link 
                    to={getProfileRoute()} 
                    onClick={() => setShowDropdown(false)} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-blue-900 hover:bg-amber-50 font-bold text-xs"
                  >
                    <UserCheck size={14} className="text-amber-500" />
                    <span>View Profile</span>
                  </Link>
                  
                  <div className="h-px bg-gray-200 my-1 w-full" />

                  <button 
                    onClick={handleTerminateSession} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-blue-900 hover:bg-amber-50 font-bold text-xs"
                  >
                    <LogOut size={14} className="text-amber-500" />
                    <span>Terminate Session</span>
                  </button>

                  <button 
                    onClick={handleDeleteAccountSession} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left text-red-600 hover:bg-red-50/60 font-bold text-xs"
                  >
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