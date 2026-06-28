import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Sun, Moon, Menu, LogOut, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

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
    <header
      className={`h-16 md:h-20 w-full border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 font-sans transition-colors duration-300
        ${darkMode
          ? 'bg-slate-900/90 backdrop-blur-md border-slate-700'
          : 'bg-white/85 backdrop-blur-md border-slate-200/80'
        }`}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className={`lg:hidden p-2 rounded-xl mr-2 transition-colors
          ${darkMode
            ? 'text-slate-400 hover:text-slate-100 border-slate-700'
            : 'text-slate-600 hover:text-slate-900 border-slate-200/60'
          } border`}
      >
        <Menu size={18} />
      </button>

      {/* Search bar – hidden on mobile */}
      <div className="w-64 xl:w-80 relative hidden lg:block">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}
          size={15}
        />
        <input
          type="text"
          placeholder="Global institutional search..."
          className={`w-full rounded-xl pl-11 pr-4 py-2 text-xs placeholder-slate-400 focus:outline-none transition-colors
            ${darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-slate-50 border-slate-200 text-slate-800'
            } border`}
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 md:p-2.5 rounded-xl border shadow-3xs transition-colors
            ${darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notification bell */}
        <div
          className={`relative p-2 md:p-2.5 rounded-xl border shadow-3xs cursor-pointer transition-colors
            ${darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
        >
          <Bell size={15} />
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-4
              ${darkMode ? 'ring-slate-900' : 'ring-white'}`}
          />
        </div>

        {/* User profile dropdown trigger */}
        <div className="relative ml-1 md:ml-2">
          <button
            onClick={() => !loading && setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 md:gap-3 border rounded-xl p-1 md:p-1.5 pr-2 md:pr-4 shadow-3xs transition-all
              ${showDropdown
                ? darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'
                : darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
          >
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[11px] md:text-xs font-black text-white uppercase shrink-0
              ${darkMode ? 'bg-slate-600' : 'bg-slate-950'}`}
            >
              {userInitials}
            </div>

            <div className="text-left hidden sm:block">
              <p className={`text-xs font-black tracking-tight leading-none mb-1 max-w-[120px] truncate
                ${darkMode ? 'text-slate-100' : 'text-slate-950'}`}
              >
                {userName}
              </p>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold block
                ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}
              >
                {userRole} Node
              </span>
            </div>
          </button>

          {/* Dropdown menu with animation */}
          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2.5 w-56 border rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 z-50
                    ${darkMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-200'
                    }`}
                >
                  <Link
                    to={getProfileRoute()}
                    onClick={() => setShowDropdown(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors
                      ${darkMode
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <UserCheck size={14} className={darkMode ? 'text-slate-400' : 'text-slate-400'} />
                    <span>View Institutional Profile</span>
                  </Link>

                  <div className={`h-px my-1 w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />

                  <button
                    onClick={handleTerminateSession}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left font-bold text-xs transition-colors
                      ${darkMode
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <LogOut size={14} className={darkMode ? 'text-slate-400' : 'text-slate-400'} />
                    <span>Terminate Secure Session</span>
                  </button>

                  <button
                    onClick={handleDeleteAccountSession}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left font-bold text-xs transition-colors
                      ${darkMode
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-red-600 hover:bg-red-50/60'
                      }`}
                  >
                    <Trash2 size={14} className={darkMode ? 'text-red-400' : 'text-red-400'} />
                    <span>Delete Account Permanently</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;